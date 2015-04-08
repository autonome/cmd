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

*/


// initialize content & panel
const panels = require('sdk/panel'),
      self = require('sdk/self');

var cmdPanel = panels.Panel({
  label: 'Cmds',
  width: 400,
  height: 54,
  contentURL: self.data.url('commands-autocomplete.html'),
  contentScriptFile: self.data.url('commands-autocomplete.js'),
  contentScriptWhen: 'ready',
  position: {
    top: 100,
  }
});

cmdPanel.on('show', function(msg) {
  cmdPanel.port.emit('show');
});

cmdPanel.port.on('execute', function(msg) {
  if (cmds[msg.name]) {
    cmds[msg.name].execute()
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
var cmds = {}

// add a command
// command is an object with two properties:
// - name: string label
// - execute: method
function addCommand(command) {
  cmds[command.name] = command;
}

// send array of command names over to content
function refreshCommandUI() {
  cmdPanel.port.emit('commands', {
    commands: Object.keys(cmds)
  })
}

function refreshCommandSource(cmdSrc) {
  cmdSrc.commands.then(function(commands) {
    commands.forEach(addCommand)
    refreshCommandUI()
  }, function(err) {
    console.error('Error getting commands for module', err)
  })
}

// TODO: fix to only refresh command UI once all command sources are refreshed
// but to also allow a way to refresh per command source
function refreshCommands() {
  var modules = [
    // Commands to activate a bookmarklet on the current page
    require('./cmds_bookmarklets'),
    // All menu commands from Firefox
    require('./cmds_firefox'),
    // Commands to create new Google doc or spreadsheet
    require('./cmds_gdocs'),
    // commands to activate named groups and moved the
    // Active tab to a named group
    require('./cmds_groups')
  ]
  modules.forEach(refreshCommandSource)
}

refreshCommands()

// Do something terrible, like update command list every 5 minutes.
// TODO: Make a standardize API for command sources, with an event
// for notifying to refresh.
//require('sdk/timers').setInterval(refreshCommands, 3000)

/*
function awesomebar(search, cb) {
  var sent = false
  require('awesomedata').search({
    search: 'mozilla',
    onResult: function onResult(result) {
      console.log('onResult', result)
      cb(result) 
    },
    onComplete: function onComplete() {
      console.log('onComplete')
    }
  })
}

var data = require('sdk/self').data,
    pageMod = require('sdk/page-mod'),
    currentWorker = null
pageMod.PageMod({
  include: '*',
  contentScriptFile: data.url('peek.js'),
  onAttach: function(worker) {
    currentWorker = worker
    //worker.port.on('peek', function(search) {
    //  awesomebar(search, function(results) {
    //  })
    //})
  }
})
*/
