(function () {
  'use strict';

  const toggle = document.getElementById('toggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusSpan = document.getElementById('statusSpan');
  const statusCard = document.getElementById('statusCard');

  function updateUI(enabled) {
    if (enabled) {
      statusDot.classList.remove('off');
      statusText.textContent = 'Enabled';
      statusCard.classList.add('active');
      statusSpan.textContent = 'enabled';
      statusSpan.classList.remove('off');
    } else {
      statusDot.classList.add('off');
      statusText.textContent = 'Disabled';
      statusCard.classList.remove('active');
      statusSpan.textContent = 'disabled';
      statusSpan.classList.add('off');
    }
  }

  // 保存済みの状態を読み込む
  chrome.storage.local.get({ enabled: true }, (result) => {
    toggle.checked = result.enabled;
    updateUI(result.enabled);
  });

  // トグル変更時に状態を保存し、開いているYouTubeタブに通知する
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled }, () => {
      updateUI(enabled);

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
