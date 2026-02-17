// --- Icons (SVG Strings) ---
const ICONS = {
    zap: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    settings: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    chevronLeft: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
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

const DEFAULT_LIST = {
    id: 'default-1',
    name: 'Important Terms',
    words: ['React', 'Extension', 'highlight', 'code'],
    styles: { backgroundColor: '#6610f2', color: '#ffffff' },
    enabled: true,
    options: { caseSensitive: false, wholeWord: true, isRegex: false }
};

let state = {
    lists: [],
    activeView: 'dashboard',
    editingListId: null
};

// --- App Logic ---

function init() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['highlighter_lists_v3'], (result) => {
            state.lists = result.highlighter_lists_v3 || [DEFAULT_LIST];
            render();
        });
    } else {
        const saved = localStorage.getItem('highlighter_lists_v3');
        state.lists = saved ? JSON.parse(saved) : [DEFAULT_LIST];
        render();
    }
}

function save() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ 'highlighter_lists_v3': state.lists }, () => {
            // Error handling for "receiving end does not exist"
            chrome.tabs?.query({active: true, currentWindow: true}, function(tabs) {
                if (chrome.runtime.lastError) return; // Ignore if query fails
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "refresh_highlights"}, (response) => {
                        // Swallow error if content script isn't there
                        const err = chrome.runtime.lastError;
                        if(err) { /* console.log("Content script not ready in this tab"); */ }
                    });
                }
            });
        });
    }
    localStorage.setItem('highlighter_lists_v3', JSON.stringify(state.lists));
    render();
}

function render() {
    const app = document.getElementById('app');

    // Header
    const headerHtml = `
    <header>
        <div class="flex items-center">
            <div class="logo-box">${ICONS.zap}</div>
            <div>
                <h1 class="app-title">Highlight Pro</h1>
                <div class="status-badge">
                    <div class="status-dot"></div> Extension Active
                </div>
            </div>
        </div>
        <div>
            ${state.activeView === 'dashboard'
                ? `<button class="btn btn-icon" id="btn-settings" title="Settings">${ICONS.settings}</button>`
                : `<button id="nav-back" class="btn btn-secondary" style="font-size: 0.75rem;">${ICONS.chevronLeft} Back</button>`
            }
        </div>
    </header>`;

    // Main Content
    let mainHtml = '';
    if (state.activeView === 'dashboard') {
        mainHtml = renderDashboardHtml();
    } else {
        mainHtml = renderEditorHtml();
    }

    // Preview
    const previewHtml = renderPreviewHtml();

    app.innerHTML = `
        ${headerHtml}
        <main style="flex: 1; overflow-y: auto; padding-bottom: 2rem;">
            ${mainHtml}
        </main>
        ${previewHtml}
    `;

    // Post-render Event Attachment (CSP Safe)
    attachEvents();
}

// --- HTML Generators (Strings Only) ---

function renderDashboardHtml() {
    if (state.lists.length === 0) {
        return `
        <div class="dashboard-header">
            <div>
                <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0; letter-spacing: -0.01em;">Your Rules</h2>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">0 active rules</p>
            </div>
            <button id="btn-create" class="btn btn-primary">${ICONS.plus} New</button>
        </div>
        <div style="padding: 4rem 2rem; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-glass); display: flex; items-center: center; justify-content: center; color: var(--text-muted);">
               ${ICONS.zap}
            </div>
            <span>No rules yet. Create one to start highlighting!</span>
        </div>`;
    }

    const listsHtml = state.lists.map(list => `
        <div class="list-item" data-id="${list.id}">
            <div class="toggle-switch ${list.enabled ? 'on' : 'off'}" data-action="toggle" data-id="${list.id}">
                <div class="toggle-dot"></div>
            </div>

            <div class="list-content" style="flex: 1; min-width: 0; padding: 0 0.5rem;" data-action="edit" data-id="${list.id}">
                <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;">${list.name}</div>
                <div class="flex items-center gap-2" style="margin-top: 0.35rem;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${list.styles.backgroundColor}; box-shadow: 0 0 6px ${list.styles.backgroundColor};"></div>
                    <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">${list.words.length} KEYWORDS</span>
                </div>
            </div>

            <button class="btn btn-icon" data-action="delete" data-id="${list.id}" style="opacity: 0.6;">
                ${ICONS.trash}
            </button>
        </div>
    `).join('');

    return `
    <div class="dashboard-header">
        <div>
            <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0; letter-spacing: -0.01em;">Your Rules</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">${state.lists.length} active rules</p>
        </div>
        <button id="btn-create" class="btn btn-primary">${ICONS.plus} New</button>
    </div>
    <div class="list-container">${listsHtml}</div>`;
}

function renderEditorHtml() {
    const list = state.lists.find(l => l.id === state.editingListId);
    if (!list) return '';

    return `
    <div class="editor-view">
        <div class="input-group">
            <label class="label">Rule Name</label>
            <input type="text" id="input-name" class="title-input" value="${list.name}" placeholder="Enter rule name...">
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
            <div class="color-picker-row">
                ${PRESETS.map(p => {
                    const isActive = list.styles.backgroundColor === p.bg;
                    const style = isActive
                        ? `background-color: ${p.bg}; color: ${p.text}; box-shadow: 0 0 0 2px white, 0 0 10px ${p.bg}; transform: scale(1.1);`
                        : `background-color: ${p.bg}; color: ${p.text};`;
                    return `<button class="color-btn" style="${style}" data-action="setColor" data-bg="${p.bg}" data-text="${p.text}">Aa</button>`;
                }).join('')}
                <input type="color" id="native-color-picker" value="${list.styles.backgroundColor}" style="visibility: hidden; width: 0; position: absolute;">
            </div>
        </div>

        <div class="input-group" style="margin-bottom: 0;">
             <div class="flex justify-between items-center mb-2">
                <label class="label" style="margin:0">Keywords</label>
             </div>
            <form id="add-word-form" class="word-input-container">
                <input type="text" id="new-word-input" class="word-input" placeholder="Type a word and press Enter..." autocomplete="off">
                <button type="submit" class="btn btn-secondary" style="border-radius: 0.75rem;">${ICONS.plus}</button>
            </form>
            <div class="tag-container">
                ${list.words.map(w => `
                    <span class="tag" style="background-color: ${list.styles.backgroundColor}20; color: white; border: 1px solid ${list.styles.backgroundColor}60;">
                        ${w} <span style="cursor: pointer; opacity: 0.7; margin-left: 4px; display: flex;" data-action="removeWord" data-word="${w}">${ICONS.x}</span>
                    </span>
                `).join('')}
                ${list.words.length === 0 ? '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No keywords added yet.</span>' : ''}
            </div>
        </div>
    </div>`;
}

function renderPreviewHtml() {
    const list = state.activeView === 'editor' ? state.lists.find(l => l.id === state.editingListId) : null;
    let sampleText = "Preview: Highlight Pro makes it easy to style your web.";

    if (list) {
         const hl = `<span style="background-color: ${list.styles.backgroundColor}; color: ${list.styles.color}; padding: 0 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Highlight Pro</span>`;
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

// --- Event Handlers (CSP Safe) ---

function attachEvents() {
    // 1. Navigation & Global
    const backBtn = document.getElementById('nav-back');
    if (backBtn) backBtn.addEventListener('click', () => { state.activeView = 'dashboard'; render(); });

    const createBtn = document.getElementById('btn-create');
    if (createBtn) createBtn.addEventListener('click', createList);

    // 2. Dashboard List Items (Event Delegation)
    const listContainer = document.querySelector('.list-container');
    if (listContainer) {
        listContainer.addEventListener('click', (e) => {
            // Traverse up to find the actionable element
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (action === 'edit') {
                editList(id);
            } else if (action === 'toggle') {
                e.stopPropagation(); // Prevent triggering edit
                toggleList(id);
            } else if (action === 'delete') {
                e.stopPropagation();
                deleteList(id);
            }
        });
    }

    // 3. Editor Interactions
    if (state.activeView === 'editor') {
        const list = state.lists.find(l => l.id === state.editingListId);
        if (!list) return;

        // Name Input
        const nameInput = document.getElementById('input-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => updateListProperty('name', e.target.value));
        }

        // Options (Match Case, etc)
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.dataset.key;
                toggleListOption(key);
            });
        });

        // Color Picker Buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const bg = btn.dataset.bg;
                const text = btn.dataset.text;
                updateListStyle(bg, text);
            });
        });

        // Native Color Picker
        const nativePicker = document.getElementById('native-color-picker');
        if (nativePicker) {
            nativePicker.addEventListener('change', (e) => {
                updateListStyle(e.target.value, '#ffffff');
            });
        }

        // Remove Word (Tag clicks)
        document.querySelectorAll('[data-action="removeWord"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent bubbling if needed
                const w = btn.dataset.word;
                removeWord(w);
            });
        });

        // Add Word Form
        const form = document.getElementById('add-word-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('new-word-input');
                const val = input.value.trim();
                if (val) {
                    if (!list.words.includes(val)) {
                        list.words.push(val);
                        save();
                    } else {
                        input.value = '';
                    }
                }
            });
        }
    }
}

// --- Action Functions ---

function createList() {
    const newList = {
        id: crypto.randomUUID(),
        name: 'New Rule',
        words: [],
        styles: { backgroundColor: '#6610f2', color: '#ffffff' },
        enabled: true,
        options: { caseSensitive: false, wholeWord: true, isRegex: false }
    };
    state.lists.push(newList);
    state.editingListId = newList.id;
    state.activeView = 'editor';
    save();
}

function editList(id) {
    state.editingListId = id;
    state.activeView = 'editor';
    render();
}

function deleteList(id) {
    state.lists = state.lists.filter(l => l.id !== id);
    save();
}

function toggleList(id) {
    const l = state.lists.find(x => x.id === id);
    if(l) {
        l.enabled = !l.enabled;
        save();
    }
}

function updateListProperty(key, val) {
    const l = state.lists.find(x => x.id === state.editingListId);
    if(l) {
        l[key] = val;
        save();
    }
}

function updateListStyle(bg, txt) {
    const l = state.lists.find(x => x.id === state.editingListId);
    if(l) {
        l.styles = { backgroundColor: bg, color: txt };
        save();
    }
}

function toggleListOption(key) {
    const l = state.lists.find(x => x.id === state.editingListId);
    if(l) {
        l.options[key] = !l.options[key];
        save();
    }
}

function removeWord(w) {
    const l = state.lists.find(x => x.id === state.editingListId);
    if(l) {
        l.words = l.words.filter(word => word !== w);
        save();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', init);