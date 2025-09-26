import { dbg, notify } from './utils.js';

/*

TODO
- handle group conflicts/overwrites/whatever
- handle invalid group names
- handle empty groups

*/

const STG_PREFIX = 'cmd:group:';
const STG_TYPE = 'local';
const storage = browser.storage[STG_TYPE];

const storeGroup = async (key, value) => {
  const storageKey = `${STG_PREFIX}${key}`;

  const toStore = {};
  toStore[storageKey] = value;
  
  await storage.set(toStore);
};

const getGroup = async (key) => {
  const storageKey = `${STG_PREFIX}${key}`;
  const result = await storage.get(storageKey);
  return result[storageKey] || null;
};

const deleteGroup = async (key) => {
  const storageKey = `${STG_PREFIX}${key}`;
  await storage.remove(storageKey);
};

const getGroupNames = async () => {
  const all = await storage.get(null);
  return Object.keys(all)
    .filter(k => k.startsWith(STG_PREFIX))
    .map(k => k.replace(STG_PREFIX, ''));
};


const urlsForActiveWindow = async () => {
  const tabs = await browser.tabs.query({ currentWindow: true, });
  return [... new Set(tabs.map(tab => tab.url))];
};

// Export commands
const strings = {
  OPEN_GROUP: 'open group',
  DELETE_GROUP: 'delete group',
  SAVE_AS_GROUP: 'save as group',
};

const refreshGroupCommands = async () => {
  const names = await getGroupNames();

  if (names.length > 0) {
    names.forEach(name => {
      commands.push({
        name: `${strings.OPEN_GROUP} ${name}`,
        async execute(cmd) {
          console.log('opening group:', name);
          const urls = await getGroup(name);
          if (urls && urls.length > 0) {
            await browser.windows.create({ url: urls });
          } else {
            console.log(`No group found with name "${name}"`);
          }
        }
      });
    });
  }
};

const commands = [
  {
    name: strings.SAVE_AS_GROUP,
    async execute(cmd) {
      if (cmd.params.length > 0) {
        const urls = await urlsForActiveWindow();
        console.log('saving new group:', cmd.params[0], urls.length);
        await storeGroup(cmd.params[0], urls)
        refreshGroupCommands();
      }
    }
  }
];

await refreshGroupCommands();

export default commands;
