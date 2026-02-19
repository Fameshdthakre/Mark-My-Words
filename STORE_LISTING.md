# Chrome Web Store Listing Details

## Description

**Mark My Words: The Ultimate Smart Text Highlighter for Chrome**

Transform your browsing experience with Mark My Words, the modern, privacy-focused extension that automatically highlights important keywords and phrases across the web. Whether you're researching, studying, or monitoring data, Mark My Words ensures you never miss a critical detail.

**⚡ Key Features:**

*   **Smart & Automatic Highlighting:** Define your rules once, and let Mark My Words scan every page you visit.
*   **Electric Indigo Theme:** A beautiful, modern interface designed with Glassmorphism for a premium look and feel.
*   **Powerful Matching:** Supports simple keywords, case-sensitive matching, whole words, and advanced **Regular Expressions (Regex)**.
*   **Context Menu Integration:** Simply select text, right-click, and add it to any of your highlight lists instantly.
*   **Smart Paste:** Add dozens of keywords at once! Just paste a list of words, and Highlight Pro handles the rest, automatically removing duplicates.
*   **Sync Across Devices:** Your rules are safely synchronized to your Google account, so your setup travels with you.
*   **Performance Mode:** Smartly disables processing on massive pages to keep your browser fast.
*   **Privacy First:** No tracking, no external servers. Your data stays yours.

**🎨 Customization:**
*   Create unlimited color-coded lists.
*   Pick any custom color for backgrounds and text.
*   Toggle lists on/off individually or globally.

**🛠️ Advanced Tools:**
*   Drag-and-drop rule reordering.
*   Search and filter your rules instantly.
*   Import/Export your configuration for backups.
*   Real-time regex validation.

---

## Privacy Tab Justification (Permissions)

**Permission:** `storage`
**Justification:** "Required to store the user's custom highlight rules, color preferences, and application settings locally. This allows the extension to remember the user's configuration across browser sessions and sync it between their devices."

**Permission:** `activeTab`
**Justification:** "Required to interact with the currently active tab when the user clicks the extension icon or uses a context menu action, ensuring immediate feedback (like adding a keyword) is reflected on the current page."

**Permission:** `contextMenus`
**Justification:** "Required to add the 'Add to Highlight List' option to the browser's right-click context menu. This allows users to simply select text on a webpage and add it to their highlight rules without opening the extension popup."

**Host Permission:** `http://*/*`, `https://*/*` (or `<all_urls>`)
**Justification:** "The core functionality of 'Mark My Words' is to **automatically highlight** specific keywords defined by the user on **any webpage** they visit. Without access to read the content of all pages, the extension cannot scan for these keywords or apply the highlight styles automatically as the user browses."

---

## Data Usage Disclosure

*   **Does this extension collect user data?** No.
*   **Does this extension transmit user data?** No.
*   **Storage:** User settings and keywords are stored in `chrome.storage.sync` (Google's encrypted cloud storage for extensions) and `chrome.storage.local`. No data is sent to third-party servers.
