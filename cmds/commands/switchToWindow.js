// Export switch to window command
export default {
  name: 'switchToWindow',
  async source() {
    const cmdPrefix = 'Switch to window: ';
    const windows = await browser.windows.getAll({});
    return windows.map((w) => ({
      name: cmdPrefix + w.title,
      async execute(cmd) {
        browser.windows.update(w.id, { focused: true });
      }
    }));
  }
};