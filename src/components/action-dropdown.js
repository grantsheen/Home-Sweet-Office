
const {
  get_positive_enabled_goals
} = require('libs_common/goal_utils')

const {
  get_goal_info,
  get_positive_goal_info
} = require('libs_common/intervention_info')

const {
  log_action
} = require('libs_frontend/intervention_log_utils')

const {
  close_tab_with_id
} = require('libs_common/tab_utils')

Polymer({
  is: 'action-dropdown',
  properties: {
    goals: Array,
    label: {
      type: String,
      observer: 'label_changed'
    },
    defaultCallToAction: String
  },
  label_changed: function(newLabel, oldLabel) {
    if (newLabel != null && newLabel.length > 0) {
      // TODO: add or remove no-label-float from the paper dropdown menu.
      // eg something like this.$.paper_dropdown_menu.attr(no-label-float)
    }
  },
  ready: async function() {
    // Populate goals array
    let goals = await get_positive_enabled_goals()
    var goalsList = Object.values(goals)
    goalsList.push(await get_goal_info())
    this.goals = goalsList

    // Pick default option
    var goal = await get_positive_goal_info()
    if (goal == null) {
      goal = await get_goal_info()
    }
    if (goal == null) {
      this.defaultCallToAction = "Close Tab"
    } else {
      this.defaultCallToAction = goal.call_to_action
    }
  },
  call_to_action_clicked: async function(evt) {
    console.log('call_to_action_clicked called')
    let goal = evt.target.goal
    if (goal.is_positive) {
      log_action({'positive': 'positive goal site call-to-action clicked'})
      window.location.href = 'https://' + goal.domain
    } else {
      log_action({'positive': 'close-tab-button clicked'})
      close_tab_with_id(get_tab_id())
    }
  }
})

const {
  get_tab_id
} = require('libs_common/intervention_info')