(async () => {

const DEBUG = 1;

dbg('BACKGROUND INIT');

let commands = {};

browser.commands.onCommand.addListener(function(command) {
  dbg('bg: command...', command);
  if (command == "open-command-ui") {
    dbg('bg: open-command-ui');
    initializeCommandSources();
    setup();
  }
});

async function setup() {
  // Add content script to active tab
  browser.tabs.executeScript({
    file: 'content-script.js'
  });

  // Set up communication port
  browser.tabs.query({active: true}).then(tabs => {
    let port = browser.tabs.connect(tabs[0].id);

    let names = Object.keys(commands);
    dbg('sending commands', names);

    // Send command list
    port.postMessage({ "commands": names });

    port.onMessage.addListener(msg => {
      if (msg.action && msg.action == 'execute') {
        if (commands[msg.name]) {
          dbg('background:execute()', msg);
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

function initializeCommandSources() {
  sourceBookmarklets();
  //sourceBookmark();
  //sourceEmail();
  //sourceGoogleDocs();
  //sourceSendToWindow();
}

async function sourceBookmarklets() {
  // add bookmarklets as commands
  let bmarklets = await browser.bookmarks.search({ query: 'javascript:'} );
  bmarklets.map(b => {
    return {
      name: b.title,
      async execute(cmd) {
        //let tags = cmd.typed.split(' ').filter(w => w != cmd.name)
        //console.log('tags', tags)
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
    name: 'Email page to',
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

async function sourceGoogleDocs() {
  [
    {
      cmd: 'New Google doc',
      url: 'http://docs.google.com/document/create?hl=en'
    },
    {
      cmd: 'New Google sheet',
      url: 'http://spreadsheets.google.com/ccc?new&hl=en'
    }
  ].forEach(function(doc) {
    addCommand({
      name: doc.cmd,
      async execute(msg) {
        await browser.tabs.create({
          url: doc.url
        });
      }
    });
  });
}

async function sourceSendToWindow() {
  const cmdPrefix = 'Move to window: ';
  const windows = await browser.windows.getAll({windowTypes: ['normal']});
  windows.forEach((w) => {
    addCommand({
      name: cmdPrefix + w.title,
      async execute(msg) {
        const activeTabs = await browser.tabs.query({active: true});
        browser.tabs.move(activeTabs[0].id, {windowId: w.id, index: -1});
      }
    });
  });
}

function dbg(...args) {
  if (DEBUG == 1) {
    console.log(...args)
  }
}

})();
