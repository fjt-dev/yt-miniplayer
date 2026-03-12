(function () {
  'use strict';

  const BUTTON_ID = 'yt-custom-miniplayer-btn';

  function isWatchPage() {
    return location.pathname === '/watch';
  }

  // カスタムミニプレーヤーアイコン
  // data URI <img> を使い、YouTube の CSS カスケードからアイコンを完全に隔離する
  const ICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -10 110 110" fill="none"><rect x="5" y="5" width="100" height="80" rx="6" stroke="white" stroke-width="10"/><mask id="m" fill="white"><rect x="50" y="40" width="45" height="35" rx="5"/></mask><rect x="50" y="40" width="45" height="35" rx="5" stroke="white" stroke-width="20" mask="url(#m)"/></svg>')}`;

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
    // height・padding を上書きせず YouTube の .ytp-button スタイルに任せる
    // vertical-align: middle で他ボタンと縦位置を揃える
    btn.style.cssText = `
      width: 48px !important;
      padding: 0 !important;
      opacity: 0.9;
      cursor: pointer;
      background: none;
      border: none;
      outline: none;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      position: relative;
      vertical-align: middle;
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

    function activateObservers() {
      if (!domObserverConnected) {
        domObserver.observe(document.body, { childList: true, subtree: true });
        domObserverConnected = true;
      }
      attachCastObserver();
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

    document.addEventListener('yt-navigate-finish', () => {
      if (isWatchPage()) {
        activateObservers();
      } else {
        deactivateObservers();
      }
    });

    if (isWatchPage()) {
      activateObservers();
    }
  }

  if (isWatchPage()) {
    chrome.storage.local.get({ enabled: true }, (result) => {
      if (result.enabled) {
        injectButton();
      }
    });
  }
  observePlayerReady();
})();
