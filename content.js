(function () {
  'use strict';

  const BUTTON_ID = 'yt-custom-miniplayer-btn';

  function isWatchPage() {
    return location.pathname === '/watch';
  }

  // Lucide picture-in-picture-2 icon (https://lucide.dev/icons/picture-in-picture-2)
  // data URI <img> を使い、YouTube の CSS カスケードからアイコンを完全に隔離する
  const ICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>')}`;

  /**
   * ボタンの表示・非表示を切り替える
   */
  function removeButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
  }

  /**
   * ポップアップからのメッセージを受信する
   */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'toggle') {
      if (message.enabled) {
        injectButton();
      } else {
        removeButton();
      }
    }
  });

  /**
   * ミニプレーヤーモードを起動する
   * コンテキストメニューを一時的に表示してミニプレーヤー項目をクリック
   */
  function activateMiniPlayer() {
    const video = document.querySelector('video');
    if (!video) return;

    video.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

    requestAnimationFrame(() => {
      const menuItems = document.querySelectorAll('.ytp-menuitem');
      const miniItem = Array.from(menuItems).find(el =>
        el.textContent.includes('ミニプレーヤー') ||
        el.textContent.includes('Mini player') ||
        el.textContent.includes('Miniplayer') ||
        el.textContent.toLowerCase().includes('mini')
      );
      if (miniItem) {
        miniItem.click();
      }
    });
  }

  /**
   * YouTube スタイルのツールチップを作成する
   */
  function createTooltip() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 49px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease-in;
      white-space: nowrap;
    `;

    const text = document.createElement('span');
    text.textContent = 'Miniplayer';
    text.style.cssText = `
      background: rgba(28, 28, 28, 0.9);
      color: #fff;
      font-family: Roboto, Arial, sans-serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      padding: 5px 8px;
      border-radius: 2px;
      display: block;
    `;
    container.appendChild(text);

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid rgba(28, 28, 28, 0.9);
    `;
    container.appendChild(arrow);

    return container;
  }

  /**
   * カスタムボタンを作成する
   */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ytp-button';
    btn.setAttribute('aria-label', 'Miniplayer');
    // SVGのwidthが0pxになるYouTubeのCSSを上書きするためstyleで明示指定
    btn.style.cssText = `
      width: 36px !important;
      height: 36px !important;
      padding: 6px !important;
      opacity: 0.9;
      cursor: pointer;
      background: none;
      border: none;
      outline: none;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      position: relative;
    `;
    const img = document.createElement('img');
    img.src = ICON_DATA_URI;
    img.style.cssText = 'width: 24px !important; height: 24px !important; display: block !important; pointer-events: none;';
    img.setAttribute('draggable', 'false');
    btn.appendChild(img);

    const tooltip = createTooltip();
    btn.appendChild(tooltip);

    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; tooltip.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.9'; tooltip.style.opacity = '0'; });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateMiniPlayer();
    });

    return btn;
  }

  /**
   * コントロールバーにボタンを注入する
   */
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const rightControlsRight = document.querySelector('.ytp-right-controls-right');
    if (rightControlsRight) {
      const fullscreenBtn = rightControlsRight.querySelector('.ytp-fullscreen-button');
      const btn = createButton();
      if (fullscreenBtn) {
        rightControlsRight.insertBefore(btn, fullscreenBtn);
      } else {
        rightControlsRight.insertBefore(btn, rightControlsRight.firstChild);
      }
      return;
    }

    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return;

    const fullscreenBtn = rightControls.querySelector('.ytp-fullscreen-button');
    const btn = createButton();
    if (fullscreenBtn) {
      rightControls.insertBefore(btn, fullscreenBtn);
    } else {
      rightControls.appendChild(btn);
    }
  }

  function observePlayerReady() {
    let domObserverConnected = false;
    let castObserverInstance = null;
    let castObserverPlayer = null;

    // SPA ナビゲーション・初回注入用の広域オブザーバー
    const domObserver = new MutationObserver(() => {
      const rightControls = document.querySelector('.ytp-right-controls');
      if (rightControls && !document.getElementById(BUTTON_ID)) {
        chrome.storage.local.get({ enabled: true }, (result) => {
          if (result.enabled) injectButton();
        });
      }
    });

    // キャスト状態変化専用オブザーバー
    // Chromecast 開始/停止時に .html5-video-player の class が変わるのを監視し、
    // YouTube の DOM 再構築が落ち着いた後（200ms）にボタンを再注入する
    function attachCastObserver() {
      const player = document.querySelector('.html5-video-player');
      if (!player || player === castObserverPlayer) return;

      if (castObserverInstance) castObserverInstance.disconnect();

      castObserverInstance = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'class') {
            setTimeout(() => {
              if (!document.getElementById(BUTTON_ID)) {
                chrome.storage.local.get({ enabled: true }, (result) => {
                  if (result.enabled) injectButton();
                });
              }
            }, 200);
            break;
          }
        }
      });
      castObserverInstance.observe(player, { attributes: true, attributeFilter: ['class'] });
      castObserverPlayer = player;
    }

    function disconnectCastObserver() {
      if (castObserverInstance) {
        castObserverInstance.disconnect();
        castObserverInstance = null;
        castObserverPlayer = null;
      }
    }

    // /watch ページにいるときだけオブザーバーを有効化する
    function activateObservers() {
      if (!domObserverConnected) {
        domObserver.observe(document.body, { childList: true, subtree: true });
        domObserverConnected = true;
      }
      attachCastObserver();
      // ナビゲーション直後にボタンを注入試行
      chrome.storage.local.get({ enabled: true }, (result) => {
        if (result.enabled) injectButton();
      });
    }

    function deactivateObservers() {
      if (domObserverConnected) {
        domObserver.disconnect();
        domObserverConnected = false;
      }
      disconnectCastObserver();
      removeButton();
    }

    // YouTube の SPA ナビゲーションを検知する
    document.addEventListener('yt-navigate-finish', () => {
      if (isWatchPage()) {
        activateObservers();
      } else {
        deactivateObservers();
      }
    });

    // 初回ロード時
    if (isWatchPage()) {
      activateObservers();
    }
  }

  // 保存済みの状態を確認してから初期化する
  if (isWatchPage()) {
    chrome.storage.local.get({ enabled: true }, (result) => {
      if (result.enabled) {
        injectButton();
      }
    });
  }
  observePlayerReady();
})();
