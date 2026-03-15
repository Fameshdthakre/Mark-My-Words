/**
 * Content Script: content.js
 * V4 Update: Uses chrome.storage.sync and new Settings logic
 * Optimized for performance: Cached config, batched DOM updates, minimal layout thrashing.
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

// --- Initialization ---

function init() {
    // Initial Load
    refreshConfig();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes[STORAGE_KEY]) {
            refreshConfig();
        }
    });

    // Listen for runtime messages (e.g. from popup)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "refresh_highlights") {
            refreshConfig();
        } else if (request.action === "get_summary") {
            sendResponse({ data: generateSummaryData() });
        } else if (request.action === "scroll_to_mark") {
            const marks = document.querySelectorAll('mark.highlight-pro-ext');
            const target = marks[request.index];
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Flash effect
                const originalBg = target.style.backgroundColor;
                target.style.transition = 'background-color 0.3s';
                target.style.backgroundColor = 'white';
                setTimeout(() => { target.style.backgroundColor = originalBg; }, 500);
            }
        }
    });
}

function generateSummaryData() {
    const marks = document.querySelectorAll('mark.highlight-pro-ext');
    const data = [];

    marks.forEach((mark, index) => {
        // Extract 40 chars of surrounding context
        let contextText = "";
        let parent = mark.parentElement;
        if (parent) {
            // Get full text of parent paragraph/div, limit to 80 chars around match
            let fullText = parent.textContent.replace(/\s+/g, ' ').trim();
            let matchIndex = fullText.indexOf(mark.textContent.trim());
            if (matchIndex === -1) matchIndex = 0; // fallback

            let start = Math.max(0, matchIndex - 40);
            let end = Math.min(fullText.length, matchIndex + mark.textContent.length + 40);
            contextText = fullText.substring(start, end);
        } else {
            contextText = mark.textContent;
        }

        data.push({
            index: index,
            text: mark.textContent,
            context: contextText,
            bgColor: mark.style.backgroundColor,
            color: mark.style.color
        });
    });

    return data;
}

function refreshConfig() {
    if (!chrome.runtime?.id) return; // Extension context invalidated

    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) return;
        
        const config = result[STORAGE_KEY];
        if (!config) return;

        // Compile regexes once per config change
        const compiledLists = compileLists(config);
        
        cachedState = {
            config: config,
            compiledLists: compiledLists,
            isActive: compiledLists.length > 0 && config.settings?.globalEnabled !== false
        };

        // Apply immediately
        applyHighlights();
        
        // Setup Observer if active
        if (cachedState.isActive) {
            if (!observer) {
                observer = new MutationObserver(debounce(applyHighlights, 100));
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

        // Handle auto-trigger interval
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
                    if (document.visibilityState === 'visible') {
                        applyHighlights();
                    }
                }, intervalMs);
            }
        }
    });
}

function compileLists(config) {
    if (!config.lists) return [];
    
    // Check Global Settings
    if (config.settings?.globalEnabled === false) return [];

    // Check Excluded Domains
    if (config.settings?.excludedDomains) {
        const currentDomain = window.location.hostname;
        const isExcluded = config.settings.excludedDomains.some(domain => 
            currentDomain.includes(domain)
        );
        if (isExcluded) return [];
    }

    return config.lists
        .filter(l => {
            if (!l.enabled) return false;
            // Check List-specific Allowed Domains
            if (l.allowedDomains && l.allowedDomains.length > 0) {
                const currentDomain = window.location.hostname;
                const isAllowed = l.allowedDomains.some(domain => currentDomain.includes(domain));
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
                    patternSource = `(${valid.join('|')})`;
                } else {
                    if (list.words.length === 0) return null;
                    const escaped = list.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
                    patternSource = list.options.wholeWord ? `\\b(${escaped})\\b` : `(${escaped})`;
                }
                
                return {
                    regex: new RegExp(patternSource, list.options.caseSensitive ? 'g' : 'gi'),
                    styles: list.styles,
                    priority: index, // Lower index = Higher Priority (Top of list)
                    id: list.id,
                    targetSelectors: list.targetSelectors || [],
                    crossNode: list.options.crossNode || false
                };
            } catch (e) { return null; }
        })
        .filter(l => l !== null);
}

// --- Highlighting Logic ---

function applyHighlights() {
    if (!cachedState.isActive) return;
    if (!chrome.runtime?.id) return;

    // Performance Mode Check
    if (cachedState.config.settings?.performanceMode) {
        if (document.body.innerText.length > 50000) {
            console.log('Mark My Words: Performance mode active. Skipping large page.');
            return;
        }
    }

    // 1. Clean up existing highlights first
    // Note: We MUST do this before scanning text nodes, otherwise we miss text inside existing marks.
    // However, removeAllHighlights() causes a layout/paint.
    // To minimize shaking, we do it synchronously right before re-applying.
    removeAllHighlights();

    const textNodes = getTextNodes();
    if (textNodes.length === 0) return;

    let highlightCount = 0;

    // --- Phase 1: Cross-Node Matching ---
    const crossNodeLists = cachedState.compiledLists.filter(l => l.crossNode);
    let crossNodeMatchesByNode = new Map(); // Maps node -> Array of ranges

    if (crossNodeLists.length > 0) {
        let fullText = "";
        let nodeMap = []; // Array of {node, start, end}

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

                // Find intersecting nodes
                const intersectingNodes = nodeMap.filter(nm => nm.end > matchStart && nm.start < matchEnd);

                intersectingNodes.forEach(nm => {
                    // Check Target Selectors per Node
                    if (list.targetSelectors.length > 0) {
                        let allowed = false;
                        for (let sel of list.targetSelectors) {
                            if (nm.node.parentNode.closest(sel)) {
                                allowed = true;
                                break;
                            }
                        }
                        if (!allowed) return; // Skip this node for this match
                    }

                    const localStart = Math.max(0, matchStart - nm.start);
                    const localEnd = Math.min(nm.node.nodeValue.length, matchEnd - nm.start);

                    if (!crossNodeMatchesByNode.has(nm.node)) {
                        crossNodeMatchesByNode.set(nm.node, []);
                    }

                    crossNodeMatchesByNode.get(nm.node).push({
                        start: localStart,
                        end: localEnd,
                        length: localEnd - localStart,
                        style: list.styles,
                        priority: list.priority
                    });
                });
            }
        });
    }

    // --- Phase 2: Standard Matching & Application ---
    textNodes.forEach(node => {
        if (!node.nodeValue.trim()) return;
        
        const text = node.nodeValue;
        const textForMatching = text.replace(/\u00A0/g, ' ');
        let ranges = crossNodeMatchesByNode.get(node) || [];

        // Standard Single-Node Lists
        const standardLists = cachedState.compiledLists.filter(l => !l.crossNode);
        standardLists.forEach(list => {
            // Check Target Selectors per Node
            if (list.targetSelectors.length > 0) {
                let allowed = false;
                for (let sel of list.targetSelectors) {
                    if (node.parentNode.closest(sel)) {
                        allowed = true;
                        break;
                    }
                }
                if (!allowed) return;
            }

            for (const match of textForMatching.matchAll(list.regex)) {
                if (match[0].length === 0) continue;
                ranges.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    length: match[0].length,
                    style: list.styles,
                    priority: list.priority
                });
            }
        });

        if (ranges.length === 0) return;

        // Resolve Overlaps
        ranges.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            if (a.priority !== b.priority) return a.priority - b.priority;
            return b.length - a.length;
        });

        const finalRanges = [];
        let lastEnd = 0;
        
        ranges.forEach(r => {
            if (r.start >= lastEnd) {
                finalRanges.push(r);
                lastEnd = r.end;
                highlightCount++;
            }
        });

        // Apply Replacements
        if (finalRanges.length > 0 && node.parentNode) {
            const fragment = document.createDocumentFragment();
            let cursor = 0;

            finalRanges.forEach(range => {
                // Text before match
                if (range.start > cursor) {
                    fragment.appendChild(document.createTextNode(text.substring(cursor, range.start)));
                }

                // Match
                const span = document.createElement('mark');
                span.className = 'highlight-pro-ext';
                Object.assign(span.style, {
                    backgroundColor: range.style.backgroundColor,
                    color: range.style.color,
                    borderRadius: '4px',
                    padding: '0 2px',
                    boxShadow: `0 0 0 1px ${range.style.backgroundColor}40`,
                    fontInherit: 'true',
                    fontWeight: range.style.bold ? 'bold' : 'inherit',
                    fontStyle: range.style.italic ? 'italic' : 'inherit',
                    textDecoration: range.style.strikeThrough ? 'line-through' : 'inherit'
                });
                span.textContent = text.substring(range.start, range.end);
                
                fragment.appendChild(span);
                cursor = range.end;
            });

            // Remaining text
            if (cursor < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(cursor)));
            }

            node.parentNode.replaceChild(fragment, node);
        }
    });

    updateBadge(highlightCount);
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE']);

function getTextNodes() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (SKIP_TAGS.has(node.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.isContentEditable) return NodeFilter.FILTER_REJECT;
                    if (node.classList && node.classList.contains('highlight-pro-ext')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
        nodes.push(node);
    }
    return nodes;
}

function removeAllHighlights() {
    const marks = document.querySelectorAll('mark.highlight-pro-ext');
    if (marks.length === 0) return;

    const parents = new Set();
    marks.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parents.add(parent);
        }
    });
    
    // Normalize to merge text nodes (prevents fragmentation)
    parents.forEach(p => p.normalize());
}

function updateBadge(count) {
    if (!chrome.runtime?.id) return;
    try {
        chrome.runtime.sendMessage({
            action: "update_badge",
            count: count
        }, () => { if(chrome.runtime.lastError){ /* ignore */ } });
    } catch (e) { /* ignore */ }
}

// Helper: Debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
