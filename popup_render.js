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


    // Header
    const headerHtml = `
    <header>
        <div class="flex items-center">
            <div class="logo-box">${ICONS.zap}</div>
            <div>
                <h1 class="app-title">Mark My Words <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: normal; margin-left: 4px;">v${state.version}</span></h1>
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
            Mark My Words v${state.version}<br>
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

