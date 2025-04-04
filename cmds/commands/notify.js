// Export notify command
export default {
  name: 'notify',
  async execute(cmd) {
    const search = cmd.search.length > 0 ? cmd.search : cmd.selection;
    if (search.length > 0) {
      notify('Cmd notification', search);
    }
  }
};

function notify(title, content) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('images/icon.png'),
    title,
    message: content
  });
}