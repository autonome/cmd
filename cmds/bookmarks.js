// browser (Firefox) vs chrome (Chromium)
const api = typeof chrome != 'undefined' ? chrome : browser;

const strings = {
  name: 'bookmark current page',
};

export default {
  name: strings.name,
  async execute() {
    const tab = await browser.tabs.query({active:true});
    await browser.bookmarks.create({
      title: tab[0].title,
      url: tab[0].url
    });
  }
};
