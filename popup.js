// --- Configuration ---
const API_KEY = ""; // Runtime provided

// --- Icons (SVG Strings) ---
const ICONS = {
    zap: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    trash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    x: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    sparkles: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`,
    chevronLeft: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    eye: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
};

const PRESETS = [
    { bg: '#4f46e5', text: '#ffffff', name: 'Indigo' },
    { bg: '#10b981', text: '#ffffff', name: 'Emerald' },
    { bg: '#f59e0b', text: '#ffffff', name: 'Amber' },
    { bg: '#ef4444', text: '#ffffff', name: 'Rose' },
    { bg: '#8b5cf6', text: '#ffffff', name: 'Violet' },
    { bg: '#ec4899', text: '#ffffff', name: 'Pink' },
    { bg: '#06b6d4', text: '#ffffff', name: 'Cyan' },
    { bg: '#ffffff', text: '#000000', name: 'Pure White' },
];

const DEFAULT_LIST = {
    id: 'default-1',
    name: 'Important Terms',
    words: ['React', 'Extension', 'highlight', 'code'],
    styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
    enabled: true,
    options: { caseSensitive: false, wholeWord: true, isRegex: false }
};

// --- State ---
let state = {
    lists: [],
    activeView: 'dashboard', // 'dashboard' | 'editor'
    editingListId: null,
    isExtracting: false
};

// --- Gemini API ---
async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: "You are a helpful assistant. Return only the requested comma-separated list." }] }
            })
        });
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

// --- App Logic ---

function init() {
    // Load from Storage
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
            chrome.tabs?.query({active: true, currentWindow: true}, function(tabs) {
                if(tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, {action: "refresh_highlights"});
            });
        });
    }
    localStorage.setItem('highlighter_lists_v3', JSON.stringify(state.lists));
    render();
}

function render() {
    const app = document.getElementById('app');
    app.innerHTML = `
        ${renderHeader()}
        <main style="flex: 1; overflow-y: auto;">
            ${state.activeView === 'dashboard' ? renderDashboard() : renderEditor()}
        </main>
        ${renderPreview()}
    `;
    
    // Re-attach event listeners after render
    attachEvents();
}

function renderHeader() {
    return `
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
                ? `<button class="btn btn-icon">${ICONS.settings}</button>` 
                : `<button id="nav-back" class="btn btn-secondary" style="padding: 0.25rem 0.75rem;">${ICONS.chevronLeft} Back</button>`
            }
        </div>
    </header>`;
}

function renderDashboard() {
    if (state.lists.length === 0) {
        return `
        <div class="dashboard-header">
            <div>
                <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Library</h2>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">Manage your rules</p>
            </div>
            <button id="btn-create" class="btn btn-primary">${ICONS.plus} New Rule</button>
        </div>
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">Library is empty</div>`;
    }

    const listsHtml = state.lists.map(list => `
        <div class="list-item" onclick="editList('${list.id}')">
            <div class="toggle-switch ${list.enabled ? 'on' : 'off'}" onclick="event.stopPropagation(); toggleList('${list.id}')">
                <div class="toggle-dot"></div>
            </div>
            <div style="flex: 1; overflow: hidden; cursor: pointer;">
                <div style="font-weight: 500; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${list.name}</div>
                <div class="flex items-center gap-2" style="margin-top: 0.25rem;">
                    <span style="font-size: 0.625rem; color: var(--text-muted); font-weight: 700;">${list.words.length} ITEMS</span>
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${list.styles.backgroundColor};"></div>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-icon" onclick="event.stopPropagation(); deleteList('${list.id}')">${ICONS.trash}</button>
            </div>
        </div>
    `).join('');

    return `
    <div class="dashboard-header">
        <div>
            <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Library</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0 0;">Manage rules</p>
        </div>
        <div class="flex flex-col gap-2">
            <button id="btn-create" class="btn btn-primary">${ICONS.plus} New Rule</button>
            <button id="btn-ai" class="btn btn-secondary" ${state.isExtracting ? 'disabled' : ''}>
                ${state.isExtracting ? '...' : ICONS.sparkles} AI Extract
            </button>
        </div>
    </div>
    <div class="list-container">${listsHtml}</div>`;
}

function renderEditor() {
    const list = state.lists.find(l => l.id === state.editingListId);
    if (!list) return '';

    return `
    <div class="editor-view">
        <div class="input-group">
            <label class="label">List Title</label>
            <input type="text" class="title-input" value="${list.name}" onchange="updateListProperty('name', this.value)">
        </div>

        <div class="options-grid">
            <div class="option-card ${list.options.caseSensitive ? 'active' : ''}" onclick="toggleListOption('caseSensitive')">
                <span>Aa</span> Match Case
            </div>
            <div class="option-card ${list.options.wholeWord ? 'active' : ''}" onclick="toggleListOption('wholeWord')">
                <span>Abc</span> Whole Word
            </div>
            <div class="option-card ${list.options.isRegex ? 'active' : ''}" onclick="toggleListOption('isRegex')">
                <span>.*</span> Regex
            </div>
        </div>

        <div class="input-group">
            <label class="label">Color Style</label>
            <div class="color-picker-row">
                ${PRESETS.map(p => `
                    <button class="color-btn" style="background-color: ${p.bg}; color: ${p.text}; border: ${list.styles.backgroundColor === p.bg ? '2px solid white' : 'none'}" 
                    onclick="updateListStyle('${p.bg}', '${p.text}')">Aa</button>
                `).join('')}
                <input type="color" value="${list.styles.backgroundColor}" onchange="updateListStyle(this.value, '#ffffff')" style="visibility: hidden; width: 0;">
            </div>
        </div>

        <div class="input-group">
             <div class="flex justify-between items-center mb-2">
                <label class="label" style="margin:0">Patterns</label>
                <button id="btn-smart-fill" class="btn-icon" style="font-size: 10px; color: var(--primary); font-weight: bold; width: auto;">
                    ${state.isExtracting ? '...' : '✨ Smart Fill'}
                </button>
             </div>
            <form id="add-word-form" class="word-input-container">
                <input type="text" id="new-word-input" class="word-input" placeholder="Add word or regex...">
                <button type="submit" class="btn btn-secondary">Add</button>
            </form>
            <div class="tag-container">
                ${list.words.map(w => `
                    <span class="tag" style="color: ${list.styles.backgroundColor}; border-color: ${list.styles.backgroundColor}40; background-color: ${list.styles.backgroundColor}20;">
                        ${w} <span style="cursor: pointer; margin-left: 4px;" onclick="removeWord('${w}')">${ICONS.x}</span>
                    </span>
                `).join('')}
            </div>
        </div>
    </div>`;
}

function renderPreview() {
    const sampleText = `Hello! Highlight Pro AI is now active.
Discover ✨ Smart Suggestions in the editor.
Native JS makes this fast and CSP compliant!`;
    
    // Simulate highlighting logic for preview
    let html = sampleText;
    // Note: A full highlighter implementation for preview text in HTML is complex to do via Regex replace alone without breaking HTML tags,
    // but for this simple plain-text preview, we can iterate.
    // Ideally, we reuse the logic from content.js, but simplified here for the popup UI.
    
    // Simple render (no highlighting in preview for brevity in Vanilla version to avoid complex DOM node logic duplication)
    // You can copy the logic from content.js if you want the preview to light up real-time.
    
    return `
    <div class="preview-area">
        <div class="flex items-center gap-2" style="font-size: 0.625rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">
            ${ICONS.eye} Preview
        </div>
        <div class="preview-box">${html}</div>
    </div>`;
}

// --- Actions ---

function attachEvents() {
    // Navigation
    const backBtn = document.getElementById('nav-back');
    if (backBtn) backBtn.onclick = () => { state.activeView = 'dashboard'; render(); };

    const createBtn = document.getElementById('btn-create');
    if (createBtn) createBtn.onclick = createList;

    const aiBtn = document.getElementById('btn-ai');
    if (aiBtn) aiBtn.onclick = handleAiExtract;

    const smartFillBtn = document.getElementById('btn-smart-fill');
    if (smartFillBtn) smartFillBtn.onclick = handleSmartFill;

    // Form
    const form = document.getElementById('add-word-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const input = document.getElementById('new-word-input');
            const val = input.value.trim();
            if (val) {
                const list = state.lists.find(l => l.id === state.editingListId);
                if (list) {
                    list.words.push(val);
                    input.value = '';
                    save();
                }
            }
        };
    }
}

function createList() {
    const newList = {
        id: crypto.randomUUID(),
        name: 'New List',
        words: [],
        styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
        enabled: true,
        options: { caseSensitive: false, wholeWord: true, isRegex: false }
    };
    state.lists.push(newList);
    state.editingListId = newList.id;
    state.activeView = 'editor';
    save();
}

function handleAiExtract() {
    state.isExtracting = true;
    render();
    callGemini("Analyze common web patterns and suggest 5 high-value technical keywords. Return ONLY a comma-separated list.").then(text => {
        state.isExtracting = false;
        if (text) {
            const words = text.split(',').map(w => w.trim()).filter(w => w);
            state.lists.push({
                id: crypto.randomUUID(),
                name: '✨ AI Suggested',
                words: words,
                styles: { backgroundColor: '#8b5cf6', color: '#ffffff' },
                enabled: true,
                options: { caseSensitive: false, wholeWord: true, isRegex: false }
            });
            save();
        } else {
            render();
        }
    });
}

function handleSmartFill() {
    const list = state.lists.find(l => l.id === state.editingListId);
    if (!list) return;
    
    state.isExtracting = true;
    render();
    const prompt = `Based on the list title "${list.name}" and existing words [${list.words.join(', ')}], suggest 5 more relevant words. Return ONLY comma-separated list.`;
    
    callGemini(prompt).then(text => {
        state.isExtracting = false;
        if (text) {
            const words = text.split(',').map(w => w.trim()).filter(w => w);
            list.words = [...new Set([...list.words, ...words])];
            save();
        } else {
            render();
        }
    });
}

// Exposed globally for HTML onclick attributes
window.editList = (id) => { state.editingListId = id; state.activeView = 'editor'; render(); };
window.deleteList = (id) => { state.lists = state.lists.filter(l => l.id !== id); save(); };
window.toggleList = (id) => { const l = state.lists.find(x => x.id === id); if(l) { l.enabled = !l.enabled; save(); } };
window.updateListProperty = (key, val) => { const l = state.lists.find(x => x.id === state.editingListId); if(l) { l[key] = val; save(); } };
window.updateListStyle = (bg, txt) => { const l = state.lists.find(x => x.id === state.editingListId); if(l) { l.styles = { backgroundColor: bg, color: txt }; save(); } };
window.toggleListOption = (key) => { const l = state.lists.find(x => x.id === state.editingListId); if(l) { l.options[key] = !l.options[key]; save(); } };
window.removeWord = (w) => { const l = state.lists.find(x => x.id === state.editingListId); if(l) { l.words = l.words.filter(word => word !== w); save(); } };

// Initialize
document.addEventListener('DOMContentLoaded', init);