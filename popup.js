// --- Configuration ---
const STORAGE_KEY = 'highlighter_config_v4'; // Changed key for V4

// --- Icons (SVG Strings) ---
const ICONS = {
    zap: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    chevronLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    upload: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    grip: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`,
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    barChart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    brain: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
    messageSquare: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
};

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

// --- App Logic ---

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

function applyTheme() {
    if (state.config.settings.theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    } else if (state.config.settings.theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.setAttribute('data-theme', 'light');
        } else {
            document.body.removeAttribute('data-theme');
        }
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function save(shouldRender = true) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ [STORAGE_KEY]: state.config }, () => {
            notifyContentScript();
        });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    if (shouldRender) render();
}

function notifyContentScript() {
    chrome.tabs?.query({ active: true, currentWindow: true }, function (tabs) {
        if (chrome.runtime.lastError) return;
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "refresh_highlights" }, () => {
                if (chrome.runtime.lastError) { /* ignore */ }
            });
        }
    });
}

function fetchPageRuleCounts(callback) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "get_page_rule_counts" }, (response) => {
                    if (chrome.runtime.lastError) {
                        state.pageRuleCounts = {};
                        if (callback) callback();
                        return;
                    }
                    state.pageRuleCounts = response?.counts || {};
                    if (callback) callback();
                });
            } else {
                state.pageRuleCounts = {};
                if (callback) callback();
            }
        });
    } else {
        state.pageRuleCounts = {};
        if (callback) callback();
    }
}

function render() {
    applyTheme();
    const app = document.getElementById('app');

    // Create Toast Container if missing
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div');
        tc.id = 'toast-container';
        document.body.appendChild(tc);
    }

    const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { name: 'Mark My Words', version: '1.6.0' };
    const version = manifest.version;

    // Header
    const headerHtml = `
    <header>
        <div class="flex items-center">
            <div class="logo-box">${ICONS.zap}</div>
            <div>
                <h1 class="app-title">Mark My Words <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal; margin-left: 4px;">v${version}</span></h1>
                <div class="status-badge">
                    <div class="status-dot" style="background-color: ${state.config.settings.globalEnabled ? 'var(--accent)' : 'var(--text-muted)'}"></div> 
                    ${state.config.settings.globalEnabled ? 'Active' : 'Paused'}
                </div>
            </div>
        </div>
        <div class="header-actions">
            ${state.activeView === 'dashboard'
            ? `<div class="action-group">
                       <button class="btn btn-icon" id="btn-analytics" title="Analytics" aria-label="Analytics">${ICONS.barChart}</button>
                       <button class="btn btn-icon" id="btn-summary" title="Summary & Export" aria-label="Summary">${ICONS.download}</button>
                       <div class="divider"></div>
                       <select id="auto-trigger-interval" style="background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px; padding: 2px 4px; font-size: 0.7rem; cursor: pointer; outline: none;" title="Auto-trigger Rescan Interval">
                           <option value="Off" ${state.config.settings.autoTriggerInterval === 'Off' ? 'selected' : ''}>Off</option>
                           <option value="15s" ${state.config.settings.autoTriggerInterval === '15s' ? 'selected' : ''}>15s</option>
                           <option value="30s" ${state.config.settings.autoTriggerInterval === '30s' ? 'selected' : ''}>30s</option>
                           <option value="45s" ${state.config.settings.autoTriggerInterval === '45s' ? 'selected' : ''}>45s</option>
                           <option value="1m" ${state.config.settings.autoTriggerInterval === '1m' ? 'selected' : ''}>1m</option>
                           <option value="5m" ${state.config.settings.autoTriggerInterval === '5m' ? 'selected' : ''}>5m</option>
                           <option value="1h" ${state.config.settings.autoTriggerInterval === '1h' ? 'selected' : ''}>1hr</option>
                       </select>
                       <button class="btn btn-icon" id="btn-refresh" title="Re-scan Page" aria-label="Re-scan Page">${ICONS.eye}</button>
                       <div class="divider"></div>
                       <button class="btn btn-icon" id="btn-settings" title="Settings" aria-label="Settings">${ICONS.settings}</button>
                   </div>`
            : `<button id="nav-back" class="btn btn-secondary" style="font-size: 0.75rem;" aria-label="Go Back">${ICONS.chevronLeft} Back</button>`
        }
        </div>
    </header>`;

    // Main Content
    let mainHtml = '';
    if (state.activeView === 'dashboard') {
        mainHtml = renderDashboardHtml();
    } else if (state.activeView === 'editor') {
        mainHtml = renderEditorHtml();
    } else if (state.activeView === 'settings') {
        mainHtml = renderSettingsHtml();
    } else if (state.activeView === 'summary') {
        mainHtml = renderSummaryHtml();
    } else if (state.activeView === 'analytics') {
        mainHtml = renderAnalyticsHtml();
    }

    // Preview (Only show on Editor)
    const previewHtml = (state.activeView === 'editor') ? renderPreviewHtml() : '';

    app.innerHTML = `
        ${headerHtml}
        <main style="flex: 1; overflow-y: auto; padding-bottom: 2rem;">
            ${mainHtml}
        </main>
        ${previewHtml}
        <div class="signature">
            <div class="brand-line">Created with ❤️ by <strong><a href="https://www.linkedin.com/in/famesh-thakre-6a2825118" target="_blank" style="color: inherit; text-decoration: none;">TransFamesh</a></strong>.</div>
            <div style="margin-top: 4px;"><a href="#" id="feedbackLink" style="font-weight: 600; color: var(--text-muted); text-decoration: none;">Feedback</a></div>
        </div>
    `;

    attachEvents();
}

// --- HTML Generators ---

function renderDashboardHtml() {
    let lists = state.config.lists;

    // Filter by search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        lists = lists.filter(l =>
            l.name.toLowerCase().includes(query) ||
            l.words.some(w => w.toLowerCase().includes(query))
        );
    }

    // Storage Usage Check
    const storageUsage = new Blob([JSON.stringify(state.config)]).size;
    const quotaBytes = 102400; // chrome.storage.sync.QUOTA_BYTES
    const usagePercent = (storageUsage / quotaBytes) * 100;
    const isOverLimit = usagePercent > 90;

    let alertHtml = '';
    if (isOverLimit) {
        alertHtml = `
        <div style="margin: 0 1.5rem 1rem; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); border-radius: 0.75rem; padding: 0.75rem; display: flex; align-items: center; gap: 0.75rem; color: var(--danger); font-size: 0.8rem;">
            ${ICONS.alert}
            <div>
                <strong>Storage Warning</strong><br>
                You are using ${usagePercent.toFixed(1)}% of your sync quota. Consider removing some rules.
            </div>
        </div>`;
    }

    if (state.config.lists.length === 0) {
        return `
        <div class="dashboard-header">
            <div>
                <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Your Rules</h2>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">0 active rules</p>
            </div>
            <button id="btn-create" class="btn btn-primary">${ICONS.plus}</button>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; color: var(--text-muted);">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(109, 40, 217, 0.2), rgba(139, 92, 246, 0.2)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; box-shadow: 0 0 20px rgba(109, 40, 217, 0.3);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-light);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 style="margin: 0 0 0.5rem; color: var(--text-main); font-size: 1.1rem;">No Highlights Yet</h3>
            <p style="margin: 0 0 1.5rem; font-size: 0.85rem; max-width: 240px; line-height: 1.5;">Create your first rule to start highlighting important keywords on any webpage.</p>
            <button id="btn-get-started" class="btn btn-primary" aria-label="Get Started">${ICONS.plus} Get Started</button>
        </div>`;
    }

    const listsHtml = lists.map((list) => {
        const animationClass = (state.lastCreatedId === list.id) ? 'new-item' : '';

        return `
        <div class="list-item ${animationClass}" data-id="${list.id}" draggable="true">
            <div class="drag-handle" style="cursor: grab; color: var(--text-muted); opacity: 0.5; padding: 0.5rem;">
                ${ICONS.grip}
            </div>
            <div class="toggle-switch ${list.enabled ? 'on' : 'off'}" data-action="toggle" data-id="${list.id}">
                <div class="toggle-dot"></div>
            </div>
            
            <div class="list-content" style="flex: 1; min-width: 0; padding: 0 0.5rem;" data-action="edit" data-id="${list.id}">
                <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-heading);">
                    ${escapeHtml(list.name)}
                    ${state.searchQuery ? `<span style="font-size: 0.7rem; color: var(--accent); margin-left: 0.5rem;">(matches found)</span>` : ''}
                </div>
                <div class="flex items-center gap-2" style="margin-top: 0.35rem;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${list.styles.backgroundColor}; box-shadow: 0 0 6px ${list.styles.backgroundColor};"></div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">${list.words.length} KEYWORDS</span>
                    ${state.pageRuleCounts[list.id] ? `<span style="font-size: 0.65rem; color: #fff; background: var(--primary-light); padding: 2px 6px; border-radius: 8px; font-weight: 600;">${state.pageRuleCounts[list.id]}</span>` : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 0.25rem;">
                <button class="btn btn-icon" data-action="duplicate" data-id="${list.id}" title="Duplicate Rule" aria-label="Duplicate Rule" style="opacity: 0.6;">
                    ${ICONS.copy}
                </button>
                <button class="btn btn-icon" data-action="delete" data-id="${list.id}" title="Delete Rule" aria-label="Delete Rule" style="opacity: 0.6;">
                    ${ICONS.trash}
                </button>
            </div>
        </div>
    `}).join('');

    // Clear the animation flag after render
    if (state.lastCreatedId) {
        setTimeout(() => { state.lastCreatedId = null; }, 500);
    }

    return `
    <div class="dashboard-header">
        <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
            <div>
                <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Your Rules</h2>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">${lists.length} / ${state.config.lists.length} rules</p>
            </div>
            <div style="position: relative;">
                <button id="btn-toggle-search" class="btn btn-icon" title="Search">${ICONS.search}</button>
                <div id="search-container" style="display: ${state.searchVisible ? 'block' : 'none'}; position: absolute; left: 100%; top: 50%; transform: translateY(-50%); margin-left: 0.5rem; width: 150px; background: var(--bg-glass); backdrop-filter: blur(8px); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.25rem;">
                    <input type="text" id="input-search" value="${state.searchQuery}" placeholder="Search..." style="width: 100%; background: transparent; border: none; color: var(--text-main); font-size: 0.8rem; padding: 0.25rem; outline: none;">
                </div>
            </div>
        </div>
        <button id="btn-create" class="btn btn-primary">${ICONS.plus}</button>
    </div>
    ${alertHtml}
    <div class="list-container">${listsHtml}</div>`;
}

function renderEditorHtml() {
    const list = state.config.lists.find(l => l.id === state.editingListId);
    if (!list) return '';

    return `
    <div class="editor-view">
        <div class="input-group">
            <label class="label">Rule Name</label>
            <input type="text" id="input-name" class="title-input" value="${escapeHtml(list.name)}" placeholder="Enter rule name...">
        </div>

        <div class="options-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 0.5rem;">
            <div class="option-card ${list.options.caseSensitive ? 'active' : ''}" data-action="toggleOption" data-key="caseSensitive">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">Aa</span> Match Case
            </div>
            <div class="option-card ${list.options.wholeWord ? 'active' : ''}" data-action="toggleOption" data-key="wholeWord">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">Abc</span> Whole Word
            </div>
            <div class="option-card ${list.options.isRegex ? 'active' : ''}" data-action="toggleOption" data-key="isRegex">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">.*</span> Regex
            </div>
            <div class="option-card ${list.options.crossNode ? 'active' : ''}" data-action="toggleOption" data-key="crossNode">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">&lt;&gt;</span> Cross-Node
            </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div class="input-group" style="flex: 1; margin-bottom: 0;">
                <label class="label" style="font-size: 0.75rem;">Allowed Domains</label>
                <textarea id="input-allowed-domains" class="word-input" rows="2" style="width: 100%; resize: vertical; font-size: 0.75rem;" placeholder="Leave empty for all...&#10;example.com">${(list.allowedDomains || []).join('\n')}</textarea>
            </div>
            <div class="input-group" style="flex: 1; margin-bottom: 0;">
                <label class="label" style="font-size: 0.75rem;">Target Selectors</label>
                <textarea id="input-target-selectors" class="word-input" rows="2" style="width: 100%; resize: vertical; font-size: 0.75rem;" placeholder="Leave empty for all...&#10;article, .main">${(list.targetSelectors || []).join('\n')}</textarea>
            </div>
        </div>

        <div class="input-group">
            <label class="label">Highlight Style</label>
            <div class="color-picker-row" style="flex-wrap: wrap; gap: 0.75rem;">
                <!-- Built-in -->
                ${PRESETS.map(p => {
                    const isActive = list.styles.backgroundColor === p.bg && list.styles.color === p.text;
                    const style = isActive
                        ? `background-color: ${p.bg}; color: ${p.text}; box-shadow: 0 0 0 2px white, 0 0 10px ${p.bg}; transform: scale(1.1);`
                        : `background-color: ${p.bg}; color: ${p.text};`;
                    return `<button class="color-btn preset-btn" style="${style}" data-action="setColor" data-bg="${p.bg}" data-text="${p.text}">Aa</button>`;
                }).join('')}

                <!-- Custom -->
                ${(state.config.settings.customStyles || []).map((p, index) => {
                    const isActive = list.styles.backgroundColor === p.bg && list.styles.color === p.text;
                    const style = isActive
                        ? `background-color: ${p.bg}; color: ${p.text}; box-shadow: 0 0 0 2px white, 0 0 10px ${p.bg}; transform: scale(1.1);`
                        : `background-color: ${p.bg}; color: ${p.text};`;
                    return `
                        <div style="position: relative;">
                            <button class="color-btn custom-preset-btn" style="${style}" data-action="setCustomColor" data-index="${index}" data-bg="${p.bg}" data-text="${p.text}">Aa</button>
                            <button class="btn-delete-preset" data-index="${index}" title="Hold Alt + Click to delete" style="position: absolute; top: -6px; right: -6px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); line-height: 1;">×</button>
                        </div>
                    `;
                }).join('')}
            </div>
            ${(state.config.settings.customStyles && state.config.settings.customStyles.length > 0) ? `<div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.5rem;">Tip: Hold <strong>Alt</strong> while clicking the <strong>×</strong> to delete custom presets.</div>` : ''}

            
            <!-- Create New Preset (Boxed UI) -->
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-glass); border-radius: 0.5rem; border: 1px dashed var(--border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-main);">Custom Color Picker</div>
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label class="label" style="font-size: 0.7rem; margin-bottom: 0.25rem;">Background</label>
                        <input type="color" id="custom-bg-picker" value="${list.styles.backgroundColor}" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none;">
                    </div>
                    <div style="flex: 1;">
                        <label class="label" style="font-size: 0.7rem; margin-bottom: 0.25rem;">Text</label>
                        <input type="color" id="custom-text-picker" value="${list.styles.color}" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none;">
                    </div>
                </div>
                <button id="btn-save-preset" class="btn btn-secondary" style="width: 100%; margin-top: 1rem; font-size: 0.75rem; border-style: dashed; color: var(--primary-light); border-color: var(--primary-light);">${ICONS.plus} Save as Custom Preset</button>
            </div>
            <div class="options-grid" style="margin-top: 1rem; grid-template-columns: repeat(2, 1fr);">
                <div class="option-card ${list.styles.strikeThrough ? 'active' : ''}" data-action="toggleStyle" data-key="strikeThrough">
                    <span style="font-size: 1.25rem; margin-bottom: 2px;"><del>S</del></span> Strike
                </div>
                <div class="option-card ${list.styles.glow ? 'active' : ''}" data-action="toggleStyle" data-key="glow">
                    <span style="font-size: 1.25rem; margin-bottom: 2px; text-shadow: 0 0 8px currentColor;">${ICONS.sun}</span> Glow
                </div>
            </div>
        </div>



        <!-- Keywords Section (Boxed Pane) -->
        <div class="input-group" style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-glass); border-radius: 0.5rem; border: 1px dashed var(--border);">
             <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                    <label class="label" style="margin:0; color: var(--text-main); font-weight: 700;">Keywords</label>
                    <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">(${list.words.length})</span>
                </div>
             </div>
            
            <form id="add-word-form" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center; height: 2.5rem;">
                <input type="text" id="new-word-input" class="word-input" style="flex: 1; height: 100%; border-radius: 0.5rem; padding: 0 0.75rem; box-sizing: border-box; background: var(--bg-main);" placeholder="Add a keyword..." autocomplete="off">
                <div style="display: flex; gap: 0.35rem;">
                    <button type="submit" id="btn-add-word" class="btn btn-secondary" title="Add Keyword" style="width: 2.5rem; height: 2.5rem; padding: 0; border-radius: 0.5rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">${ICONS.plus}</button>
                    ${list.words.length > 0 ? `<button type="button" id="btn-clear-words" class="btn btn-secondary" title="Clear All Keywords" style="width: 2.5rem; height: 2.5rem; padding: 0; border-radius: 0.5rem; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--danger); border-color: rgba(239, 68, 68, 0.2);">${ICONS.trash}</button>` : ''}
                </div>
            </form>
            
            <div id="regex-error-msg" class="word-input-error" style="margin-bottom: 0.5rem;">Invalid Regular Expression</div>
            
            <div id="keyword-table" class="keyword-table" style="max-height: 150px; overflow-y: auto; border-color: var(--border);">
                ${list.words.map((w, index) => `
                    <div class="keyword-row" draggable="true" data-index="${index}" data-word="${escapeHtml(w)}">
                        <div class="drag-handle" style="opacity: 0.3;">${ICONS.grip}</div>
                        <div class="keyword-text" style="font-size: 0.8rem;">${escapeHtml(w)}</div>
                        <button class="btn btn-icon btn-delete-keyword" data-index="${index}" title="Remove Keyword" aria-label="Remove Keyword" style="opacity: 0.5; padding: 2px;">
                            ${ICONS.trash}
                        </button>
                    </div>
                `).join('')}
                ${list.words.length === 0 ? '<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; padding: 1.5rem; text-align: center;">No keywords added yet.</div>' : ''}
            </div>
        </div>
    </div>`;
}

function renderSettingsHtml() {
    const s = state.config.settings;
    return `
    <div class="editor-view">
        <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem;">Settings</h2>

        <!-- Global Toggle -->
        <div class="list-item" style="cursor: default; margin-bottom: 1.5rem;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-heading);">Enable Extension</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Turn off highlighting globally</div>
            </div>
            <div class="toggle-switch ${s.globalEnabled ? 'on' : 'off'}" id="setting-global-toggle">
                <div class="toggle-dot"></div>
            </div>
        </div>

        <!-- Theme -->
        <div class="list-item" style="cursor: default; margin-bottom: 1.5rem;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">Theme</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Popup appearance</div>
            </div>
            <select id="setting-theme" style="background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border); border-radius: 4px; padding: 4px; font-size: 0.8rem; cursor: pointer; outline: none;">
                <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
                <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="system" ${s.theme === 'system' ? 'selected' : ''}>System</option>
            </select>
        </div>

        <!-- Performance Mode -->
        <div class="list-item" style="cursor: default; margin-bottom: 1.5rem;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">Performance Mode</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Limit highlights on large pages (>50k chars)</div>
            </div>
            <div class="toggle-switch ${s.performanceMode ? 'on' : 'off'}" id="setting-perf-toggle">
                <div class="toggle-dot"></div>
            </div>
        </div>

        <!-- Excluded Domains -->
        <div class="input-group" style="margin-bottom: 2rem;">
            <label class="label">Excluded Domains (One per line)</label>
            <textarea id="setting-excluded" class="word-input" rows="4" style="width: 100%; resize: vertical; font-family: monospace;" placeholder="example.com&#10;gmail.com">${s.excludedDomains.join('\n')}</textarea>
        </div>

        <!-- Highlight Styles Management -->
        <div class="input-group">
            <label class="label">Manage Highlight Styles</label>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem;">Your custom presets will appear here alongside built-in ones.</div>
            
            <div class="color-picker-row" style="flex-wrap: wrap; gap: 0.75rem;">
                <!-- Built-in (Read-only) -->
                ${PRESETS.map(p => `
                    <div class="color-btn" style="background-color: ${p.bg}; color: ${p.text}; cursor: default;" title="${p.name} (Built-in)">Aa</div>
                `).join('')}

                <!-- Custom (Manageable) -->
                ${(s.customStyles || []).map((p, index) => `
                    <div class="color-btn" style="background-color: ${p.bg}; color: ${p.text}; position: relative; padding-right: 0;" title="Custom Preset">
                        Aa
                        <button class="btn-delete-preset" data-index="${index}" style="position: absolute; top: -6px; right: -6px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); line-height: 1;">×</button>
                    </div>
                `).join('')}
            </div>

            <!-- Create New from Settings -->
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-glass); border-radius: 0.5rem; border: 1px dashed var(--border);">
                <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-main);">Create New Preset</div>
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <label class="label" style="font-size: 0.7rem; margin-bottom: 0.25rem;">Background</label>
                        <input type="color" id="setting-new-bg" value="#6610f2" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none;">
                    </div>
                    <div style="flex: 1;">
                        <label class="label" style="font-size: 0.7rem; margin-bottom: 0.25rem;">Text</label>
                        <input type="color" id="setting-new-text" value="#ffffff" style="width: 100%; height: 32px; border: none; border-radius: 4px; cursor: pointer; background: none;">
                    </div>
                </div>
                <button id="btn-save-preset-settings" class="btn btn-secondary" style="width: 100%; margin-top: 1rem; font-size: 0.75rem; border-style: dashed; color: var(--primary-light); border-color: var(--primary-light);">${ICONS.plus} Add to Presets</button>
            </div>
        </div>



        <!-- Data Management -->
        <div class="input-group" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
            <label class="label">Data Management</label>
            <div class="flex gap-2" style="margin-top: 0.5rem;">
                <button id="btn-export" class="btn btn-secondary" style="flex: 1;">${ICONS.download} Export Rules</button>
                <button id="btn-import-trigger" class="btn btn-secondary" style="flex: 1;">${ICONS.upload} Import Rules</button>
                <input type="file" id="file-import" accept=".json" style="display: none;">
            </div>
        </div>
        
        <div style="margin-top: 2rem; text-align: center; font-size: 0.75rem; color: var(--text-muted);">
            Mark My Words v${chrome.runtime?.getManifest ? chrome.runtime.getManifest().version : '1.6.0'}<br>
            Sync enabled
        </div>
    </div>`;
}

function renderSummaryHtml() {
    if (state.summaryData.length === 0) {
        return `
        <div class="editor-view" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                ${ICONS.search}
            </div>
            <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">No Matches Found</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Ensure the extension is active and rules are matched on the current page.</p>
            <button id="btn-refresh-summary" class="btn btn-primary" style="margin-top: 1rem;">${ICONS.eye} Refresh</button>
        </div>`;
    }

    const itemsHtml = state.summaryData.map(item => `
        <div class="list-item" style="cursor: default; align-items: flex-start; padding: 0.75rem;">
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-heading); display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <span style="background: ${item.bgColor}; color: ${item.color}; padding: 0 4px; border-radius: 3px;">${escapeHtml(item.text)}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; white-space: pre-wrap;">...${escapeHtml(item.context)}...</div>
            </div>
            <button class="btn btn-secondary btn-scroll" data-index="${item.index}" style="padding: 4px 8px; font-size: 0.7rem;">Scroll To</button>
        </div>
    `).join('');

    return `
    <div class="editor-view">
        <div class="flex justify-between items-center mb-2">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">Summary</h2>
            <div class="flex gap-2">
                <button id="btn-refresh-summary" class="btn btn-icon" title="Refresh">${ICONS.eye}</button>
                <button id="btn-export-csv" class="btn btn-secondary" style="font-size: 0.75rem;">${ICONS.download} Export CSV</button>
            </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            Found ${state.summaryData.length} matches on this page.
        </div>
        <div class="list-container">
            ${itemsHtml}
        </div>
    </div>`;
}

function renderPreviewHtml() {
    const list = state.activeView === 'editor' ? state.config.lists.find(l => l.id === state.editingListId) : null;
    let sampleText = "Preview: Mark My Words makes it easy to style your web.";

    if (list) {
        const strikeStyle = list.styles.strikeThrough ? 'text-decoration: line-through;' : '';
        const glowStyle = list.styles.glow ? `text-shadow: 0 0 8px ${list.styles.backgroundColor}, 0 0 12px ${list.styles.backgroundColor};` : '';

        const hl = `<span style="background-color: ${list.styles.backgroundColor}; color: ${list.styles.color}; padding: 0 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); ${strikeStyle} ${glowStyle}">Mark My Words</span>`;
        sampleText = `Preview: ${hl} makes it easy to style your web.`;
    }

    return `
    <div class="preview-area">
        <div class="flex items-center gap-2" style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.75rem; letter-spacing: 0.05em;">
            ${ICONS.eye} Live Preview
        </div>
        <div class="preview-box">${sampleText}</div>
    </div>`;
}

// --- Event Handlers ---

function attachEvents() {
    // 1. Navigation
    const backBtn = document.getElementById('nav-back');
    if (backBtn) backBtn.addEventListener('click', () => { 
        state.activeView = 'dashboard'; 
        fetchPageRuleCounts(() => render()); 
    });

    const createBtn = document.getElementById('btn-create');
    if (createBtn) createBtn.addEventListener('click', createList);

    const getStartedBtn = document.getElementById('btn-get-started');
    if (getStartedBtn) getStartedBtn.addEventListener('click', createList);

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => { state.activeView = 'settings'; render(); });

    const analyticsBtn = document.getElementById('btn-analytics');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            state.activeView = 'analytics';
            fetchAnalyticsData();
        });
    }

    const summaryBtn = document.getElementById('btn-summary');
    if (summaryBtn) {
        summaryBtn.addEventListener('click', () => {
            state.activeView = 'summary';
            fetchSummaryData();
        });
    }

    const feedbackLink = document.getElementById('feedbackLink');
    if (feedbackLink) {
        feedbackLink.addEventListener('click', (e) => {
            e.preventDefault();
            const manifest = chrome.runtime.getManifest();
            let appName = manifest.name;
            if (chrome.i18n && chrome.i18n.getMessage) {
                const i18nName = chrome.i18n.getMessage("appName");
                if (i18nName) appName = i18nName;
            }
            const versionStr = `${appName} ${manifest.version}`;
            const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeZ4zNH3_Jiov3JnTa5K2VXffCCkDSsh-KvK_h3kIxmbejoIg/viewform';
            const versionFieldId = 'entry.2030262534';
            const params = new URLSearchParams();
            params.append('usp', 'pp_url');
            if (versionFieldId) params.append(versionFieldId, versionStr);
            const finalUrl = `${baseUrl}?${params.toString()}`;
            chrome.tabs.create({ url: finalUrl });
        });
    }

    // Analytics tab switching
    document.querySelectorAll('[data-action="switch-analytics-tab-no-render"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            state.analyticsTab = targetTab;
            
            // Update tabs styling
            document.querySelectorAll('[data-action="switch-analytics-tab-no-render"]').forEach(b => {
                const isActive = b.dataset.tab === targetTab;
                b.style.background = isActive ? 'var(--primary-light)' : 'transparent';
                b.style.color = isActive ? '#fff' : 'var(--text-muted)';
            });
            
            // Update content visibility
            document.getElementById('analytics-tab-current').style.display = targetTab === 'current' ? 'block' : 'none';
            document.getElementById('analytics-tab-overall').style.display = targetTab === 'overall' ? 'block' : 'none';
        });
    });

    const intervalSelect = document.getElementById('auto-trigger-interval');
    if (intervalSelect) {
        intervalSelect.addEventListener('change', (e) => {
            state.config.settings.autoTriggerInterval = e.target.value;
            save(false);
        });
    }

    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            notifyContentScript();
            // Visual feedback
            const originalIcon = refreshBtn.innerHTML;
            refreshBtn.innerHTML = ICONS.check;
            setTimeout(() => refreshBtn.innerHTML = originalIcon, 1500);
        });
    }

    // 2. Dashboard List Items
    const searchToggle = document.getElementById('btn-toggle-search');
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            state.searchVisible = !state.searchVisible;
            render();
            if (state.searchVisible) {
                setTimeout(() => document.getElementById('input-search')?.focus(), 50);
            }
        });
    }

    const searchInput = document.getElementById('input-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            render();
            // Refocus after render
            const input = document.getElementById('input-search');
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    }

    const listContainer = document.querySelector('.list-container');
    if (listContainer) {
        listContainer.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (action === 'edit') {
                state.editingListId = id;
                state.activeView = 'editor';
                render();
            } else if (action === 'duplicate') {
                e.stopPropagation();
                const l = state.config.lists.find(x => x.id === id);
                if (l) {
                    const newList = JSON.parse(JSON.stringify(l));
                    newList.id = 'list-' + Date.now();
                    newList.name = l.name + ' (Copy)';
                    state.config.lists.push(newList);
                    state.lastCreatedId = newList.id;
                    save();
                    showToast('Rule duplicated!', 'success');
                }
            } else if (action === 'toggle') {
                e.stopPropagation();
                const l = state.config.lists.find(x => x.id === id);
                if (l) { l.enabled = !l.enabled; save(); }
            } else if (action === 'delete') {
                e.stopPropagation();
                state.config.lists = state.config.lists.filter(l => l.id !== id);
                save();
            }
        });

        // Drag and Drop Logic
        let draggedItem = null;

        listContainer.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.list-item');
            if (item) {
                draggedItem = item;
                e.dataTransfer.effectAllowed = 'move';
                item.style.opacity = '0.5';
            }
        });

        listContainer.addEventListener('dragend', (e) => {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
                draggedItem = null;

                // Persist new order
                const newOrderIds = Array.from(listContainer.querySelectorAll('.list-item')).map(el => el.dataset.id);
                // Reorder config.lists based on newOrderIds
                const reorderedLists = [];
                newOrderIds.forEach(id => {
                    const l = state.config.lists.find(x => x.id === id);
                    if (l) reorderedLists.push(l);
                });
                // Add any missing ones (filtered out?) back to end
                state.config.lists.forEach(l => {
                    if (!newOrderIds.includes(l.id)) reorderedLists.push(l);
                });

                state.config.lists = reorderedLists;
                save();
            }
        });

        listContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(listContainer, e.clientY);
            const draggable = document.querySelector('.list-item[style*="opacity: 0.5"]'); // Current dragged item
            if (draggable) {
                if (afterElement == null) {
                    listContainer.appendChild(draggable);
                } else {
                    listContainer.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    // 3. Editor Interactions
    if (state.activeView === 'editor') {
        const list = state.config.lists.find(l => l.id === state.editingListId);
        if (!list) return;

        const nameInput = document.getElementById('input-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => { list.name = e.target.value; });
            nameInput.addEventListener('change', () => { save(false); });
        }



        const allowedDomains = document.getElementById('input-allowed-domains');
        if (allowedDomains) {
            allowedDomains.addEventListener('change', (e) => {
                list.allowedDomains = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                save(false);
            });
        }

        const targetSelectors = document.getElementById('input-target-selectors');
        if (targetSelectors) {
            targetSelectors.addEventListener('change', (e) => {
                list.targetSelectors = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                save(false);
            });
        }

        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.dataset.key;
                list.options[key] = !list.options[key];

                // Manual UI update
                if (list.options[key]) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
                save(false);
                if (typeof updateLiveTester === 'function') updateLiveTester();
            });
        });

        const bgPicker = document.getElementById('custom-bg-picker');
        if (bgPicker) {
            bgPicker.addEventListener('input', (e) => {
                list.styles.backgroundColor = e.target.value;

                // Manual Preview Update
                const previewSpan = document.querySelector('.preview-box span');
                if (previewSpan) {
                    previewSpan.style.backgroundColor = list.styles.backgroundColor;
                    // Also update box-shadow for effect
                    previewSpan.style.boxShadow = `0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px ${list.styles.backgroundColor}40`;
                }

                // Just remove 'active' styling from presets
                document.querySelectorAll('.color-btn').forEach(btn => {
                    // Reset scale/box-shadow
                    btn.style.transform = '';
                    btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                });

                save(false);
                if (typeof updateLiveTester === 'function') updateLiveTester();
            });
        }

        document.querySelectorAll('[data-action="toggleStyle"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                list.styles[key] = !list.styles[key];

                // Manual visual update for smoother feel
                if (list.styles[key]) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }

                const previewSpan = document.querySelector('.preview-box span');
                if (previewSpan) {
                    if (key === 'strikeThrough') previewSpan.style.textDecoration = list.styles.strikeThrough ? 'line-through' : 'none';
                    if (key === 'glow') {
                        previewSpan.style.textShadow = list.styles.glow 
                            ? `0 0 8px ${list.styles.backgroundColor}, 0 0 12px ${list.styles.backgroundColor}` 
                            : 'none';
                    }
                }

                save(false);
                if (typeof updateLiveTester === 'function') updateLiveTester();
            });
        });


        const textPicker = document.getElementById('custom-text-picker');
        if (textPicker) {
            textPicker.addEventListener('input', (e) => {
                list.styles.color = e.target.value;

                // Manual Preview Update
                const previewSpan = document.querySelector('.preview-box span');
                if (previewSpan) previewSpan.style.color = list.styles.color;

                save(false);
            });
        }

        const btnSavePreset = document.getElementById('btn-save-preset');
        if (btnSavePreset) {
            btnSavePreset.addEventListener('click', () => {
                const bg = bgPicker ? bgPicker.value : list.styles.backgroundColor;
                const text = textPicker ? textPicker.value : list.styles.color;
                
                // Check for duplicates
                if (!state.config.settings.customStyles) state.config.settings.customStyles = [];
                const exists = state.config.settings.customStyles.some(p => p.bg === bg && p.text === text);
                if (!exists) {
                    state.config.settings.customStyles.push({ bg, text });
                    save(); // Triggers a full re-render so it immediately appears
                }
            });
        }

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bg = btn.dataset.bg;
                const text = btn.dataset.text;
                list.styles = { backgroundColor: bg, color: text };

                // Manual UI Update
                // Update Pickers
                if (bgPicker) bgPicker.value = bg;
                if (textPicker) textPicker.value = text;

                // Update Preview
                const previewSpan = document.querySelector('.preview-box span');
                if (previewSpan) {
                    previewSpan.style.backgroundColor = bg;
                    previewSpan.style.color = text;
                    previewSpan.style.boxShadow = `0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px ${bg}40`;
                }

                // Update Buttons Visual State
                document.querySelectorAll('.color-btn').forEach(b => {
                    if (b === btn) {
                        b.style.boxShadow = `0 0 0 2px white, 0 0 10px ${bg}`;
                        b.style.transform = 'scale(1.1)';
                    } else {
                        b.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                        b.style.transform = '';
                    }
                });

                save(false);
            });
        });

        // Keyword Delete & Drag-Drop logic
        const keywordTable = document.getElementById('keyword-table');
        if (keywordTable) {
            keywordTable.addEventListener('click', (e) => {
                const delBtn = e.target.closest('.btn-delete-keyword');
                if (delBtn) {
                    const row = delBtn.closest('.keyword-row');
                    const word = row.dataset.word;
                    const idx = list.words.indexOf(word);
                    if (idx > -1) {
                        list.words.splice(idx, 1);
                        row.remove();
                        save(false);
                        if (list.words.length === 0) {
                            keywordTable.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; padding: 0.75rem; text-align: center;">No keywords added yet.</div>';
                        }
                    }
                }
            });

            // Keyword Drag and Drop logic
            let draggedKeyword = null;

            keywordTable.addEventListener('dragstart', (e) => {
                const row = e.target.closest('.keyword-row');
                if (row) {
                    draggedKeyword = row;
                    e.dataTransfer.effectAllowed = 'move';
                    row.classList.add('dragging');
                }
            });

            keywordTable.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const row = e.target.closest('.keyword-row');
                if (row && row !== draggedKeyword) {
                    const rect = row.getBoundingClientRect();
                    const offset = e.clientY - rect.top - (rect.height / 2);
                    if (offset < 0) {
                        row.parentNode.insertBefore(draggedKeyword, row);
                    } else {
                        row.parentNode.insertBefore(draggedKeyword, row.nextSibling);
                    }
                }
            });

            keywordTable.addEventListener('drop', (e) => {
                e.preventDefault();
            });

            keywordTable.addEventListener('dragend', (e) => {
                if (draggedKeyword) {
                    draggedKeyword.classList.remove('dragging');
                    draggedKeyword = null;

                    // Update list.words order
                    const newWords = [];
                    keywordTable.querySelectorAll('.keyword-row').forEach(row => {
                        newWords.push(row.dataset.word);
                    });
                    
                    if (newWords.length === list.words.length) {
                        list.words = newWords;
                        save(false);
                    }
                }
            });
        }

        const clearBtn = document.getElementById('btn-clear-words');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all keywords from this list?')) {
                    list.words = [];
                    save();
                    // Will re-render entirely, but we need to rebind tester logic via render
                }
            });
        }

        const form = document.getElementById('add-word-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('new-word-input');
                const val = input.value.trim();
                if (val && !list.words.includes(val)) {
                    list.words.push(val);

                    // Manual DOM Update to avoid shaking
                    const container = document.getElementById('keyword-table');
                    const emptyState = container.querySelector('div[style*="font-style: italic"]');
                    if (emptyState) emptyState.remove();

                    const temp = document.createElement('div');
                    const index = list.words.length - 1;
                    temp.innerHTML = `
                    <div class="keyword-row" draggable="true" data-index="${index}" data-word="${escapeHtml(val)}">
                        <div class="drag-handle">${ICONS.grip}</div>
                        <div class="keyword-text">${escapeHtml(val)}</div>
                        <button class="btn btn-icon btn-delete-keyword" data-index="${index}" title="Remove Keyword" aria-label="Remove Keyword" style="opacity: 0.7; padding: 2px;">
                            ${ICONS.trash}
                        </button>
                    </div>`;
                    const newRow = temp.firstElementChild;
                    container.appendChild(newRow);
                    input.value = '';

                    save(false); // Skip render
                } else {
                    input.value = '';
                }
            });
        }

        const newInput = document.getElementById('new-word-input');
        if (newInput) {
            // Regex Validation & Live Tester trigger
            newInput.addEventListener('input', (e) => {
                const val = e.target.value;
                const btn = document.getElementById('btn-add-word');
                const errorMsg = document.getElementById('regex-error-msg');

                if (list.options.isRegex && val) {
                    try {
                        new RegExp(val);
                        newInput.classList.remove('invalid');
                        if (btn) btn.disabled = false;
                        if (errorMsg) errorMsg.style.display = 'none';
                    } catch (err) {
                        newInput.classList.add('invalid');
                        if (btn) btn.disabled = true;
                        if (errorMsg) errorMsg.style.display = 'block';
                        if (errorMsg) errorMsg.textContent = "Invalid Regex: " + err.message.split(':')[1] || "Syntax Error";
                    }
                } else {
                    newInput.classList.remove('invalid');
                    if (btn) btn.disabled = false;
                    if (errorMsg) errorMsg.style.display = 'none';
                }
            });

            newInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const lines = paste.split(/\r\n|\r|\n/);
                let added = false;

                lines.forEach(line => {
                    const val = line.trim();
                    if (!val) return;

                    // Case-Insensitive check
                    let exists = false;
                    if (!list.options.caseSensitive) {
                        exists = list.words.some(w => w.toLowerCase() === val.toLowerCase());
                    } else {
                        exists = list.words.includes(val);
                    }

                    if (!exists) {
                        list.words.push(val);
                        added = true;
                    }
                });

                if (added) {
                    save();
                }
            });
        }
    }

    // 4. Settings View Interactions
    if (state.activeView === 'settings') {
        const globalToggle = document.getElementById('setting-global-toggle');
        if (globalToggle) {
            globalToggle.addEventListener('click', () => {
                state.config.settings.globalEnabled = !state.config.settings.globalEnabled;

                // Manual UI Toggle
                if (state.config.settings.globalEnabled) {
                    globalToggle.classList.add('on');
                    globalToggle.classList.remove('off');
                } else {
                    globalToggle.classList.add('off');
                    globalToggle.classList.remove('on');
                }
                save(false);
            });
        }

        const perfToggle = document.getElementById('setting-perf-toggle');
        if (perfToggle) {
            perfToggle.addEventListener('click', () => {
                state.config.settings.performanceMode = !state.config.settings.performanceMode;

                // Manual UI Toggle
                if (state.config.settings.performanceMode) {
                    perfToggle.classList.add('on');
                    perfToggle.classList.remove('off');
                } else {
                    perfToggle.classList.add('off');
                    perfToggle.classList.remove('on');
                }
                save(false);
            });
        }

        const excludedArea = document.getElementById('setting-excluded');
        if (excludedArea) {
            excludedArea.addEventListener('change', (e) => {
                const lines = e.target.value.split('\n').map(s => s.trim()).filter(s => s);
                state.config.settings.excludedDomains = lines;
                save(false); // No visual change needed on textarea
            });
        }

        const themeSelect = document.getElementById('setting-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                state.config.settings.theme = e.target.value;
                applyTheme(); // Instant update
                save(false);
            });
        }

        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(state.config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `highlight-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        const importTrigger = document.getElementById('btn-import-trigger');
        const fileInput = document.getElementById('file-import');
        if (importTrigger && fileInput) {
            importTrigger.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const imported = JSON.parse(evt.target.result);
                        if (imported.lists && Array.isArray(imported.lists)) {
                            state.config = imported;
                            if (!state.config.settings) {
                                state.config.settings = JSON.parse(JSON.stringify(DEFAULT_CONFIG.settings));
                            }
                            save();
                            showToast('Rules imported successfully!', 'success');
                        } else {
                            showToast('Invalid JSON format.', 'error');
                        }
                    } catch (err) {
                        showToast('Error parsing JSON.', 'error');
                    }
                };
                reader.readAsText(file);
            });
        }

        const btnSavePresetSettings = document.getElementById('btn-save-preset-settings');
        if (btnSavePresetSettings) {
            btnSavePresetSettings.addEventListener('click', () => {
                const bg = document.getElementById('setting-new-bg').value;
                const text = document.getElementById('setting-new-text').value;
                
                if (!state.config.settings.customStyles) state.config.settings.customStyles = [];
                const exists = state.config.settings.customStyles.some(p => p.bg === bg && p.text === text);
                
                if (!exists) {
                    state.config.settings.customStyles.push({ bg, text });
                    save();
                } else {
                    showToast('Preset already exists', 'info');
                }
            });
        }
    }

    // 5. Summary View Interactions
    if (state.activeView === 'summary') {
        const refreshSummaryBtn = document.getElementById('btn-refresh-summary');
        if (refreshSummaryBtn) {
            refreshSummaryBtn.addEventListener('click', fetchSummaryData);
        }

        const exportCsvBtn = document.getElementById('btn-export-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                if (state.summaryData.length === 0) return showToast('No data to export.', 'info');

                let csvContent = "Rule Name,Text,Same Text Count,Context\n";
                state.summaryData.forEach(item => {
                    const ruleName = (item.ruleName || '').replace(/"/g, '""');
                    const text = (item.text || '').replace(/"/g, '""');
                    const sameTextCount = item.sameTextCount || 0;
                    const fullElementText = (item.fullElementText || '').replace(/"/g, '""').replace(/\n/g, " ");
                    csvContent += `"${ruleName}","${text}",${sameTextCount},"${fullElementText}"\n`;
                });

                // Use encodeURIComponent to properly handle '#' and other special characters in data URIs
                const encodedUri = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csvContent);
                const a = document.createElement('a');
                a.href = encodedUri;
                a.download = `highlight-summary-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
            });
        }

        document.querySelectorAll('.btn-scroll').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = btn.dataset.index;
                chrome.tabs?.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs[0]?.id) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: "scroll_to_mark", index: parseInt(index) });
                    }
                });
            });
        });
    }

    // Global: Deleting Custom Presets (requires Alt)
    document.querySelectorAll('.btn-delete-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!e.altKey) {
                showToast('Hold Alt key to delete preset', 'info');
                return;
            }
            const idx = parseInt(btn.dataset.index);
            if (!isNaN(idx)) {
                state.config.settings.customStyles.splice(idx, 1);
                save();
            }
        });
    });
}

function fetchSummaryData() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "get_summary" }, (response) => {
                    if (chrome.runtime.lastError) {
                        state.summaryData = [];
                        render();
                        return;
                    }
                    state.summaryData = response?.data || [];
                    render();
                });
            } else {
                state.summaryData = [];
                render();
            }
        });
    } else {
        // Mock data for dev
        state.summaryData = [];
        render();
    }
}

let analyticsDataCache = { totalHighlights: 0, ruleUsage: {} };

function fetchAnalyticsData() {
    let pending = 2;
    const done = () => {
        pending--;
        if (pending === 0) render();
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['highlight_analytics'], (result) => {
            if (result.highlight_analytics) {
                analyticsDataCache = result.highlight_analytics;
            }
            done();
        });
    } else {
        done();
    }

    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "get_page_analytics" }, (response) => {
                    if (!chrome.runtime.lastError && response?.analytics) {
                        state.pageAnalytics = response.analytics;
                    } else {
                        state.pageAnalytics = { totalHighlights: 0, ruleUsage: {} };
                    }
                    done();
                });
            } else {
                state.pageAnalytics = { totalHighlights: 0, ruleUsage: {} };
                done();
            }
        });
    } else {
        state.pageAnalytics = { totalHighlights: 0, ruleUsage: {} };
        done();
    }
}

function renderAnalyticsHtml() {
    const isCurrent = state.analyticsTab === 'current';
    
    const genTabHtml = (isCurrentTab, sourceData) => {
        const total = sourceData.totalHighlights || 0;
        const ruleUsage = sourceData.ruleUsage || {};
        const displayRules = Object.entries(ruleUsage)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        return `
        <div style="background: var(--bg-glass); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
            <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary-light); line-height: 1;">${total}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.5rem;">${isCurrentTab ? 'Highlights on this page' : 'Total Highlights Made'}</div>
        </div>

        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Top Rules Used</h3>
        ${displayRules.length === 0 ? '<div style="color: var(--text-muted); font-size: 0.8rem;">No data recorded yet. Keep highlighting!</div>' : ''}
        <div class="list-container" style="padding: 0;">
            ${displayRules.map(([ruleName, count]) => `
                <div class="list-item" style="cursor: default;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(ruleName)}</div>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--primary-light); font-weight: 700; background: rgba(139, 92, 246, 0.15); padding: 2px 8px; border-radius: 12px;">${count}</div>
                </div>
            `).join('')}
        </div>`;
    };

    const currentHtml = genTabHtml(true, state.pageAnalytics);
    const overallHtml = genTabHtml(false, analyticsDataCache);

    return `
    <div class="editor-view">
        <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem;">Analytics Dashboard</h2>
        
        <div class="analytics-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: var(--bg-glass); padding: 0.25rem; border-radius: 0.5rem; border: 1px solid var(--border);">
            <button class="btn btn-secondary" data-action="switch-analytics-tab-no-render" data-tab="current" style="flex: 1; border: none; background: ${isCurrent ? 'var(--primary-light)' : 'transparent'}; color: ${isCurrent ? '#fff' : 'var(--text-muted)'}; transition: background 0.2s, color 0.2s;">Active Tab</button>
            <button class="btn btn-secondary" data-action="switch-analytics-tab-no-render" data-tab="overall" style="flex: 1; border: none; background: ${!isCurrent ? 'var(--primary-light)' : 'transparent'}; color: ${!isCurrent ? '#fff' : 'var(--text-muted)'}; transition: background 0.2s, color 0.2s;">Overall</button>
        </div>

        <div id="analytics-tab-current" style="display: ${isCurrent ? 'block' : 'none'};">
            ${currentHtml}
        </div>
        <div id="analytics-tab-overall" style="display: ${!isCurrent ? 'block' : 'none'};">
            ${overallHtml}
        </div>
    </div>`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon based on type
    let icon = ICONS.check;
    if (type === 'error') icon = ICONS.alert;

    toast.innerHTML = `<div style="flex-shrink:0;">${icon}</div><div>${message}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

function confirmAction(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal">
            <h3 style="margin: 0 0 0.5rem; font-size: 1.1rem;">Confirm Action</h3>
            <p style="margin: 0 0 1.5rem; color: var(--text-muted); font-size: 0.9rem;">${message}</p>
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
                <button id="modal-confirm" class="btn btn-primary" style="background: var(--danger);">Confirm</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('modal-cancel').addEventListener('click', () => overlay.remove());
    document.getElementById('modal-confirm').addEventListener('click', () => {
        onConfirm();
        overlay.remove();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.list-item:not([style*="opacity: 0.5"])')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleRemoveWord(list, word, tagElement) {
    list.words = list.words.filter(w => w !== word);
    if (tagElement) tagElement.remove();

    const container = document.querySelector('.tag-container');
    if (container && list.words.length === 0) {
        container.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No keywords added yet.</span>';
    }
    save(false);

    // Attempt to update live tester if we're in editor view
    const input = document.getElementById('live-test-input');
    if (input) {
        // Trigger input event to re-evaluate the tester
        input.dispatchEvent(new Event('input'));
    }
}

function createList() {
    const newList = {
        id: crypto.randomUUID(),
        name: 'New Rule',
        words: [],
        styles: { backgroundColor: '#6610f2', color: '#ffffff' },
        enabled: true,
        options: { caseSensitive: false, wholeWord: true, isRegex: false, crossNode: false },
        allowedDomains: [],
        targetSelectors: []
    };
    state.config.lists.push(newList);
    state.lastCreatedId = newList.id; // Mark for animation
    state.editingListId = newList.id;
    state.activeView = 'editor';
    save();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
