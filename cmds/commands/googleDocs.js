// Export Google Docs commands
const googleDocs = [
  {
    name: 'New Google doc',
    async execute(cmd) {
      await browser.tabs.create({
        url: 'http://docs.google.com/document/create?hl=en'
      });
    }
  },
  {
    name: 'New Google sheet',
    async execute(cmd) {
      await browser.tabs.create({
        url: 'http://spreadsheets.google.com/ccc?new&hl=en'
      });
    }
  }
];

export default googleDocs;