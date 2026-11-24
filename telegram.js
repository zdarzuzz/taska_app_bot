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
    displayName: '',
    async api(action, data = {}) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch('https://utinwfxyouyuxbjlysnp.supabase.co/functions/v1/taska-api', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({initData:tg.initData,action,data}), credentials:'omit', cache:'no-store', signal:controller.signal
        });
        const result = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(res.status===401?'Закройте ТАСКУ и заново откройте её из бота.':(result.error||'Сервер недоступен. Попробуйте ещё раз.'));
        return result;
      } finally { clearTimeout(timeout); }
    },
    async authenticate() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch('https://utinwfxyouyuxbjlysnp.supabase.co/functions/v1/telegram-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: tg.initData }),
          credentials: 'omit',
          cache: 'no-store',
          signal: controller.signal
        });
        if (response.status === 401) throw new Error('Срок входа истёк или данные не прошли проверку. Закройте ТАСКУ и откройте снова из бота.');
        if (!response.ok) throw new Error('Не удалось подключиться к серверу. Попробуйте ещё раз.');
        const { user } = await response.json();
        if (!user || typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) throw new Error('Сервер не подтвердил аккаунт.');
        this.displayName = typeof user.display_name === 'string' ? user.display_name : '';
        return user;
      } finally { clearTimeout(timeout); }
    },
    requestNotifications(callback) {
      if (typeof tg.requestWriteAccess === 'function' && tg.isVersionAtLeast('6.9')) tg.requestWriteAccess(callback);
      else callback(false);
    },
    feedback() { tg.HapticFeedback?.selectionChanged(); }
  };
})();
