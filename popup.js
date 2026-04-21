
function init() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // Try to load from SYNC
        chrome.storage.sync.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                state.config = result[STORAGE_KEY];
                
                // Ensure all default settings exist (for new version updates)
                if (!state.config.settings) {
                    state.config.settings = { ...DEFAULT_CONFIG.settings };
                } else {
                    state.config.settings = { ...DEFAULT_CONFIG.settings, ...state.config.settings };
                }

                fetchPageRuleCounts(() => render());
            } else {
                // If sync is empty, check LOCAL for migration
                chrome.storage.local.get(['highlighter_lists_v3'], (localResult) => {
                    if (localResult.highlighter_lists_v3) {
                        // Migrate V3 lists to V4 config
                        state.config.lists = localResult.highlighter_lists_v3;
                        save(); // This will save to sync
                    } else {
                        // No data anywhere, use defaults
                        state.config = DEFAULT_CONFIG;
                        save();
                    }
                });
            }
        });
    } else {
        // Fallback for non-extension environment
        const saved = localStorage.getItem(STORAGE_KEY);
        state.config = saved ? JSON.parse(saved) : DEFAULT_CONFIG;

        // Ensure settings are merged
        if (state.config.settings) {
            state.config.settings = { ...DEFAULT_CONFIG.settings, ...state.config.settings };
        }

        fetchPageRuleCounts(() => render());
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
