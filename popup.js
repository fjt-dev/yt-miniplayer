(function () {
  'use strict';

  const settings = [
    { key: 'enabled', toggle: 'toggle', card: 'statusCard', dot: 'statusDot', text: 'statusText', span: 'statusSpan', message: 'toggle', defaultValue: true },
    { key: 'shortsBlocked', toggle: 'shortsToggle', card: 'shortsCard', dot: 'shortsDot', text: 'shortsText', span: 'shortsSpan', message: 'shortsToggle', ruleset: 'ruleset_shorts', defaultValue: false },
    { key: 'playablesBlocked', toggle: 'playablesToggle', card: 'playablesCard', dot: 'playablesDot', text: 'playablesText', span: 'playablesSpan', message: 'playablesToggle', ruleset: 'ruleset_playables', defaultValue: false },
  ];

  function elements(setting) {
    return {
      toggle: document.getElementById(setting.toggle),
      card: document.getElementById(setting.card),
      dot: document.getElementById(setting.dot),
      text: document.getElementById(setting.text),
      span: document.getElementById(setting.span),
    };
  }

  function updateUI(setting, enabled) {
    const ui = elements(setting);
    ui.toggle.checked = enabled;
    ui.dot.classList.toggle('off', !enabled);
    ui.card.classList.toggle('active', enabled);
    ui.text.textContent = enabled ? 'Enabled' : 'Disabled';
    ui.span.textContent = enabled ? 'enabled' : 'disabled';
    ui.span.classList.toggle('off', !enabled);
  }

  async function notifyYouTubeTabs(message, enabled) {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
      await Promise.allSettled(tabs.map((tab) =>
        chrome.tabs.sendMessage(tab.id, { type: message, enabled })
      ));
    } catch (error) {
      // The stored setting still applies on the next YouTube navigation.
      console.warn('Could not notify existing YouTube tabs', error);
    }
  }

  async function saveSetting(setting, enabled) {
    let rulesetChanged = false;
    try {
      if (setting.ruleset) {
        const change = enabled
          ? { enableRulesetIds: [setting.ruleset] }
          : { disableRulesetIds: [setting.ruleset] };
        await chrome.declarativeNetRequest.updateEnabledRulesets(change);
        rulesetChanged = true;
      }
      await chrome.storage.local.set({ [setting.key]: enabled });
    } catch (error) {
      if (rulesetChanged) {
        const rollback = enabled
          ? { disableRulesetIds: [setting.ruleset] }
          : { enableRulesetIds: [setting.ruleset] };
        await chrome.declarativeNetRequest.updateEnabledRulesets(rollback).catch(() => {});
      }
      throw error;
    }
    await notifyYouTubeTabs(setting.message, enabled);
  }

  const defaults = Object.fromEntries(settings.map((setting) => [setting.key, setting.defaultValue]));
  chrome.storage.local.get(defaults, (stored) => {
    for (const setting of settings) updateUI(setting, stored[setting.key]);
  });

  for (const setting of settings) {
    const ui = elements(setting);
    ui.toggle.addEventListener('change', async () => {
      const enabled = ui.toggle.checked;
      ui.toggle.disabled = true;
      try {
        await saveSetting(setting, enabled);
        updateUI(setting, enabled);
      } catch (error) {
        console.error(`Failed to update ${setting.key}`, error);
        updateUI(setting, !enabled);
      } finally {
        ui.toggle.disabled = false;
      }
    });
  }
})();
