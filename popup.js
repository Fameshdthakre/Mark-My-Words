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
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
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
        options: { caseSensitive: false, wholeWord: true, isRegex: false }
    }],
    settings: {
        globalEnabled: true,
        excludedDomains: [],
        performanceMode: false
    }
};

// --- State ---
let state = {
    config: DEFAULT_CONFIG,
    activeView: 'dashboard', // 'dashboard' | 'editor' | 'settings'
    editingListId: null,
    searchQuery: '',
    searchVisible: false
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
                render();
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
        render();
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
    chrome.tabs?.query({active: true, currentWindow: true}, function(tabs) {
        if (chrome.runtime.lastError) return;
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "refresh_highlights"}, () => {
                if(chrome.runtime.lastError) { /* ignore */ }
            });
        }
    });
}

function render() {
    const app = document.getElementById('app');

    // Create Toast Container if missing
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div');
        tc.id = 'toast-container';
        document.body.appendChild(tc);
    }
    
    // Header
    const headerHtml = `
    <header>
        <div class="flex items-center">
            <div class="logo-box">${ICONS.zap}</div>
            <div>
                <h1 class="app-title">Mark My Words</h1>
                <div class="status-badge">
                    <div class="status-dot" style="background-color: ${state.config.settings.globalEnabled ? 'var(--accent)' : 'var(--text-muted)'}"></div> 
                    ${state.config.settings.globalEnabled ? 'Active' : 'Paused'}
                </div>
            </div>
        </div>
        <div>
            ${state.activeView === 'dashboard' 
                ? `<button class="btn btn-icon" id="btn-refresh" title="Re-scan Page" aria-label="Re-scan Page" style="margin-right: 4px;">${ICONS.eye}</button>
                   <button class="btn btn-icon" id="btn-settings" title="Settings" aria-label="Settings">${ICONS.settings}</button>` 
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
    }

    // Preview (Only show on Dashboard/Editor)
    const previewHtml = state.activeView !== 'settings' ? renderPreviewHtml() : '';

    app.innerHTML = `
        ${headerHtml}
        <main style="flex: 1; overflow-y: auto; padding-bottom: 2rem;">
            ${mainHtml}
        </main>
        ${previewHtml}
        <div class="signature">
            <div class="brand-line">Created with ❤️ by <strong>TransFamesh</strong>.</div>
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
                <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;">
                    ${escapeHtml(list.name)}
                    ${state.searchQuery ? `<span style="font-size: 0.7rem; color: var(--accent); margin-left: 0.5rem;">(matches found)</span>` : ''}
                </div>
                <div class="flex items-center gap-2" style="margin-top: 0.35rem;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${list.styles.backgroundColor}; box-shadow: 0 0 6px ${list.styles.backgroundColor};"></div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">${list.words.length} KEYWORDS</span>
                </div>
            </div>
            
            <button class="btn btn-icon" data-action="delete" data-id="${list.id}" title="Delete Rule" aria-label="Delete Rule" style="opacity: 0.6;">
                ${ICONS.trash}
            </button>
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
                    <input type="text" id="input-search" value="${state.searchQuery}" placeholder="Search..." style="width: 100%; background: transparent; border: none; color: white; font-size: 0.8rem; padding: 0.25rem; outline: none;">
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

        <div class="options-grid">
            <div class="option-card ${list.options.caseSensitive ? 'active' : ''}" data-action="toggleOption" data-key="caseSensitive">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">Aa</span> Match Case
            </div>
            <div class="option-card ${list.options.wholeWord ? 'active' : ''}" data-action="toggleOption" data-key="wholeWord">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">Abc</span> Whole Word
            </div>
            <div class="option-card ${list.options.isRegex ? 'active' : ''}" data-action="toggleOption" data-key="isRegex">
                <span style="font-size: 1.25rem; margin-bottom: 2px;">.*</span> Regex
            </div>
        </div>

        <div class="input-group">
            <label class="label">Highlight Style</label>
            <div class="color-picker-row" style="flex-wrap: wrap; gap: 0.5rem;">
                ${PRESETS.map(p => {
                    const isActive = list.styles.backgroundColor === p.bg;
                    const style = isActive 
                        ? `background-color: ${p.bg}; color: ${p.text}; box-shadow: 0 0 0 2px white, 0 0 10px ${p.bg}; transform: scale(1.1);`
                        : `background-color: ${p.bg}; color: ${p.text};`;
                    return `<button class="color-btn" style="${style}" data-action="setColor" data-bg="${p.bg}" data-text="${p.text}">Aa</button>`;
                }).join('')}
            </div>
            
            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                <div style="flex: 1;">
                    <label class="label" style="font-size: 0.75rem;">Background</label>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="color" id="custom-bg-picker" value="${list.styles.backgroundColor}" style="width: 100%; height: 36px; border: none; border-radius: 4px; cursor: pointer;">
                    </div>
                </div>
                <div style="flex: 1;">
                    <label class="label" style="font-size: 0.75rem;">Text</label>
                     <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="color" id="custom-text-picker" value="${list.styles.color}" style="width: 100%; height: 36px; border: none; border-radius: 4px; cursor: pointer;">
                    </div>
                </div>
            </div>
        </div>

        <div class="input-group" style="margin-bottom: 0;">
             <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                    <label class="label" style="margin:0">Keywords</label>
                    <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0.7;">(${list.words.length})</span>
                </div>
                ${list.words.length > 0 ? `<button id="btn-clear-words" class="btn btn-secondary" style="font-size: 0.7rem; padding: 2px 8px; height: auto;">Clear All</button>` : ''}
             </div>
            <form id="add-word-form" class="word-input-container">
                <input type="text" id="new-word-input" class="word-input" placeholder="Type a word and press Enter..." autocomplete="off">
                <button type="submit" id="btn-add-word" class="btn btn-secondary" style="border-radius: 0.75rem;">${ICONS.plus}</button>
            </form>
            <div id="regex-error-msg" class="word-input-error">Invalid Regular Expression</div>
            <div class="tag-container">
                ${list.words.map(w => `
                    <span class="tag" style="background-color: ${list.styles.backgroundColor}20; color: white; border: 1px solid ${list.styles.backgroundColor}60;">
                        ${escapeHtml(w)} <span style="cursor: pointer; opacity: 0.7; margin-left: 4px; display: flex;" data-action="removeWord" data-word="${escapeHtml(w)}">${ICONS.x}</span>
                    </span>
                `).join('')}
                ${list.words.length === 0 ? '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No keywords added yet.</span>' : ''}
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
                <div style="font-weight: 600; font-size: 0.95rem; color: white;">Enable Extension</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Turn off highlighting globally</div>
            </div>
            <div class="toggle-switch ${s.globalEnabled ? 'on' : 'off'}" id="setting-global-toggle">
                <div class="toggle-dot"></div>
            </div>
        </div>

        <!-- Performance Mode -->
        <div class="list-item" style="cursor: default; margin-bottom: 1.5rem;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; color: white;">Performance Mode</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Limit highlights on large pages (>50k chars)</div>
            </div>
            <div class="toggle-switch ${s.performanceMode ? 'on' : 'off'}" id="setting-perf-toggle">
                <div class="toggle-dot"></div>
            </div>
        </div>

        <!-- Excluded Domains -->
        <div class="input-group">
            <label class="label">Excluded Domains (One per line)</label>
            <textarea id="setting-excluded" class="word-input" rows="4" style="width: 100%; resize: vertical; font-family: monospace;" placeholder="example.com&#10;gmail.com">${s.excludedDomains.join('\n')}</textarea>
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
            Mark My Words v1.2.0<br>
            Sync enabled
        </div>
    </div>`;
}

function renderPreviewHtml() {
    const list = state.activeView === 'editor' ? state.config.lists.find(l => l.id === state.editingListId) : null;
    let sampleText = "Preview: Mark My Words makes it easy to style your web.";
    
    if (list) {
         const hl = `<span style="background-color: ${list.styles.backgroundColor}; color: ${list.styles.color}; padding: 0 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Mark My Words</span>`;
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
    if (backBtn) backBtn.addEventListener('click', () => { state.activeView = 'dashboard'; render(); });

    const createBtn = document.getElementById('btn-create');
    if (createBtn) createBtn.addEventListener('click', createList);

    const getStartedBtn = document.getElementById('btn-get-started');
    if (getStartedBtn) getStartedBtn.addEventListener('click', createList);

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => { state.activeView = 'settings'; render(); });

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
            if(input) {
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
            } else if (action === 'toggle') {
                e.stopPropagation();
                const l = state.config.lists.find(x => x.id === id);
                if(l) { l.enabled = !l.enabled; save(); }
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
            // Update state on input to keep it fresh in memory
            nameInput.addEventListener('input', (e) => { list.name = e.target.value; });
            // Save and re-render only when done editing (blur/enter)
            nameInput.addEventListener('change', () => { save(false); });
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
            });
        }
        
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

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = btn.dataset.bg;
                const text = btn.dataset.text;
                list.styles = { backgroundColor: bg, color: text };

                // Manual UI Update
                // Update Pickers
                if(bgPicker) bgPicker.value = bg;
                if(textPicker) textPicker.value = text;

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

        document.querySelectorAll('[data-action="removeWord"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleRemoveWord(list, btn.dataset.word, btn.closest('.tag'));
            });
        });

        const clearBtn = document.getElementById('btn-clear-words');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all keywords from this list?')) {
                    list.words = [];
                    save();
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
                    const container = document.querySelector('.tag-container');
                    // Remove "No keywords" placeholder if it exists
                    if (list.words.length === 1) {
                         const placeholder = container.querySelector('span[style*="font-style: italic"]');
                         if(placeholder) placeholder.remove();
                    }

                    const temp = document.createElement('div');
                    temp.innerHTML = `
                    <span class="tag" style="background-color: ${list.styles.backgroundColor}20; color: white; border: 1px solid ${list.styles.backgroundColor}60;">
                        ${escapeHtml(val)} <span style="cursor: pointer; opacity: 0.7; margin-left: 4px; display: flex;" data-action="removeWord" data-word="${escapeHtml(val)}">${ICONS.x}</span>
                    </span>`;
                    const newTag = temp.firstElementChild;

                    // Attach delete event
                    const delBtn = newTag.querySelector('[data-action="removeWord"]');
                    if (delBtn) {
                        delBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleRemoveWord(list, val, newTag);
                        });
                    }

                    container.appendChild(newTag);
                    input.value = '';

                    save(false); // Skip render
                } else {
                    input.value = ''; 
                }
            });
        }
        
        const newInput = document.getElementById('new-word-input');
        if (newInput) {
            // Regex Validation
            newInput.addEventListener('input', (e) => {
                const val = e.target.value;
                const btn = document.getElementById('btn-add-word');
                const errorMsg = document.getElementById('regex-error-msg');
                
                if (list.options.isRegex && val) {
                    try {
                        new RegExp(val);
                        newInput.classList.remove('invalid');
                        if(btn) btn.disabled = false;
                        if(errorMsg) errorMsg.style.display = 'none';
                    } catch (err) {
                        newInput.classList.add('invalid');
                        if(btn) btn.disabled = true;
                        if(errorMsg) errorMsg.style.display = 'block';
                        if(errorMsg) errorMsg.textContent = "Invalid Regex: " + err.message.split(':')[1] || "Syntax Error";
                    }
                } else {
                    newInput.classList.remove('invalid');
                    if(btn) btn.disabled = false;
                    if(errorMsg) errorMsg.style.display = 'none';
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

        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(state.config, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `highlight-pro-backup-${new Date().toISOString().slice(0,10)}.json`;
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
                            if(!state.config.settings) {
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
    }
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
}

function createList() {
    const newList = {
        id: crypto.randomUUID(),
        name: 'New Rule',
        words: [],
        styles: { backgroundColor: '#6610f2', color: '#ffffff' },
        enabled: true,
        options: { caseSensitive: false, wholeWord: true, isRegex: false }
    };
    state.config.lists.push(newList);
    state.lastCreatedId = newList.id; // Mark for animation
    state.editingListId = newList.id;
    state.activeView = 'editor';
    save();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
