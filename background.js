const ext = globalThis.browser || globalThis.chrome;

// Handle extension installation
ext.runtime.onInstalled.addListener(() => {
  console.log('DeepSeek Chat Exporter installed');
});

// Inject content script into already-open DeepSeek tabs when extension is installed/updated
ext.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await ext.tabs.query({ url: 'https://chat.deepseek.com/a/chat/s/*' });
    for (const tab of tabs) {
      try {
        await ext.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['jszip.min.js', 'utils.js', 'content.js']
        });
      } catch (err) {
        console.log('Could not inject into tab', tab.id, err);
      }
    }
  } catch (err) {
    console.log('Could not query tabs', err);
  }
});

// Handle messages from popup when content script might not be injected
ext.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ensureContentScript') {
    ext.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
      if (tabs && tabs[0]) {
        try {
          await ext.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['jszip.min.js', 'utils.js', 'content.js']
          });
        } catch (_) {}
      }
      if (typeof sendResponse === 'function') {
        sendResponse({ success: true });
      }
    }).catch(() => {
      if (typeof sendResponse === 'function') {
        sendResponse({ success: false });
      }
    });
    return true; // Keep channel open for async response
  }
});