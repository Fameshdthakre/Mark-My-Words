from playwright.sync_api import sync_playwright
import os
import json

ROOT_DIR = os.getcwd()
POPUP_HTML = f"file://{ROOT_DIR}/popup.html"
TEST_CONTENT_HTML = f"file://{ROOT_DIR}/verification/test_page.html"

# Mock chrome API to simulate extension environment
MOCK_CHROME_SCRIPT = """
window.chrome = {
    storage: {
        onChanged: {
            listeners: [],
            addListener: (l) => window.chrome.storage.onChanged.listeners.push(l)
        },
        sync: {
            get: (keys, cb) => {
                const data = JSON.parse(localStorage.getItem('chrome_storage_sync') || '{}');
                // Simulate async
                setTimeout(() => cb(data), 10);
            },
            set: (items, cb) => {
                const data = JSON.parse(localStorage.getItem('chrome_storage_sync') || '{}');
                Object.assign(data, items);
                localStorage.setItem('chrome_storage_sync', JSON.stringify(data));
                if(cb) setTimeout(cb, 10);

                // Trigger onChanged listeners
                if(window.chrome.storage.onChanged.listeners) {
                    window.chrome.storage.onChanged.listeners.forEach(l => l(items, 'sync'));
                }
            }
        },
        local: {
            get: (keys, cb) => cb({})
        }
    },
    runtime: {
        id: 'mock-extension-id',
        lastError: null,
        sendMessage: (msg, cb) => { if(cb) setTimeout(cb, 10); },
        onMessage: {
            listeners: [],
            addListener: (l) => window.chrome.runtime.onMessage.listeners.push(l)
        }
    },
    tabs: {
        query: (q, cb) => cb([{id: 1}]),
        sendMessage: (id, msg, cb) => { if(cb) setTimeout(cb, 10); }
    },
    contextMenus: {
        create: () => {},
        removeAll: (cb) => { if(cb) cb(); },
        onClicked: { addListener: () => {} }
    },
    action: {
        setBadgeText: () => {},
        setBadgeBackgroundColor: () => {}
    }
};
"""

def test_popup(page):
    print("Testing Popup...")
    # Setup Storage Data
    initial_data = {
        "highlighter_config_v4": {
            "lists": [{
                "id": "list-1",
                "name": "Test List",
                "words": ["highlight", "test"],
                "styles": {"backgroundColor": "#ff0000", "color": "#ffffff"},
                "enabled": True,
                "options": {"caseSensitive": False, "wholeWord": True, "isRegex": False}
            }],
            "settings": {"globalEnabled": True, "excludedDomains": [], "performanceMode": False}
        }
    }

    page.add_init_script(MOCK_CHROME_SCRIPT)
    page.add_init_script(f"localStorage.setItem('chrome_storage_sync', '{json.dumps(initial_data)}');")

    page.goto(POPUP_HTML)
    try:
        page.wait_for_selector(".list-item", timeout=2000)
    except:
        print("Popup failed to render list items. Check console errors.")

    # Check if list is rendered
    if page.get_by_text("Test List").is_visible():
        print("PASS: Test List is visible.")
    else:
        print("FAIL: Test List not visible.")

    # Interact: Click to edit
    page.click(".list-item")
    page.wait_for_selector(".editor-view")

    # Add a word
    page.fill("#new-word-input", "newword")
    page.click("#btn-add-word")

    # Verify word added
    if page.get_by_text("newword").is_visible():
        print("PASS: Word added successfully.")
    else:
        print("FAIL: Word not added.")

    # Take screenshot of popup
    page.screenshot(path="verification/popup_screenshot.png")
    print("Popup screenshot saved.")

def test_content_script(page):
    print("Testing Content Script...")
    # Create test page content
    content_html = """
    <html><body>
        <h1>Test Page</h1>
        <p>This is a highlight test page.</p>
        <p>We are testing the highlighting feature.</p>
    </body></html>
    """
    with open("verification/test_page.html", "w") as f:
        f.write(content_html)

    # Setup Storage Data for Content Script
    initial_data = {
        "highlighter_config_v4": {
            "lists": [{
                "id": "list-1",
                "name": "Test List",
                "words": ["highlight", "testing"],
                "styles": {"backgroundColor": "#00ff00", "color": "#000000"},
                "enabled": True,
                "options": {"caseSensitive": False, "wholeWord": True, "isRegex": False}
            }],
            "settings": {"globalEnabled": True}
        }
    }

    page.add_init_script(MOCK_CHROME_SCRIPT)
    page.add_init_script(f"localStorage.setItem('chrome_storage_sync', '{json.dumps(initial_data)}');")

    page.goto(TEST_CONTENT_HTML)

    # Inject content.js
    with open("content.js", "r") as f:
        content_js = f.read()

    # Evaluate content.js
    page.evaluate(content_js)

    # Wait for highlights to appear (debounced/async)
    try:
        page.wait_for_selector("mark.highlight-pro-ext", timeout=3000)

        # Check highlighting
        marks = page.locator("mark.highlight-pro-ext")
        count = marks.count()
        print(f"Found {count} highlights.")

        if count >= 2:
            print("PASS: Highlights applied.")
        else:
            print(f"FAIL: Expected at least 2 highlights, found {count}.")

    except Exception as e:
        print(f"FAIL: Highlights did not appear. Error: {e}")

    # Take screenshot of content
    page.screenshot(path="verification/content_screenshot.png")
    print("Content screenshot saved.")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        test_popup(page)
        test_content_script(page)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
