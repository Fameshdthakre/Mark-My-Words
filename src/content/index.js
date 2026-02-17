
let lists = [];
let extensionEnabled = true;
let observer = null;

// Initial load
(async () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const result = await chrome.storage.local.get(['highlighter_lists_v3', 'extension_enabled']);
    lists = result.highlighter_lists_v3 || [];
    extensionEnabled = result.extension_enabled !== false; // Default true (undefined means true)

    if (extensionEnabled) {
      scanAndHighlight(document.body);
      setupObserver();
    }

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        let needsUpdate = false;
        if (changes.highlighter_lists_v3) {
          lists = changes.highlighter_lists_v3.newValue || [];
          needsUpdate = true;
        }
        if (changes.extension_enabled) {
          extensionEnabled = changes.extension_enabled.newValue;
          needsUpdate = true;
        }

        if (needsUpdate) {
          removeHighlights();
          if (extensionEnabled) {
            scanAndHighlight(document.body);
            setupObserver();
          } else {
            if (observer) observer.disconnect();
          }
        }
      }
    });
  }
})();

function setupObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
        if (!extensionEnabled) return;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if it's our own highlight span to avoid recursion
                    if (node.dataset?.highlightPro) return;
                    scanAndHighlight(node);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    // Check parent
                    if (node.parentNode?.dataset?.highlightPro) return;
                    processTextNode(node);
                }
            });
        });
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

function removeHighlights() {
  const highlights = document.querySelectorAll('span[data-highlight-pro="true"]');
  highlights.forEach(span => {
    const parent = span.parentNode;
    if (parent) {
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
    }
  });
}

function scanAndHighlight(root) {
  if (!extensionEnabled || !lists.length || !root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script, style, and my own highlights
        const parentName = node.parentNode.nodeName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(parentName)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.parentNode.isContentEditable) return NodeFilter.FILTER_REJECT;
        if (node.parentNode.dataset.highlightPro) return NodeFilter.FILTER_REJECT; // Already highlighted

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(processTextNode);
}

function processTextNode(textNode) {
  const text = textNode.textContent;
  if (!text.trim()) return;

  // Re-use logic from PreviewArea
  // Fragments: { text, style }
  let fragments = [{ text: text, style: null }];

  lists.filter(l => l.enabled).forEach(list => {
      const nextFragments = [];
      fragments.forEach(frag => {
        if (frag.style) { nextFragments.push(frag); return; }

        let patternSource;
        if (list.options.isRegex) {
            const valid = list.words.filter(w => { try { new RegExp(w); return true; } catch { return false; } });
            if (valid.length === 0) { nextFragments.push(frag); return; }
            patternSource = `(${valid.join('|')})`;
        } else {
            if (list.words.length === 0) { nextFragments.push(frag); return; }
            const escaped = list.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            patternSource = list.options.wholeWord ? `\\b(${escaped})\\b` : `(${escaped})`;
        }

        try {
            const regex = new RegExp(patternSource, list.options.caseSensitive ? 'g' : 'gi');
            const splitParts = frag.text.split(regex);

            for (let i = 0; i < splitParts.length; i++) {
                const part = splitParts[i];
                // Check if this part matches the pattern
                const isMatch = list.options.isRegex
                    ? new RegExp(`^${patternSource}$`, list.options.caseSensitive ? '' : 'i').test(part)
                    : list.words.some(w => list.options.caseSensitive ? w === part : w?.toLowerCase() === part?.toLowerCase());

                if (isMatch && part !== undefined && part !== "") {
                    nextFragments.push({ text: part, style: list.styles });
                } else if (part !== undefined && part !== "") {
                    nextFragments.push({ text: part, style: null });
                }
            }
        } catch (e) {
            // Invalid regex or other error, skip this list
            nextFragments.push(frag);
        }
      });
      fragments = nextFragments;
  });

  // If no highlights, do nothing
  if (fragments.every(f => !f.style)) return;

  // Replace textNode with fragments
  const docFragment = document.createDocumentFragment();
  fragments.forEach(f => {
    if (f.style) {
      const span = document.createElement('span');
      span.textContent = f.text;
      Object.assign(span.style, f.style);
      span.dataset.highlightPro = "true";
      docFragment.appendChild(span);
    } else {
      docFragment.appendChild(document.createTextNode(f.text));
    }
  });

  if (textNode.parentNode) {
      textNode.parentNode.replaceChild(docFragment, textNode);
  }
}
