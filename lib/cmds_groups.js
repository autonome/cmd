// activate a named group in the browser
function activateGroup(name) {
  return new Promise(function(resolve, reject) {
    var utils = require('sdk/window/utils'),
        window = utils.getMostRecentBrowserWindow();

    window.TabView._initFrame(function() {
      var groupItems = window.TabView._window.GroupItems.groupItems;
      var group = groupItems.find(function(groupItem) {
        return groupItem.getTitle() == name;
      });

      var tabItem = group.getActiveTab();
      // TODO: switching groups while on a pinned tab isn't working
      //if (window.gBrowser.selectedTab.pinned)
        //window.TabView.GroupItems.updateActiveGroupItemAndTabBar(tabItem, {dontSetActiveTabInGroup: true});
      //else
        window.gBrowser.selectedTab = tabItem.tab;

      resolve();
    });
  });
}
exports.activateGroup = activateGroup;

// move the currently focused tab to a named group
function moveActiveTabToGroup(name) {
  return new Promise(function(resolve, reject) {
    var utils = require('sdk/window/utils'),
        window = utils.getMostRecentBrowserWindow();

    window.TabView._initFrame(function() {
      var groupItems = window.TabView._window.GroupItems.groupItems;
      var group = groupItems.find(function(groupItem) {
        return groupItem.getTitle() == name;
      });

      var tabItem = window.gBrowser.selectedTab;

      window.TabView.moveTabTo(tabItem, group.id)

      resolve();
    });
  });
}
exports.moveActiveTabToGroup = moveActiveTabToGroup;

// get the named tab groups in an array
// excludes hidden and unnamed groups
var getGroupNames = new Promise(function(resolve, reject) {
  var utils = require('sdk/window/utils'),
      window = utils.getMostRecentBrowserWindow();

  window.TabView._initFrame(function() {
    var groupItems = window.TabView._window.GroupItems.groupItems;
    var names = groupItems.map(function(groupItem) {
      // if group has title, it's not hidden and there is no active group or
      // the active group id doesn't match the group id, a group menu item
      // would be added.
      var title = groupItem.getTitle();
      if (!groupItem.hidden && groupItem.getTitle().trim()) {
        return title;
      }
    })
    resolve(names);
  });
});

exports.getGroupNames = getGroupNames;

function generateOpenGroupCmd(groupName) {
  return {
    name: 'open group ' + groupName,
    execute: function() {
      groups.activateGroup(groupName).then(function() {
        // hell yes it worked
      })
    }
  }
}

function generateMoveToGroupCmd(groupName) {
  return {
    name: 'move tab to group ' + groupName,
    execute: function() {
      groups.moveActiveTabToGroup(groupName).then(function() {
        // hell yes it worked
      })
    }
  }
}

// get tab group names and generate commands for:
// - moving current tab to a named group
// - opening a named group
//
// bugs:
// - new groups aren't added even after cmd refresh
// - issues with empty named groups
exports.commands = new Promise(function(resolve, reject) {
  getGroupNames.then(function(names) {

    var cmds = names.map(generateOpenGroupCmd).
               concat(names.map(generateMoveToGroupCmd))
    resolve(cmds);
  })
})
