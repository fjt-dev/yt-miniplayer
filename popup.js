(function () {
  'use strict';

  const toggle = document.getElementById('enabled-toggle');
  const statusText = document.getElementById('status-text');

  function updateStatusDisplay(enabled) {
    if (enabled) {
      statusText.textContent = '有効';
      statusText.className = 'status enabled';
    } else {
      statusText.textContent = '無効';
      statusText.className = 'status disabled';
    }
  }

  // 保存済みの状態を読み込む
  chrome.storage.local.get({ enabled: true }, (result) => {
    toggle.checked = result.enabled;
    updateStatusDisplay(result.enabled);
  });

  // トグル変更時に状態を保存し、開いているYouTubeタブに通知する
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled }, () => {
      updateStatusDisplay(enabled);

      // 全てのYouTubeタブにメッセージを送信
      chrome.tabs.query({ url: 'https://www.youtube.com/watch*' }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: 'toggle', enabled }).catch(() => {
            // タブがメッセージを受信できない場合は無視
          });
        }
      });
    });
  });
})();
