/*


*/


// initialize content & panel
const panels = require('sdk/panel'),
      self = require('sdk/self');

var cmdPanel = panels.Panel({
  label: 'Cmds',
  width: 600,
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

cmdPanel.on('show', function(msg) {
  cmdPanel.port.emit('hide');
});

cmdPanel.port.on('execute', function(msg) {
  if (cmds[msg.name]) {
    cmds[msg.name].execute(msg.typed)
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
function updateCommandUI() {
  cmdPanel.port.emit('commands', {
    commands: Object.keys(cmds)
  })
}

function refreshCommandSource(cmdSrc) {
  cmdSrc.commands.then(function(commands) {
    commands.forEach(addCommand)
    updateCommandUI()
  }, function(err) {
    console.error('Error getting commands for module', err)
  })
}

function initializeCommandSources() {
  var modules = [
    // Commands to activate a bookmarklet on the current page
    require('./cmds_bookmarklets'),
    // All menu commands from Firefox
    require('./cmds_firefox'),
    // Commands to create new Google doc or spreadsheet
    require('./cmds_gdocs'),
    // commands to activate named groups and moved the
    // Active tab to a named group
    require('./cmds_groups'),
    // Session management
    require('./cmds_sessions')
  ]

  // Add commands from each source
  modules.forEach(refreshCommandSource)

  // Listen for command updates from each source
  modules.forEach(function(src) {
    src.on('commands', function(commands) {
      commands.forEach(addCommand)
      updateCommandUI()
    })
  })
}

initializeCommandSources()

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
