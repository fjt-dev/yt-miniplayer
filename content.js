(function () {
  'use strict';

  const BUTTON_ID = 'yt-custom-miniplayer-btn';

  // Lucide picture-in-picture-2 icon (https://lucide.dev/icons/picture-in-picture-2)
  // data URI <img> を使い、YouTube の CSS カスケードからアイコンを完全に隔離する
  const ICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>')}`;

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
   * カスタムボタンを作成する
   */
  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'ytp-button';
    btn.title = 'ミニプレーヤー';
    btn.setAttribute('aria-label', 'ミニプレーヤー');
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
    `;
    const img = document.createElement('img');
    img.src = ICON_DATA_URI;
    img.style.cssText = 'width: 24px !important; height: 24px !important; display: block !important; pointer-events: none;';
    img.setAttribute('draggable', 'false');
    btn.appendChild(img);

    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.9'; });
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
    // SPA ナビゲーション・初回注入用の広域オブザーバー
    const domObserver = new MutationObserver(() => {
      const rightControls = document.querySelector('.ytp-right-controls');
      if (rightControls && !document.getElementById(BUTTON_ID)) {
        injectButton();
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    // キャスト状態変化専用オブザーバー
    // Chromecast 開始/停止時に .html5-video-player の class が変わるのを監視し、
    // YouTube の DOM 再構築が落ち着いた後（200ms）にボタンを再注入する
    function attachCastObserver() {
      const player = document.querySelector('.html5-video-player');
      if (!player) return;

      const castObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'class') {
            setTimeout(() => {
              if (!document.getElementById(BUTTON_ID)) {
                injectButton();
              }
            }, 200);
            break;
          }
        }
      });
      castObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
    }

    if (document.querySelector('.html5-video-player')) {
      attachCastObserver();
    } else {
      const waitObserver = new MutationObserver(() => {
        if (document.querySelector('.html5-video-player')) {
          waitObserver.disconnect();
          attachCastObserver();
        }
      });
      waitObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  injectButton();
  observePlayerReady();
})();
