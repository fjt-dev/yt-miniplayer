(function () {
  'use strict';

  const BUTTON_ID = 'yt-custom-miniplayer-btn';

  // YouTubeの実際のミニプレーヤーアイコン（右クリックメニューから取得）
  const ICON_SVG = `<svg height="24" viewBox="0 0 24 24" width="24" style="width:24px;height:24px;display:block;fill:#ffffff;" xmlns="http://www.w3.org/2000/svg"><path d="M21.20 3.01C21.66 3.05 22.08 3.26 22.41 3.58C22.73 3.91 22.94 4.33 22.98 4.79L23 5V19C23.00 19.49 22.81 19.97 22.48 20.34C22.15 20.70 21.69 20.93 21.20 20.99L21 21H3L2.79 20.99C2.30 20.93 1.84 20.70 1.51 20.34C1.18 19.97 .99 19.49 1 19V13H3V19H21V5H11V3H21L21.20 3.01ZM1.29 3.29C1.10 3.48 1.00 3.73 1.00 4C1.00 4.26 1.10 4.51 1.29 4.70L5.58 9H3C2.73 9 2.48 9.10 2.29 9.29C2.10 9.48 2 9.73 2 10C2 10.26 2.10 10.51 2.29 10.70C2.48 10.89 2.73 11 3 11H9V5C9 4.73 8.89 4.48 8.70 4.29C8.51 4.10 8.26 4 8 4C7.73 4 7.48 4.10 7.29 4.29C7.10 4.48 7 4.73 7 5V7.58L2.70 3.29C2.51 3.10 2.26 3.00 2 3.00C1.73 3.00 1.48 3.10 1.29 3.29ZM19.10 11.00L19 11H12L11.89 11.00C11.66 11.02 11.45 11.13 11.29 11.29C11.13 11.45 11.02 11.66 11.00 11.89L11 12V17C10.99 17.24 11.09 17.48 11.25 17.67C11.42 17.85 11.65 17.96 11.89 17.99L12 18H19L19.10 17.99C19.34 17.96 19.57 17.85 19.74 17.67C19.90 17.48 20.00 17.24 20 17V12L19.99 11.89C19.97 11.66 19.87 11.45 19.70 11.29C19.54 11.13 19.33 11.02 19.10 11.00Z"/></svg>`;

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
    btn.innerHTML = ICON_SVG;

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
    const observer = new MutationObserver(() => {
      const rightControls = document.querySelector('.ytp-right-controls');
      if (rightControls && !document.getElementById(BUTTON_ID)) {
        injectButton();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  injectButton();
  observePlayerReady();
})();
