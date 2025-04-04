// Export send to window command
export default {
  name: 'sendToWindow',
  async source() {
    const cmdPrefix = 'Move to window: ';
    const windows = await browser.windows.getAll({windowTypes: ['normal']});
    return windows.map((w) => ({
      name: cmdPrefix + w.title,
      async execute(cmd) {
        const activeTabs = await browser.tabs.query({active: true});
        browser.tabs.move(activeTabs[0].id, {windowId: w.id, index: -1});
      }
    }));
  }
};