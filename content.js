/**
 * Content Script: content.js
 * V4 Update: Uses chrome.storage.sync and new Settings logic
 */

const STORAGE_KEY = 'highlighter_config_v4';

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function applyHighlights() {
    if (!chrome.runtime?.id) {
        // Extension context invalidated
        if (observer) observer.disconnect();
        return;
    }

    try {
        chrome.storage.sync.get([STORAGE_KEY], (result) => {
            if (!chrome.runtime?.id) return; // Check context validity again inside callback
            if (chrome.runtime.lastError) return; // Handle potential error

            const config = result[STORAGE_KEY];
            if (!config) return;

            // 1. Check Global Enable
        if (config.settings && config.settings.globalEnabled === false) {
            removeAllHighlights();
            updateBadge(0);
            return;
        }

        // 2. Check Excluded Domains
        if (config.settings && config.settings.excludedDomains) {
            const currentDomain = window.location.hostname;
            const isExcluded = config.settings.excludedDomains.some(domain =>
                currentDomain.includes(domain)
            );
            if (isExcluded) {
                removeAllHighlights();
                updateBadge(0);
                return;
            }
        }

        // 3. Check Performance Mode
        if (config.settings && config.settings.performanceMode) {
            // Rough check for page size
            if (document.body.innerText.length > 50000) {
                console.log('Highlight Pro: Performance mode active. Skipping large page.');
                return;
            }
        }

        // Remove existing to re-apply
        removeAllHighlights();

        const lists = config.lists.filter(l => l.enabled);
        if (lists.length === 0) {
            updateBadge(0);
            return;
        }

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script, style, and already highlighted nodes
                    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'IFRAME'].includes(node.parentNode.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.parentNode.isContentEditable) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let currentNode;
        // Limit nodes in performance mode if needed, but we already skipped large pages
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }

        textNodes.forEach(node => {
            if (!node.nodeValue.trim()) return;

            let text = node.nodeValue;
            let rangesToHighlight = [];

            lists.forEach(list => {
                let patternSource;
                try {
                    if (list.options.isRegex) {
                        const valid = list.words.filter(w => {
                            try { new RegExp(w); return true; } catch { return false; }
                        });
                        if (valid.length === 0) return;
                        patternSource = `(${valid.join('|')})`;
                    } else {
                        if (list.words.length === 0) return;
                        const escaped = list.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                        patternSource = list.options.wholeWord ? `\\b(${escaped})\\b` : `(${escaped})`;
                    }

                    const regex = new RegExp(patternSource, list.options.caseSensitive ? 'g' : 'gi');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        rangesToHighlight.push({
                            start: match.index,
                            end: match.index + match[0].length,
                            style: list.styles
                        });
                    }
                } catch (e) { }
            });

            if (rangesToHighlight.length > 0) {
                const range = rangesToHighlight[0]; // Simple first-match win

                const span = document.createElement('mark');
                span.className = 'highlight-pro-ext';

                // Styles
                span.style.backgroundColor = range.style.backgroundColor;
                span.style.color = range.style.color;
                span.style.borderRadius = '4px';
                span.style.padding = '0 3px';
                span.style.margin = '0 1px';
                span.style.boxShadow = `0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px ${range.style.backgroundColor}40`;
                span.style.fontInherit = 'true';

                span.textContent = text.substring(range.start, range.end);

                const afterText = text.substring(range.end);
                const beforeText = text.substring(0, range.start);

                const parent = node.parentNode;
                if (beforeText) parent.insertBefore(document.createTextNode(beforeText), node);
                parent.insertBefore(span, node);
                if (afterText) parent.insertBefore(document.createTextNode(afterText), node);

                parent.removeChild(node);
            }
        });

            // Update Badge Count
            updateBadge(document.querySelectorAll('mark.highlight-pro-ext').length);
        });
    } catch (e) {
        console.log("Highlight Pro: Extension context invalidated.");
        if (observer) observer.disconnect();
    }
}

function removeAllHighlights() {
    document.querySelectorAll('mark.highlight-pro-ext').forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        }
    });
}

function updateBadge(count) {
    if (!chrome.runtime?.id) return;
    try {
        chrome.runtime.sendMessage({
            action: "update_badge",
            count: count
        }, () => { if(chrome.runtime.lastError){ /* ignore */ } });
    } catch (e) { /* context invalid */ }
}

// Listen for updates
try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "refresh_highlights") {
            applyHighlights();
        }
    });
} catch (e) { /* context invalid */ }

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHighlights);
} else {
    applyHighlights();
}

const observer = new MutationObserver(debounce(applyHighlights, 1500));
observer.observe(document.body, { childList: true, subtree: true });