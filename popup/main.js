(async () => {

const DEBUG = 0;

dbg('POPUP INIT');

let commands = {};

function onCommandsUpdated () {
  window.dispatchEvent(new CustomEvent('cmd-update-commands', { detail: commands }));
  dbg('main sending updated commands out', Object.keys(commands))
}

window.addEventListener('DOMContentLoaded', initializeCommandSources);

/*
command is an object with two properties:

- name: string label
- execute: method

TODO:
- add canRun check - eg, switchContainer cannot run on about: urls
- enable command generation at call time (instead of in advance)

*/
function addCommand(command) {
  commands[command.name] = command;
  onCommandsUpdated();
}

function initializeCommandSources() {
  dbg('initializeCommandSources');
  sourceBookmarklets();
  sourceBookmark();
  //sourceEmail();
  sourceGoogleDocs();
  sourceSendToWindow();
  sourceSwitchToWindow();
  sourceNewContainerTab();
  sourceSwitchTabContainer();
  onCommandsUpdated();
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

// FIXME
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

async function sourceSwitchToWindow() {
  const cmdPrefix = 'Switch to window: ';
  const windows = await browser.windows.getAll({});
  windows.forEach((w) => {
    addCommand({
      name: cmdPrefix + w.title,
      async execute(msg) {
        browser.windows.update(w.id, { focused: true });
      }
    });
  });
}

async function sourceNewContainerTab() {
  const cmdPrefix = 'New container tab: ';
  browser.contextualIdentities.query({})
  .then((identities) => {
    if (!identities.length)
      return;
    for (let identity of identities) {
      addCommand({
        name: cmdPrefix + identity.name,
        async execute(msg) {
          browser.tabs.create({url: '', cookieStoreId: identity.cookieStoreId });
        }
      });
    }
  });
}

async function sourceSwitchTabContainer() {
  const cmdPrefix = 'Switch container to: ';
  browser.contextualIdentities.query({})
  .then((identities) => {
    if (!identities.length)
      return;
    for (let identity of identities) {
      addCommand({
        name: cmdPrefix + identity.name,
        async execute(msg) {
          const activeTabs = await browser.tabs.query({currentWindow: true, active: true});
          const tab = activeTabs[0];
          // some risk of losing old tab if new tab was not created successfully
          // but putting remove in creation was getting killed by window close
          // so when execution is moved to background script, try moving this back
          browser.tabs.remove(tab.id);
          browser.tabs.create({url: tab.url, cookieStoreId: identity.cookieStoreId, index: tab.index+1, pinned: tab.pinned }).then(() => {
            // tab remove should be here
          });
        }
      });
    }
  });
}

function dbg(...args) {
  if (DEBUG == 1) {
    console.log(...args)
  }
}

})();
