(async () => {

let commands = {};

browser.commands.onCommand.addListener(function(command) {
  if (command == "open-command-ui") {
    initializeCommandSources();
    setup();
  }
});

function setup() {
  // Add content script to active tab
  browser.tabs.executeScript({
    file: 'content-script.js'
  });

  // Set up communication port
  browser.tabs.query({active: true}).then(tabs => {
    let port = browser.tabs.connect(tabs[0].id);

    let names = Object.keys(commands);

    // Send command list
    port.postMessage({ commands: names });

    port.onMessage.addListener(msg => {
      if (msg.action && msg.action == 'execute') {
        if (commands[msg.name]) {
          commands[msg.name].execute();
        }
      }
    });
  });
}

/*
command is an object with two properties:

- name: string label
- execute: method

*/
function addCommand(command) {
  commands[command.name] = command;
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
  loadBookmarklets();

  /*
  var modules = [
    // Commands to activate a bookmarklet on the current page
    require('./commands_bookmarklets'),
    // All menu commands from Firefox
    require('./commands_firefox'),
    // Commands to create new Google doc or spreadsheet
    require('./commands_gdocs'),
    // commands to activate named groups and moved the
    // Active tab to a named group
    require('./commands_groups'),
    // Session management
    require('./commands_sessions')
  ];

  // Add commands from each source
  modules.forEach(refreshCommandSource);

  // Listen for command updates from each source
  modules.forEach(function(src) {
    src.on('commands', function(commands) {
      commands.forEach(addCommand);
      updateCommandUI();
    });
  });
  */
}

async function loadBookmarklets() {
  // add bookmarklets as commands
  let bmarklets = await browser.bookmarks.search({ query: 'javascript:'} );
  let b = bmarklets[0];
  bmarklets.map(b => {
    return {
      name: b.title,
      async execute() {
        let tabs = await browser.tabs.query({active:true});
        browser.tabs.executeScript(tabs.id, {
          code: b.url.replace('javascript:', '')
        });
      }
    };
  }).forEach(addCommand);
}

})();
