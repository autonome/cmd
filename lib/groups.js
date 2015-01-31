function activateGroup(name) {
  console.log('activateGroup', name);
  return new Promise(function(resolve, reject) {
    var utils = require('sdk/window/utils'),
        window = utils.getMostRecentBrowserWindow();

    var self = this;
    window.TabView._initFrame(function() {
      console.log('frame inited');
      var groupItems = window.TabView._window.GroupItems.groupItems;
      var group = groupItems.find(function(groupItem) {
        return groupItem.getTitle() == name;
      });
      console.log('found match', group.getTitle());

      //
      var tabItem = group.getActiveTab();
      console.log('tab', tabItem)
      //if (window.gBrowser.selectedTab.pinned)
        window.TabView.GroupItems.updateActiveGroupItemAndTabBar(tabItem, {dontSetActiveTabInGroup: true});
      //else
        //window.gBrowser.selectedTab = tabItem.tab;
      //

      //window.TabView._window.UI.setActive(group);
      resolve();
    });
  });
}
exports.activateGroup = activateGroup;

var getGroupNames = new Promise(function(resolve, reject) {
  var utils = require('sdk/window/utils'),
      window = utils.getMostRecentBrowserWindow();

  var self = this;
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
