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
    console.log('sending commands', names);

    // Send command list
    port.postMessage({ commands: names });

    port.onMessage.addListener(msg => {
      if (msg.action && msg.action == 'execute') {
        if (commands[msg.name]) {
          commands[msg.name].execute(msg);
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
  sourceBookmarklets();
  sourceBookmark();
  sourceEmail();

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

async function sourceBookmarklets() {
  // add bookmarklets as commands
  let bmarklets = await browser.bookmarks.search({ query: 'javascript:'} );
  let b = bmarklets[0];
  bmarklets.map(b => {
    return {
      name: b.title,
      async execute() {
        let tabs = await browser.tabs.query({active:true});
        browser.tabs.executeScript(tabs[0].id, {
          code: b.url.replace('javascript:', '')
        });
      }
    };
  }).forEach(addCommand);
}

async function sourceBookmark() {
  addCommand({
    name: 'bookmark current page',
    async execute() {
      let tab = await browser.tabs.query({active:true});
      let node = await browser.bookmarks.create({
        title: tab[0].title,
        url: tab[0].url
      });
    }
  });
}

async function sourceEmail() {
  addCommand({
    name: 'email page to',
    async execute(msg) {
      let tabs = await browser.tabs.query({active:true});
      let email = msg.typed.replace(msg.name, '').trim();
      let url =
        'mailto:' + email +
        '?subject=Web%20page!&body=' +
        encodeURIComponent(tabs[0].title) +
        '%0D%0A' +
        encodeURIComponent(tabs[0].url);
      tabs[0].url = url;
    }
  });
}

})();
