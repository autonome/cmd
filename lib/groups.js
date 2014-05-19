var storage = require("sdk/simple-storage").storage,
    { Ci, Cc } = require('chrome'),
    ss = Cc["@mozilla.org/browser/sessionstore;1"].
         getService(Ci.nsISessionStore)

// Passes array of groups.
function getGroupsFromSession(cb) {
  var utils = require('sdk/window/utils'),
      window = utils.getMostRecentBrowserWindow(),
      groupDataStr = ss.getWindowValue(window, 'tabview-group'),
      groupData = null,
      newGroupData = {}

  try {
    groupData = JSON.parse(groupDataStr)
  } catch(ex) {
    // no groups, so that's cool
  }

  if (groupData) {
    var numTabs = window.gBrowser.browsers.length;
    for (var index = 0; index < numTabs; index++) {
      var tab = window.gBrowser.tabContainer.childNodes[index],
          tabGroupDataStr = ss.getTabValue(tab, 'tabview-tab'),
          tabGroupData = JSON.parse(tabGroupDataStr),
          groupId = tabGroupData.groupID,
          key = groupData[groupId].title || 'NoTitle' + groupId

      if (!newGroupData[ key ]) {
        var state = {"windows":[{"tabs": [] }]}
        newGroupData[ key ] = state
      }
      var tabData = JSON.parse(ss.getTabState(tab))
      if (tabData.extData['tabview-tab'])
        delete tabData.extData['tabview-tab']
      newGroupData[ key ].windows[0].tabs.push(tabData)
    }
  }

  cb(newGroupData)
}

// Blindly gets all groups from Firefox session data
// and copies to our storage.
// * Destructive: overwrites existing groups with same title.
// * Currently only called on first run.
//
function importGroups(cb) {
  getGroupsFromSession(function(groups) {
    storage.groups = groups
    cb(groups)
  })
}

function saveState() {
  if (storage.activeGroup) {
    var state = JSON.parse(ss.getBrowserState())
    console.log('SAVESTATE', storage.activeGroup, state)
    storage.groups[storage.activeGroup] = state
  }
  else {
    storage.lastBrowserState = JSON.parse(ss.getBrowserState())
  }
}

function activateGroup(name) {
  return new Promise(function(resolve, reject) {
    if (storage.groups[name]) {
      saveState()
      var state = JSON.stringify(storage.groups[name])
      console.log('ACTIVATING', name, state)
      ss.setBrowserState(state)
      storage.activeGroup = name
      resolve()
    }
  })
}
exports.activateGroup = activateGroup;

exports.getGroupNames = new Promise(function(resolve, reject) {
  resolve(Object.keys(storage.groups))
});

(function init() {
  // RESET GROUPS for testing
  //storage.groups = null
  //storage.activeGroup = null

  // First run!
  if (!storage.groups) {
    console.log('no groups, importing')
    storage.groups = {}
    importGroups(function(groups) {
      console.log('imported')
    })
  }
  //console.log(storage.groups)
  if (storage.activeGroup) {
    console.log('STARTUP, activating', storage.activeGroup)
    activateGroup(storage.activeGroup)
  }
})()

require('sdk/system/unload').when(function() {
  console.log('SHUTDOWN, saving')
  saveState()
})

