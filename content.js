/**
 * Content Script: content.js
 * V5 Update: Uses CSS Custom Highlight API, Interactive Tooltips, Analytics
 * Optimized for performance: Zero DOM mutation, Range-based highlighting.
 */

const STORAGE_KEY = 'highlighter_config_v4';

// --- State ---
let cachedState = {
    config: null,
    compiledLists: [],
    isActive: false
};

let observer = null;
let autoTriggerIntervalId = null;
let activeRangesMeta = [];

// --- Initialization ---

function init() {
    refreshConfig();

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes[STORAGE_KEY]) {
            refreshConfig();
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "refresh_highlights") {
            refreshConfig();
        } else if (request.action === "get_summary") {
            sendResponse({ data: generateSummaryData() });
        } else if (request.action === "get_page_rule_counts") {
            const counts = {};
            activeRangesMeta.forEach(meta => {
                counts[meta.id] = (counts[meta.id] || 0) + 1;
            });
            sendResponse({ counts: counts });
        } else if (request.action === "get_page_analytics") {
            const ruleUsage = {};
            activeRangesMeta.forEach(meta => {
                ruleUsage[meta.ruleName] = (ruleUsage[meta.ruleName] || 0) + 1;
            });
            sendResponse({ analytics: { totalHighlights: activeRangesMeta.length, ruleUsage: ruleUsage } });
        }
    });
}

function generateSummaryData() {
    const data = [];
    const textCounts = {};

    // First pass to count text occurrences
    activeRangesMeta.forEach(meta => {
        const markText = meta.range.toString();
        const key = markText.toLowerCase();
        textCounts[key] = (textCounts[key] || 0) + 1;
    });

    activeRangesMeta.forEach((meta, index) => {
        const node = meta.range.startContainer;
        let contextText = "";
        let fullElementText = "";
        let parent = node.parentElement;
        const markText = meta.range.toString();

        if (parent) {
            fullElementText = parent.textContent.replace(/\s+/g, ' ').trim();
            contextText = fullElementText;
        } else {
            contextText = markText;
            fullElementText = markText;
        }

        const list = cachedState.compiledLists.find(l => l.id === meta.id);
        const bgColor = list ? list.styles.backgroundColor : '#fff';
        const color = list ? list.styles.color : '#000';

        data.push({
            index: index,
            text: markText,
            context: contextText,
            bgColor: bgColor,
            color: color,
            ruleName: meta.ruleName || 'Unknown Rule',
            fullElementText: fullElementText,
            sameTextCount: textCounts[markText.toLowerCase()] || 1
        });
    });
    return data;
}

function refreshConfig() {
    if (!chrome.runtime?.id) return;

    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) return;

        const config = result[STORAGE_KEY];
        if (!config) return;

        const compiledLists = compileLists(config);

        cachedState = {
            config: config,
            compiledLists: compiledLists,
            isActive: compiledLists.length > 0 && config.settings?.globalEnabled !== false
        };

        applyHighlights();

        if (cachedState.isActive) {
            if (!observer) {
                observer = new MutationObserver(debounce(applyHighlights, 250));
                observer.observe(document.body, { childList: true, subtree: true });
            }
        } else {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            removeAllHighlights();
            updateBadge(0);
        }

        if (autoTriggerIntervalId) {
            clearInterval(autoTriggerIntervalId);
            autoTriggerIntervalId = null;
        }

        if (cachedState.isActive && config.settings?.autoTriggerInterval && config.settings.autoTriggerInterval !== 'Off') {
            let intervalMs = null;
            switch (config.settings.autoTriggerInterval) {
                case '15s': intervalMs = 15 * 1000; break;
                case '30s': intervalMs = 30 * 1000; break;
                case '45s': intervalMs = 45 * 1000; break;
                case '1m': intervalMs = 60 * 1000; break;
                case '5m': intervalMs = 5 * 60 * 1000; break;
                case '1h': intervalMs = 60 * 60 * 1000; break;
            }

            if (intervalMs) {
                autoTriggerIntervalId = setInterval(() => {
                    if (document.visibilityState === 'visible') applyHighlights();
                }, intervalMs);
            }
        }
    });
}

function compileLists(config) {
    if (!config.lists) return [];
    if (config.settings?.globalEnabled === false) return [];

    if (config.settings?.excludedDomains) {
        const currentDomain = window.location.hostname;
        const isExcluded = config.settings.excludedDomains.some(domain =>
            currentDomain === domain || currentDomain.endsWith('.' + domain)
        );
        if (isExcluded) return [];
    }

    return config.lists
        .filter(l => {
            if (!l.enabled) return false;
            if (l.allowedDomains && l.allowedDomains.length > 0) {
                const currentDomain = window.location.hostname;
                const isAllowed = l.allowedDomains.some(domain =>
                    currentDomain === domain || currentDomain.endsWith('.' + domain)
                );
                if (!isAllowed) return false;
            }
            return true;
        })
        .map((list, index) => {
            try {
                let patternSource;
                if (list.options.isRegex) {
                    const valid = list.words.filter(w => {
                        try { new RegExp(w); return true; } catch { return false; }
                    });
                    if (valid.length === 0) return null;
                    patternSource = '(' + valid.join('|') + ')';
                } else {
                    if (list.words.length === 0) return null;
                    const escaped = list.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
                    patternSource = list.options.wholeWord ? '\\b(' + escaped + ')\\b' : '(' + escaped + ')';
                }

                return {
                    regex: new RegExp(patternSource, list.options.caseSensitive ? 'g' : 'gi'),
                    styles: list.styles,
                    priority: index,
                    id: list.id,
                    name: list.name,
                    words: list.words,
                    note: list.note,
                    targetSelectors: list.targetSelectors || [],
                    crossNode: list.options.crossNode || false,
                    options: list.options
                };
            } catch (e) { return null; }
        })
        .filter(l => l !== null);
}

// --- Highlighting Logic ---

function applyHighlights() {
    if (!cachedState.isActive) return;
    if (!chrome.runtime?.id) return;

    if (cachedState.config.settings?.performanceMode) {
        if (document.body.innerText.length > 50000) {
            console.log('Mark My Words: Performance mode active. Skipping large page.');
            return;
        }
    }

    removeAllHighlights();

    const textNodes = getTextNodes();
    if (textNodes.length === 0) return;

    let highlightCount = 0;
    let ruleUsage = {};
    activeRangesMeta = [];

    const standardLists = cachedState.compiledLists;
    const rangesByList = new Map();

    // Utility to add range safely
    const addRange = (node, startOffset, endOffset, list) => {
        try {
            const range = new Range();
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);

            if (!rangesByList.has(list.id)) rangesByList.set(list.id, []);
            rangesByList.get(list.id).push(range);

            activeRangesMeta.push({ range: range, ruleName: list.name, note: list.note, id: list.id });
            highlightCount++;
            ruleUsage[list.name] = (ruleUsage[list.name] || 0) + 1;
        } catch (e) { /* ignore range errors */ }
    };

    // Phase 1: Cross-Node Matching
    const crossNodeLists = standardLists.filter(l => l.crossNode);
    if (crossNodeLists.length > 0) {
        let fullText = "";
        let nodeMap = [];
        textNodes.forEach(node => {
            const start = fullText.length;
            fullText += node.nodeValue;
            nodeMap.push({ node: node, start: start, end: fullText.length });
        });

        const fullTextForMatching = fullText.replace(/\u00A0/g, ' ');

        crossNodeLists.forEach(list => {
            for (const match of fullTextForMatching.matchAll(list.regex)) {
                if (match[0].length === 0) continue;
                const matchStart = match.index;
                const matchEnd = match.index + match[0].length;

                const intersectingNodes = nodeMap.filter(nm => nm.end > matchStart && nm.start < matchEnd);
                intersectingNodes.forEach(nm => {
                    if (list.targetSelectors.length > 0) {
                        let allowed = false;
                        for (let sel of list.targetSelectors) {
                            if (nm.node.parentNode.closest(sel)) { allowed = true; break; }
                        }
                        if (!allowed) return;
                    }

                    const localStart = Math.max(0, matchStart - nm.start);
                    const localEnd = Math.min(nm.node.nodeValue.length, matchEnd - nm.start);
                    addRange(nm.node, localStart, localEnd, list);
                });
            }
        });
    }

    // Phase 2: Standard Single-Node Matching
    const singleNodeLists = standardLists.filter(l => !l.crossNode);
    textNodes.forEach(node => {
        const text = node.nodeValue;
        const textForMatching = text.replace(/\u00A0/g, ' ');

        singleNodeLists.forEach(list => {
            if (list.targetSelectors.length > 0) {
                let allowed = false;
                for (let sel of list.targetSelectors) {
                    if (node.parentNode.closest(sel)) { allowed = true; break; }
                }
                if (!allowed) return;
            }

            for (const match of textForMatching.matchAll(list.regex)) {
                if (match[0].length === 0) continue;
                addRange(node, match.index, match.index + match[0].length, list);
            }
        });
    });

    // Apply via CSS Custom Highlight API
    if ('highlights' in CSS) {
        injectHighlightStyles();
        rangesByList.forEach((ranges, listId) => {
            if (ranges.length === 0) return;
            const validRanges = ranges.filter(r => {
                try {
                    // Verify the range is still valid (nodes still in DOM)
                    r.getBoundingClientRect();
                    return true;
                } catch (e) {
                    return false;
                }
            });
            if (validRanges.length === 0) return;
            const highlight = new Highlight(...validRanges);
            
            // Higher priority = higher number. Top rules (index 0) get highest priority
            const listIndex = cachedState.compiledLists.findIndex(l => l.id === listId);
            if (listIndex !== -1) {
                highlight.priority = cachedState.compiledLists.length - listIndex;
            }
            
            CSS.highlights.set('mmw-' + listId, highlight);
        });
    }

    updateBadge(highlightCount);
    updateAnalytics(highlightCount, ruleUsage);
}

function injectHighlightStyles() {
    let styleTag = document.getElementById('mmw-dynamic-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'mmw-dynamic-styles';
        document.head.appendChild(styleTag);
    }

    let css = '';
    cachedState.compiledLists.forEach(list => {
        var strike = (list.styles && list.styles.strikeThrough) ? 'line-through' : 'none';
        var glow = (list.styles && list.styles.glow) ? `text-shadow: 0 0 8px ${list.styles.backgroundColor}, 0 0 12px ${list.styles.backgroundColor} !important;` : '';
        css += '::highlight(mmw-' + list.id + ') {\n';
        css += '  background-color: ' + list.styles.backgroundColor + ' !important;\n';
        css += '  color: ' + list.styles.color + ' !important;\n';
        css += '  text-decoration: ' + strike + ' !important;\n';
        if (glow) css += '  ' + glow + '\n';
        css += '}\n';
    });
    styleTag.textContent = css;
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE', 'SELECT', 'OPTION', 'CANVAS', 'SVG', 'AUDIO', 'VIDEO']);

function getTextNodes() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
                    if (node.isContentEditable) return NodeFilter.FILTER_REJECT;
                    if (node.id === 'mmw-tooltip') return NodeFilter.FILTER_REJECT;

                    if (node.checkVisibility && !node.checkVisibility({checkOpacity: true, checkVisibilityCSS: true})) {
                        if (node.tagName !== 'A' && node.tagName !== 'LABEL') {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    return NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
}

function removeAllHighlights() {
    if ('highlights' in CSS) {
        CSS.highlights.clear();
    }
    activeRangesMeta = [];
    const tooltip = document.getElementById('mmw-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function updateBadge(count) {
    if (!chrome.runtime?.id) return;
    try {
        chrome.runtime.sendMessage({ action: "update_badge", count: count }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
        });
    } catch (e) { /* ignore */ }
}

function updateAnalytics(count, ruleUsage) {
    if (count === 0) return;
    chrome.storage.local.get(['highlight_analytics'], (result) => {
        let analytics = result.highlight_analytics || { totalHighlights: 0, ruleUsage: {} };
        analytics.totalHighlights += count;

        Object.entries(ruleUsage).forEach(([rule, ruleCount]) => {
            analytics.ruleUsage[rule] = (analytics.ruleUsage[rule] || 0) + ruleCount;
        });

        chrome.storage.local.set({ highlight_analytics: analytics });
    });
}



function escapeHtml(text) {
    if (!text) return text;
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
