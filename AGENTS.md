# Highlight Pro - Developer Guide & Agent Instructions

This document outlines the architecture, coding patterns, and guidelines for maintaining and extending the "Highlight Pro" Chrome Extension (Manifest V3).

## 1. Project Overview

**Highlight Pro** is a modern text highlighting extension that allows users to create custom highlight rules (color-coded lists of keywords or regex patterns) and apply them across web pages.

### Key Characteristics
*   **Theme:** "Electric Indigo" (`#6d28d9` primary) with **Glassmorphism** effects (blur, translucency, neon accents).
*   **Framework:** Vanilla JavaScript (ES6+), HTML, and CSS. No build step required.
*   **Manifest:** V3 compliant.
*   **Storage:** `chrome.storage.sync` for cross-device synchronization.

## 2. Core Architecture

### popup.js (UI Controller)
*   **Responsibility:** Manages the extension popup interface (Dashboard, Editor, Settings).
*   **State Management:** Uses a central `state` object and re-renders the entire view on state changes (`render()`).
*   **Event Handling:** Uses `addEventListener` exclusively. **Inline event handlers (e.g., `onclick="..."`) are strictly prohibited** due to CSP.
*   **Key Features:**
    *   **Smart Paste:** Handles multi-line input in the keyword field, automatically splitting by newlines and filtering duplicates (respecting case-sensitivity).
    *   **Drag-and-Drop:** Implements HTML5 Drag and Drop API for reordering lists.
    *   **Search:** Filters lists by name or keyword content.
    *   **Regex Validation:** Real-time validation of regex patterns in the input field.

### content.js (Highlighter Engine)
*   **Responsibility:** Scans the DOM and wraps matching text nodes in `<mark>` elements.
*   **Performance:**
    *   Uses `TreeWalker` for efficient text node traversal.
    *   Implements `debounce` for `MutationObserver` to handle dynamic content updates without freezing the browser.
    *   **Performance Mode:** Skips processing on very large pages (>50k characters) if enabled in settings.
*   **Error Handling:** Checks for `chrome.runtime.id` before executing async operations to handle "Extension context invalidated" errors gracefully (e.g., after an update).

### background.js (Service Worker)
*   **Responsibility:** Manages persistent background tasks.
*   **Context Menus:** Dynamically rebuilds `chrome.contextMenus` whenever storage changes (`chrome.storage.onChanged`) to reflect active lists.
*   **Badge:** Updates the extension icon badge with the number of matches found on the active tab.

## 3. Storage Strategy

*   **Primary Storage:** `chrome.storage.sync`.
*   **Key:** `highlighter_config_v4`.
*   **Migration:** Logic exists in `popup.js` (`init()`) to migrate legacy `highlighter_lists_v3` from `chrome.storage.local` if no sync data is found.
*   **Quotas:** The UI displays a warning banner if storage usage exceeds 90% of `chrome.storage.sync.QUOTA_BYTES` (approx 100KB).

## 4. UI/UX Guidelines

*   **Glassmorphism:** Use `backdrop-filter: blur(12px)` and semi-transparent backgrounds (`rgba(255, 255, 255, 0.03)`) for panels and cards.
*   **Colors:**
    *   Primary: `#6d28d9` (Violet 700) -> `#8b5cf6` (Violet 500).
    *   Background: Deep Slate (`#020617`).
    *   Text: White/Off-white for readability.
*   **Interactions:** All inputs should provide immediate visual feedback (e.g., focus states, invalid red borders).

## 5. Coding Standards & Patterns

### Event Delegation
Attach listeners to container elements where possible, especially for dynamic lists.
```javascript
listContainer.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    // ... handle action
});
```

### Context Safety
Always wrap Chrome API calls in `content.js` with validity checks:
```javascript
if (!chrome.runtime?.id) {
    if (observer) observer.disconnect();
    return;
}
```

### No Inline Scripts
Never use:
```html
<button onclick="handleClick()">Click Me</button> <!-- FORBIDDEN -->
```
Always use:
```javascript
document.getElementById('btn').addEventListener('click', handleClick);
```

## 6. Testing Strategy

*   **Tooling:** Playwright (Python).
*   **Approach:**
    *   Create standalone HTML reproduction files (mocks) in `verification/` to isolate logic (e.g., regex validation, storage limits).
    *   Use Playwright scripts to interact with these mocks or the extension in a headless browser context.
    *   Verify both functional logic (state updates) and UI states (element visibility, text content).

## 7. Known Edge Cases

*   **Dynamic Content:** The `MutationObserver` handles most dynamic content, but a manual "Re-scan Page" button is provided in the dashboard for edge cases.
*   **Large Pages:** Performance mode is a rough heuristic; extremely complex DOMs might still cause stuttering during the initial highlight pass.
*   **Focus Loss:** When editing rule names, updates are synced to local state on `input` but only persisted to storage on `change` (blur) to prevent input focus loss due to re-renders.
