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
