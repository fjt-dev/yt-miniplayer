# Chrome Web Store submission notes

This file contains copy-ready text and a release checklist for version 2.2.0. Keep all statements synchronized with the extension's actual behavior.

## Package

Run:

```sh
./scripts/package.sh
```

Upload `dist/yt-tools-2.2.0.zip`. The archive deliberately excludes repository-only files such as `.git`, documentation, source screenshots, the icon preview, and packaging scripts. Its root contains `manifest.json` and all files referenced by it, including the English and Japanese locale files.

## Store listing — Japanese

### Name

yt-tools

### Summary

YouTubeにミニプレイヤーボタンを追加し、ShortsとPlayablesを必要に応じて非表示・ブロックします。

### Detailed description

yt-tools は、YouTube の視聴画面をすっきり使いやすくする Chrome 拡張機能です。

主な機能:

- 動画コントロールバーにミニプレイヤーボタンを追加
- Shorts の棚、ナビゲーション項目、検索結果、関連動画を非表示
- Shorts のURLを通常の動画プレーヤーへリダイレクト
- YouTube Playables の入口を非表示にし、ページへのアクセスをブロック
- 各機能をポップアップから個別にオン／オフ

ミニプレイヤーボタンは初期状態で有効です。Shorts と Playables のブロックは初期状態で無効であり、必要な機能だけをユーザーが有効にできます。

設定は端末内にのみ保存されます。個人情報、閲覧履歴、ページ内容、利用状況データの収集・外部送信・共有は行いません。広告、解析、追跡も含みません。

本拡張機能は YouTube または Google の公式製品ではなく、両社による承認や提携を受けたものではありません。

## Store listing — English

### Name

yt-tools

### Summary

Add a miniplayer button to YouTube and optionally hide or block Shorts and Playables.

### Detailed description

yt-tools is a Chrome extension that makes the YouTube viewing interface cleaner and easier to use.

Features:

- Adds a miniplayer button to the video control bar
- Hides Shorts shelves, navigation entries, search results, and recommendations
- Redirects Shorts URLs to the standard video player
- Hides YouTube Playables entries and blocks Playables pages
- Lets you enable or disable every feature independently from the popup

The miniplayer button is enabled by default. Shorts and Playables blocking are disabled by default, so users choose which blockers to activate.

Settings are stored only on the user's device. The extension does not collect, transmit, or share personal information, browsing history, page content, or usage data. It contains no advertising, analytics, or tracking.

This extension is not affiliated with, endorsed by, or sponsored by YouTube or Google.

## Privacy practices tab

### Single purpose

Improve the YouTube viewing interface by adding user-controlled viewing tools that restore the miniplayer control and optionally remove Shorts and Playables distractions.

### Permission justifications

`storage`

Stores the user's three feature preferences locally so their selected miniplayer, Shorts blocker, and Playables blocker states persist. No stored value is transmitted.

`declarativeNetRequest`

Enables user-controlled static redirect rules. When the relevant blocker is enabled, Shorts URLs open in the standard YouTube player and Playables URLs return to the YouTube home page.

Host permission: `https://www.youtube.com/*`

Limits the extension to YouTube. It is required to add the miniplayer control, hide Shorts and Playables elements, redirect the relevant YouTube URLs, and notify open YouTube tabs when the user changes a setting. The extension cannot read or modify other sites.

Content script justification

Runs only on YouTube to add the miniplayer button and, when enabled by the user, identify and hide Shorts or Playables interface elements. Page structure and the current URL are processed locally and are not retained or transmitted.

### Remote code

Select: **No, I am not using remote code.**

All executable JavaScript is included in the submitted package. The extension does not fetch or execute remote scripts, WebAssembly, or remotely supplied logic.

### Data-use disclosure

The implementation accesses YouTube page structure and the current YouTube URL locally to provide its disclosed features. It does not collect or transmit this information. In the dashboard, answer according to the wording currently shown:

- Disclose local access to **Website content** if the form asks what data the extension handles or accesses, even though it is neither retained nor transmitted.
- Do not claim collection of personally identifiable information, health information, financial information, authentication information, personal communications, location, or user activity; none is collected.
- If the form defines **Web history** as including a currently processed URL rather than a retained record of visited pages, disclose that local processing and explain that it is not stored or transmitted.
- Certify that data is not sold, not used outside the single purpose, not used for creditworthiness or lending, and not transferred to third parties.

Privacy policy URL after this commit is published:

`https://github.com/fjt-dev/yt-tools/blob/main/PRIVACY.md`

## Graphic assets

Chrome Web Store requires a 128×128 icon, at least one 1280×800 screenshot, and a 440×280 small promotional tile. The package already includes `icons/icon128.png`. Generate the listing-only images with:

```sh
./scripts/generate-store-assets.sh
```

Upload:

- `store-assets/screenshot-1.png` (1280×800)
- `store-assets/small-promo.png` (440×280)

Before submission, visually confirm that the screenshot still matches the current YouTube UI. Replace it with a fresh real-product capture if the UI has changed.

## Final checklist

- Load the repository folder with `chrome://extensions` and test all three toggles on a YouTube watch page.
- Confirm Shorts redirects preserve playlist parameters and Playables redirects only when their blockers are enabled.
- Run `./scripts/package.sh`, inspect its ZIP, and upload that ZIP rather than the repository download ZIP.
- Publish `PRIVACY.md` at a public HTTPS URL and enter that URL in the dashboard.
- Complete the Store listing, Privacy practices, Distribution, and Test instructions tabs.
- Verify the developer contact email and account two-step verification.
- Choose private or unlisted visibility for a review-install test if desired; all visibility options receive policy review.
