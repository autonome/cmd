// Export email command
export default {
  name: 'Email page to',
  async execute(cmd) {
    const tabs = await browser.tabs.query({active:true});
    const email = cmd.typed.replace(cmd.name, '').trim();
    const url =
      'mailto:' + email +
      '?subject=Web%20page!&body=' +
      encodeURIComponent(tabs[0].title) +
      '%0D%0A' +
      encodeURIComponent(tabs[0].url);
    tabs[0].url = url;
  }
};