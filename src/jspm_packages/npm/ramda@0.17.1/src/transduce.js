var _reduce = require('./internal/_reduce');
var _xwrap = require('./internal/_xwrap');
var curryN = require('./curryN');


/**
 * Initializes a transducer using supplied iterator function. Returns a single item by
 * iterating through the list, successively calling the transformed iterator function and
 * passing it an accumulator value and the current value from the array, and then passing
 * the result to the next call.
 *
 * The iterator function receives two values: *(acc, value)*. It will be wrapped as a
 * transformer to initialize the transducer. A transformer can be passed directly in place
 * of an iterator function.  In both cases, iteration may be stopped early with the
 * `R.reduced` function.
 *
 * A transducer is a function that accepts a transformer and returns a transformer and can
 * be composed directly.
 *
 * A transformer is an an object that provides a 2-arity reducing iterator function, step,
 * 0-arity initial value function, init, and 1-arity result extraction function, result.
 * The step function is used as the iterator function in reduce. The result function is used
 * to convert the final accumulator into the return type and in most cases is R.identity.
 * The init function can be used to provide an initial accumulator, but is ignored by transduce.
 *
 * The iteration is performed with R.reduce after initializing the transducer.
 *
 * @func
 * @memberOf R
 * @category List
 * @see R.reduce, R.reduced, R.into
 * @sig (c -> c) -> (a,b -> a) -> a -> [b] -> a
 * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
 *        current element from the array. Wrapped as transformer, if necessary, and used to
 *        initialize the transducer
 * @param {*} acc The initial accumulator value.
 * @param {Array} list The list to iterate over.
 * @return {*} The final, accumulated value.
 * @example
 *
 *      var numbers = [1, 2, 3, 4];
 *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
 *
 *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
 */
module.exports = curryN(4, function transduce(xf, fn, acc, list) {
  return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
});
