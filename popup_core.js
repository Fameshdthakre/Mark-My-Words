// --- Configuration ---
const STORAGE_KEY = 'highlighter_config_v4'; // Changed key for V4



const PRESETS = [
    { bg: '#6610f2', text: '#ffffff', name: 'Electric Purple' },
    { bg: '#3b82f6', text: '#ffffff', name: 'Blue' },
    { bg: '#06b6d4', text: '#ffffff', name: 'Cyan' },
    { bg: '#10b981', text: '#ffffff', name: 'Emerald' },
    { bg: '#f59e0b', text: '#ffffff', name: 'Amber' },
    { bg: '#ef4444', text: '#ffffff', name: 'Rose' },
    { bg: '#d946ef', text: '#ffffff', name: 'Fuchsia' },
    { bg: '#ffffff', text: '#000000', name: 'White' },
];

const DEFAULT_CONFIG = {
    lists: [{
        id: 'default-1',
        name: 'Important Terms',
        words: ['React', 'Extension', 'highlight', 'code'],
        styles: { backgroundColor: '#6610f2', color: '#ffffff' },
        enabled: true,
        options: { caseSensitive: false, wholeWord: true, isRegex: false, crossNode: false },
        allowedDomains: [],
        targetSelectors: [],
        note: ''
    }],
    settings: {
        globalEnabled: true,
        excludedDomains: [],
        performanceMode: false,
        autoTriggerInterval: 'Off',
        theme: 'dark',
        customStyles: []
    }
};

// --- State ---
let state = {
    config: DEFAULT_CONFIG,
    activeView: 'dashboard', // 'dashboard' | 'editor' | 'settings' | 'summary' | 'analytics'
    editingListId: null,
    searchQuery: '',
    searchVisible: false,
    summaryData: [],
    pageRuleCounts: {},
    analyticsTab: 'current',
    pageAnalytics: { totalHighlights: 0, ruleUsage: {} }
};

// --- Helpers ---
function escapeHtml(text) {
    if (!text) return text;
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
