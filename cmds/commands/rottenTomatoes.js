// Export Rotten Tomatoes command
export default {
  name: 'Rotten Tomatoes',
  async execute(cmd) {
    const search = cmd.search.length > 0 ? cmd.search : cmd.selection;
    if (search.length > 0) {
      const url = `https://www.rottentomatoes.com/search?search=${search}`;
      await browser.tabs.create({ url });
    }
  }
};