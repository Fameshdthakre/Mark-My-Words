/**
 * Content Script: content.js
 * This script runs on the web pages you visit.
 * It reads the settings from Chrome Storage and highlights the text.
 */

// Debounce helper to prevent freezing on rapid updates
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
    chrome.storage.local.get(['highlighter_lists_v3'], (result) => {
        if (!result.highlighter_lists_v3) return;
        
        // Remove existing highlights to prevent duplication/mess
        document.querySelectorAll('mark.highlight-pro-ext').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize(); // Merge text nodes
        });

        const lists = result.highlighter_lists_v3.filter(l => l.enabled);
        if (lists.length === 0) return;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script, style, and already highlighted nodes
                    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(node.parentNode.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }

        // Apply highlighting (Simplified version of the React Preview logic)
        // Note: Direct DOM manipulation is safer than innerHTML replacement for arbitrary pages
        textNodes.forEach(node => {
            let text = node.nodeValue;
            let rangesToHighlight = [];

            lists.forEach(list => {
                let patternSource;
                
                try {
                    if (list.options.isRegex) {
                        const valid = list.words.filter(w => { try { new RegExp(w); return true; } catch { return false; } });
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
                } catch (e) {
                    // Invalid regex in user input, ignore
                }
            });

            // If we found matches in this text node
            if (rangesToHighlight.length > 0) {
                // Sort ranges and process
                // Note: Complex overlap handling is omitted for brevity, taking the first valid match strategy
                // For a production extension, use a library like 'mark.js'
                
                const range = rangesToHighlight[0]; // Simple implementation: take first match
                const span = document.createElement('mark');
                span.className = 'highlight-pro-ext';
                span.style.backgroundColor = range.style.backgroundColor;
                span.style.color = range.style.color;
                span.textContent = text.substring(range.start, range.end);
                span.style.borderRadius = '2px';
                span.style.padding = '0 2px';

                const afterText = text.substring(range.end);
                const beforeText = text.substring(0, range.start);

                const parent = node.parentNode;
                if (beforeText) parent.insertBefore(document.createTextNode(beforeText), node);
                parent.insertBefore(span, node);
                if (afterText) parent.insertBefore(document.createTextNode(afterText), node);
                
                parent.removeChild(node);
            }
        });
    });
}

// Listen for updates from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refresh_highlights") {
        applyHighlights();
    }
});

// Run on load
applyHighlights();

// Optional: Observe DOM changes (for dynamic content like infinite scroll)
const observer = new MutationObserver(debounce(applyHighlights, 1000));
observer.observe(document.body, { childList: true, subtree: true });