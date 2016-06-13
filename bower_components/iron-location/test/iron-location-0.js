
  'use strict';

  function timePasses(ms) {
    return new Promise(function(resolve) {
      window.setTimeout(function() {
        resolve();
      }, ms);
    });
  }

  function makeAbsoluteUrl(path) {
    return window.location.protocol + '//' + window.location.host + path;
  }

  // A window.history.replaceState wrapper that's smart about baseURI.
  function replaceState(path) {
    window.history.replaceState({}, '', makeAbsoluteUrl(path));
  }

  /**
   * We run the iron location tests with a couple different page configurations
   * (e.g. with and withoug a base URI), so we define the test set as a function
   * that we call in each of these configurations.
   */
  function ironLocationTests() {
    suite('when used solo', function() {
      var urlElem;
      setup(function() {
        urlElem = fixture('Solo');
      });
      test('basic functionality with #hash urls', function() {
        // Initialized to the window location's hash.
        expect(window.location.hash).to.be.equal(urlElem.hash);

        // Changing the urlElem's hash changes the URL
        urlElem.hash = '/lol/ok';
        expect(window.location.hash).to.be.equal('#/lol/ok');

        // Changing the hash via normal means changes the urlElem.
        var anchor = document.createElement('a');
        var base =
            window.location.protocol + '//' + window.location.host +
            window.location.pathname;
        anchor.href = base + '#/wat';
        document.body.appendChild(anchor);
        anchor.click();
        // In IE10 it appears that the hashchange event is asynchronous.
        return timePasses(10).then(function() {
          expect(urlElem.hash).to.be.equal('/wat');
        });
      });
      test('basic functionality with paths', function() {
        // Initialized to the window location's path.
        expect(window.location.pathname).to.be.equal(urlElem.path);

        // Changing the urlElem's path changes the URL
        urlElem.path = '/foo/bar';
        expect(window.location.pathname).to.be.equal('/foo/bar');

        // Changing the path and sending a custom event on the window changes
        // the urlElem.
        replaceState('/baz');
        window.dispatchEvent(new CustomEvent('location-changed'));
        expect(urlElem.path).to.be.equal('/baz');
      });
      test('assigning to a relative path URL', function() {
        urlElem.path = '/foo/bar';
        expect(window.location.pathname).to.be.equal('/foo/bar');

        // A relative path is treated as an absolute one, just with a
        // missing leading slash.
        urlElem.path = 'baz';
        expect(window.location.pathname).to.be.equal('/baz');
      });
      test('basic functionality with ?key=value params', function() {
        // Initialized to the window location's params.
        expect(urlElem.query).to.be.eq('');

        // Changing location.search and sending a custom event on the window
        // changes the urlElem.
        replaceState('/?greeting=hello&target=world');
        window.dispatchEvent(new CustomEvent('location-changed'));
        expect(urlElem.query).to.be.equal('greeting=hello&target=world');

        // Changing the urlElem's query changes the URL.
        urlElem.query = 'greeting=hello&target=world&another=key';
        expect(window.location.search).to.be.equal(
            '?greeting=hello&target=world&another=key');
      });
    });
    suite('when used with other iron-location elements', function() {
      var otherUrlElem;
      var urlElem;
      setup(function() {
        var elems = fixture('Together');
        urlElem = elems.querySelector('#one');
        otherUrlElem = elems.querySelector('#two');
      });
      function assertHaveSameUrls(urlElemOne, urlElemTwo) {
        expect(urlElemOne.path).to.be.equal(urlElemTwo.path);
        expect(urlElemOne.hash).to.be.equal(urlElemTwo.hash);
        expect(urlElemOne.query).to.be.equal(urlElemTwo.query);
      }
      test('coordinate their changes (by firing events on window)', function() {
        assertHaveSameUrls(urlElem, otherUrlElem);

        urlElem.path = '/a/b/c';
        assertHaveSameUrls(urlElem, otherUrlElem);

        otherUrlElem.query = 'alsdkjflaksjfd=alksjfdlkajsdfl';
        assertHaveSameUrls(urlElem, otherUrlElem);

        urlElem.hash = 'lkjljifosjkldfjlksjfldsjf';
        assertHaveSameUrls(urlElem, otherUrlElem);
      });
    });
    suite('when intercepting links', function() {

      /**
       * Clicks the given link while an iron-location element with the given
       * urlSpaceRegex is in the same document. Returns whether the
       * iron-location prevented the default behavior of the click.
       *
       * No matter what, it prevents the default behavior of the click itself
       * to ensure that no navigation occurs (as that would interrupt
       * running and reporting these tests!)
       */
      function isClickCaptured(anchor, urlSpaceRegex) {
        var defaultWasPrevented;
        function handler(event) {
          expect(event.target).to.be.eq(anchor);
          defaultWasPrevented = event.defaultPrevented;
          event.preventDefault();
          expect(event.defaultPrevented).to.be.eq(true);
        }
        window.addEventListener('click', handler);
        var ironLocation = fixture('Solo');
        if (urlSpaceRegex != null) {
          ironLocation.urlSpaceRegex = urlSpaceRegex;
        }
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.removeEventListener('click', handler);
        return defaultWasPrevented;
      }

      test('simple link to / is intercepted', function() {
        var anchor = document.createElement('a');
        if (document.baseURI !== window.location.href) {
          anchor.href = makeAbsoluteUrl('/');
        } else {
          anchor.href = '/';
        }

        expect(isClickCaptured(anchor)).to.be.eq(true);
      });

      test('link that matches url space is intercepted', function() {
        var anchor = document.createElement('a');
        anchor.href = makeAbsoluteUrl('/foo');

        expect(isClickCaptured(anchor, '/fo+')).to.be.eq(true);
      });

      test('link that doesn\'t match url space isn\'t intercepted', function() {
        var anchor = document.createElement('a');
        anchor.href = makeAbsoluteUrl('/bar');

        expect(isClickCaptured(anchor, '/fo+')).to.be.eq(false);
      });

      test('link to another domain isn\'t intercepted', function() {
        var anchor = document.createElement('a');
        anchor.href = 'http://example.com/';

        expect(isClickCaptured(anchor)).to.be.eq(false);
      });

      test('a link with target=_blank isn\'t intercepted', function() {
        var anchor = document.createElement('a');
        anchor.href = makeAbsoluteUrl('/');
        anchor.target = '_blank';

        expect(isClickCaptured(anchor)).to.be.eq(false);
      })
    });

    suite('supports doing synchronous redirection', function() {
      test('of the hash portion of the URL', function() {
        expect(window.location.hash).to.be.equal('');
        var redirector = fixture('RedirectHash');
        expect(window.location.hash).to.be.equal('#redirectedTo');
        expect(redirector.hash).to.be.equal('redirectedTo');
        redirector.hash = 'newHash';
        expect(window.location.hash).to.be.equal('#redirectedTo');
        expect(redirector.hash).to.be.equal('redirectedTo');
      });

      test('of the path portion of the URL', function() {
        expect(window.location.pathname).to.not.be.equal('/redirectedTo');
        var redirector = fixture('RedirectPath');
        expect(window.location.pathname).to.be.equal('/redirectedTo');
        expect(redirector.path).to.be.equal('/redirectedTo');
        redirector.path = '/newPath';
        expect(window.location.pathname).to.be.equal('/redirectedTo');
        expect(redirector.path).to.be.equal('/redirectedTo');
      });

      test('of the query portion of the URL', function() {
        expect(window.location.search).to.be.equal('');
        var redirector = fixture('RedirectQuery');
        expect(window.location.search).to.be.equal('?redirectedTo');
        expect(redirector.query).to.be.equal('redirectedTo');
        redirector.query = 'newQuery';
        expect(window.location.search).to.be.equal('?redirectedTo');
        expect(redirector.query).to.be.equal('redirectedTo');
      });
    });
  }

  suite('<iron-location>', function () {
    var initialUrl;
    setup(function() {
      initialUrl = window.location.href;
    });
    teardown(function(){
      window.history.replaceState({}, '', initialUrl);
    });

    ironLocationTests();

    suite('with a base URI', function() {
      var baseElem;
      setup(function() {
        expect(document.baseURI).to.be.equal(window.location.href);
        baseElem = document.createElement('base');
        var href = 'https://example.com/i/dont/exist/obviously'
        baseElem.href = href;
        document.head.appendChild(baseElem);
        expect(document.baseURI).to.be.equal(href);
      });
      teardown(function() {
        document.head.removeChild(baseElem);
      });

      ironLocationTests();
    });
  });

