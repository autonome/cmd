// Export new container tab command
export default {
  name: 'newContainerTab',
  async source() {
    const cmdPrefix = 'New container tab: ';
    const identities = await browser.contextualIdentities.query({});
    if (!identities.length) return [];
    
    return identities.map(identity => ({
      name: cmdPrefix + identity.name,
      async execute(cmd) {
        browser.tabs.create({url: '', cookieStoreId: identity.cookieStoreId });
      }
    }));
  }
};