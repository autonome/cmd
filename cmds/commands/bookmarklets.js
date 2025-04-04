// Export bookmarklets command
export default {
  name: 'bookmarklets',
  async source() {
    // add bookmarklets as commands
    const bmarklets = await browser.bookmarks.search({ query: 'javascript:'} );
    return bmarklets.map(b => ({
      name: b.title,
      async execute(cmd) {
        const search = cmd.search.length > 0 ? cmd.search : cmd.selection;
        const code = b.url.replace('javascript:', '').replace('%s', `'${search}'`);
        const tabs = await browser.tabs.query({active:true});
        browser.tabs.executeScript(tabs[0].id, {
          code
        });
      }
    }));
  }
};