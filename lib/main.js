/*

Phase 0: Proof of concept

* Import existing tab groups
* Switch between them using cli
* Save/restore state when switching [broke]

Phase 1: App state management

* save state at shutdown
* restore state at startup

Phase 2: Some Commands

* support command arguments
* change command to "group {name}"
* add command for "new group {name}"
* add command for "move page to {group name}"

Phase 3: Tabdeath

* hide tab bar
* <esc> to view all pages in group
* <esc> again to view all groups
* mouse, arrow keys and tab to navigate groups/pages
* <enter> on selected group/page to open
* cli also works in these views

Phase 4: Awesomebar

* awesomebar results in cli

*/


// initialize content & panel
const panels = require("sdk/panel");
var cmdPanel = panels.Panel({
  label: "Cmds",
  width: 350,
  height: 54,
  contentURL: require("sdk/self").data.url("commands-autocomplete.html"),
  contentScriptFile: require("sdk/self").data.url("commands-autocomplete.js"),
  contentScriptWhen: "ready"
});

cmdPanel.on('show', function(msg) {
  cmdPanel.port.emit('show');
});

cmdPanel.port.on('execute', function(msg) {
  if (cmds[msg.alias]) {
    cmds[msg.alias].execute()
  }
  cmdPanel.hide()
});

var { Hotkey } = require("sdk/hotkeys");
var showHotKey = Hotkey({
  combo: "accel-shift-;",
  onPress: function() {
    if (!cmdPanel.isShowing) {
      cmdPanel.show();
    }
  }
});

// populate command list
// and ship it over to content
var cmds = {},
    cmdAliases = [];

//
require("commands").search("", function(command) {
  if (command) {
    cmds[command.alias] = command;
    cmdAliases.push(command.alias);
  }
  else {
    cmdPanel.port.emit('commands', {
      commands: cmdAliases
    })
  }
});
//

/*
var groups = require('groups')

// Get groups and populate them as commands
groups.getGroupNames.then(function(names) {
  names.forEach(function(name) {
    var alias = 'Group ' + name
    cmds[alias] = {
      alias: alias,
      execute: function() {
        groups.activateGroup(name).then(function() {
          console.log(name, 'activated!')
        })
      }
    }
    cmdAliases.push(alias)
  })
})
cmdPanel.port.emit('commands', {
  commands: cmdAliases
})
*/
