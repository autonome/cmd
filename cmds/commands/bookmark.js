// Export bookmark command
export default {
  name: 'bookmark current page',
  async execute() {
    const tab = await browser.tabs.query({active:true});
    const node = await browser.bookmarks.create({
      title: tab[0].title,
      url: tab[0].url
    });
  }
};
