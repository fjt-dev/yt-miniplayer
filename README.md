# yt-tools

[日本語](./README.ja.md)

Chrome extension that restores the YouTube miniplayer button and optionally blocks Shorts and YouTube minigames.

[Privacy policy](./PRIVACY.md)

## Features

- Automatically adds a miniplayer button to YouTube's video control bar
- Hides Shorts shelves, navigation links, and Shorts in search results and recommendations
- Opens Shorts in the standard YouTube player while preserving playlist position
- Hides YouTube Playables links and redirects minigame pages to the home page
- Controls each feature independently from the extension popup
- Uses a clear light-themed popup in English or Japanese, following Chrome's display language
- Restores hidden items immediately when a blocker is turned off
- No data collection or tracking

> [!WARNING]
> Shorts and minigame blocking are disabled by default. Enable only the features you want.

## Screenshots

### Before

![Control bar without the Miniplayer button](./screenshots/before_1.png)
![](./screenshots/before_2.png)

### After

![Control bar with the Miniplayer button](./screenshots/after_1.png)
![](./screenshots/after_2.png)

## Installation

1. Clone or download this repository

```bash
   git clone https://github.com/fjt-dev/yt-tools
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. The extension is now active on youtube.com

## Support

Open an issue on GitHub for bugs or suggestions.

## Chrome Web Store package

Run `./scripts/package.sh` to create a submission-ready ZIP in `dist/`. The ZIP contains only runtime files, with `manifest.json` at its root. Store listing copy, permission justifications, and submission notes are in [`docs/CHROME_WEB_STORE.md`](./docs/CHROME_WEB_STORE.md).

---

**Note**: This extension is not affiliated with or endorsed by YouTube or Google, Inc.
