// Be Fit AI - Hydration Reminders Service Worker
// Manages background caching (for offline capabilities) and native lockscreen/background push notifications
const CACHE_NAME = 'befit-wellness-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle custom background actions directly from the user's mobile lockscreen/notification panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If the user tapped the "Add Glass" action button, let's notify the app to increment hydration
  const action = event.action;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Look for an existing open window tab of our app
      const activeClient = clients.find(c => c.visibilityState === 'visible' || 'focus' in c);
      
      if (activeClient) {
        if (action === 'log-water') {
          activeClient.postMessage({ type: 'QUICK_LOG_WATER_GLASS', source: 'notification-action' });
        }
        if ('focus' in activeClient) {
          return activeClient.focus();
        }
      } else {
        // No open window. Open the main page
        if (self.clients.openWindow) {
          return self.clients.openWindow('/').then((newClient) => {
            if (newClient && action === 'log-water') {
              // Wait for the React bundle to load and mount, then dispatch
              setTimeout(() => {
                newClient.postMessage({ type: 'QUICK_LOG_WATER_GLASS', source: 'notification-action' });
              }, 1800);
            }
          });
        }
      }
    })
  );
});

// Handle push notification events from server-side brokers or simulated web push events
self.addEventListener('push', (event) => {
  let title = '💧 Hydration Check!';
  let body = 'Time to fuel up! Sip some pure water to maintain physical resilience.';
  
  if (event.data) {
    try {
      const parsed = event.data.json();
      title = parsed.title || title;
      body = parsed.body || body;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon: '/favicon.ico',
    badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    vibrate: [200, 100, 200],
    tag: 'hydration-alert',
    renotify: true,
    actions: [
      { action: 'log-water', title: '💧 Drink 1 Glass', icon: '' },
      { action: 'close', title: 'Dismiss', icon: '' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
