// background.js

const STORAGE_KEY = 'highlighter_config_v4';

// 1. Initialize Context Menus
let isUpdatingMenus = false;
let pendingMenuUpdate = false;

function updateContextMenus() {
    if (isUpdatingMenus) {
        pendingMenuUpdate = true;
        return;
    }
    isUpdatingMenus = true;
    pendingMenuUpdate = false;

    chrome.contextMenus.removeAll(() => {
        chrome.storage.sync.get([STORAGE_KEY], (result) => {
            const config = result[STORAGE_KEY];

            const onMenuCreated = () => {
                let _ = chrome.runtime.lastError; // Ignore unchecked errors
            };

            if (!config || !config.lists || config.lists.length === 0) {
                // No lists available
                chrome.contextMenus.create({
                    id: "no-lists",
                    title: "No highlight lists active",
                    contexts: ["selection"],
                    enabled: false
                }, onMenuCreated);
                finishMenuUpdate();
                return;
            }

            // Create Parent Menu
            const activeLists = config.lists.filter(l => l.enabled);

            chrome.contextMenus.create({
                id: "highlight-selection",
                title: "Highlight '%s'",
                contexts: ["selection"]
            }, () => {
                let _ = chrome.runtime.lastError; // Ignore unchecked errors

                // Create Sub-menus for each list
                activeLists.forEach(list => {
                    chrome.contextMenus.create({
                        id: `add-to-${list.id}`,
                        parentId: "highlight-selection",
                        title: `Add to "${list.name}"`,
                        contexts: ["selection"]
                    }, onMenuCreated);
                });

                finishMenuUpdate();
            });
        });
    });
}

function finishMenuUpdate() {
    isUpdatingMenus = false;
    if (pendingMenuUpdate) {
        updateContextMenus();
    }
}

// 2. Handle Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Check if the clicked item is one of our "Add to..." items
    if (info.menuItemId.startsWith("add-to-")) {
        const listId = info.menuItemId.replace("add-to-", "");
        const text = info.selectionText.trim();
        
        if (!text) return;

        chrome.storage.sync.get([STORAGE_KEY], (result) => {
            const config = result[STORAGE_KEY];
            if (!config) return; // Should handle if config is missing

            // Find the target list
            const listIndex = config.lists.findIndex(l => l.id === listId);
            if (listIndex !== -1) {
                const list = config.lists[listIndex];
                
                // Add word if not exists
                if (!list.words.includes(text)) {
                    list.words.push(text);
                    
                    // Save back to storage - this will trigger onChanged -> updateContextMenus
                    chrome.storage.sync.set({ [STORAGE_KEY]: config }, () => {
                        // Notify tab to refresh immediately for better UX
                        if (tab && tab.id) {
                            chrome.tabs.sendMessage(tab.id, { action: "refresh_highlights" });
                        }
                    });
                } else {
                    // Already exists, maybe just refresh to be safe?
                    if (tab && tab.id) {
                         chrome.tabs.sendMessage(tab.id, { action: "refresh_highlights" });
                    }
                }
            }
        });
    }
});

// 3. Listen for Storage Changes (Dynamic Update)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes[STORAGE_KEY]) {
        updateContextMenus();
    }
});

// 4. Handle Badge Updates (Count)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "update_badge") {
        const count = message.count;
        const text = count > 0 ? count.toString() : "";
        if (sender.tab && sender.tab.id) {
            chrome.action.setBadgeText({ text: text, tabId: sender.tab.id });
            chrome.action.setBadgeBackgroundColor({ color: "#6d28d9", tabId: sender.tab.id }); // Indigo
        }
    }
});

// Initial Setup
chrome.runtime.onInstalled.addListener(updateContextMenus);
chrome.runtime.onStartup.addListener(updateContextMenus);