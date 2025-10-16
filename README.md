# ChatGPT Remove Feedback

This browser extension targets the ChatGPT web experience and removes the thumbs up/down feedback controls shown beneath each assistant response.

## How it works

- The content script runs on `https://chat.openai.com/*` and `https://chatgpt.com/*`.
- It looks for buttons matching ChatGPT's feedback actions (aria-labels `Good response` and `Bad response`, plus their `data-testid` equivalents).
- Matching controls are removed from the page, and empty containers that previously held them are cleaned up so the feedback UI disappears entirely.

## Install (Chrome / Edge)

1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this project folder.
4. Visit ChatGPT and the feedback buttons beneath each turn will be disabled automatically.

## Install (Firefox)

Firefox also supports Manifest V3. Visit `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on…**, then pick `manifest.json`. Keep the tab open while testing; Firefox removes temporary add-ons when it restarts.

## Contributing

Open a tiny pull request that keeps the code obvious and the buttons gone. I’ll merge fast if it stays sharp and easy to reason about.
