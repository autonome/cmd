// Export switch tab container command
export default {
  name: 'switchTabContainer',
  async source() {
    const cmdPrefix = 'Switch container to: ';
    const identities = await browser.contextualIdentities.query({});
    if (!identities.length) return [];
    
    return identities.map(identity => ({
      name: cmdPrefix + identity.name,
      async execute(cmd) {
        const activeTabs = await browser.tabs.query({currentWindow: true, active: true});
        const tab = activeTabs[0];
        // some risk of losing old tab if new tab was not created successfully
        // but putting remove in creation was getting killed by window close
        // so when execution is moved to background script, try moving this back
        browser.tabs.remove(tab.id);
        browser.tabs.create({url: tab.url, cookieStoreId: identity.cookieStoreId, index: tab.index+1, pinned: tab.pinned });
      }
    }));
  }
};