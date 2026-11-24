/* The Telegram bridge is optional: regular browser preview stays available. */
(function () {
  'use strict';
  const tg = window.Telegram?.WebApp;
  const inTelegram = Boolean(tg?.initData);
  const mini = inTelegram || new URLSearchParams(location.search).has('mini');
  if (mini) document.documentElement.classList.add('mini-app');
  if (!inTelegram) return;
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor('#101014'); tg.setBackgroundColor('#101014'); } catch (_) {}
  function updateViewport() {
    document.documentElement.style.setProperty('--tg-height', `${tg.viewportHeight || innerHeight}px`);
  }
  updateViewport();
  tg.onEvent('viewportChanged', updateViewport);
  tg.BackButton.onClick(() => document.querySelector('[data-a="back"]')?.click());
  window.taskaTelegram = {
    syncBack(show) { show ? tg.BackButton.show() : tg.BackButton.hide(); },
    // Display hint only. Never use initDataUnsafe as authenticated identity.
    displayName: [tg.initDataUnsafe?.user?.first_name, tg.initDataUnsafe?.user?.last_name].filter(Boolean).join(' '),
    requestNotifications(callback) {
      if (typeof tg.requestWriteAccess === 'function' && tg.isVersionAtLeast('6.9')) tg.requestWriteAccess(callback);
      else callback(false);
    },
    feedback() { tg.HapticFeedback?.selectionChanged(); }
  };
})();
