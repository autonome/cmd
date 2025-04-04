// Export note command
export default {
  name: 'note',
  async execute(cmd) {
    if (cmd.typed.indexOf(' ')) {
      const note = cmd.typed.replace('note ', '');
      await saveNewNote(note);
      notify('note saved!', note);
    }
  }
};

const STG_KEY = 'cmd:notes';
const STG_TYPE = 'local';

async function saveNewNote(note) {
  let store = await browser.storage[STG_TYPE].get(STG_KEY);
  
  if (Object.keys(store).indexOf(STG_KEY) === -1) {
    store = {
      notes: []
    };
  } else {
    store = store[STG_KEY];
  }
  
  store.notes.push(note);
  await browser.storage[STG_TYPE].set({ [STG_KEY]: store });
}

function notify(title, content) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('images/icon.png'),
    title,
    message: content
  });
}