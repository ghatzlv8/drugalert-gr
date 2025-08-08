// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'Νέα ανακοίνωση από EOF',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      postId: data.postId
    },
    actions: [
      {
        action: 'view',
        title: 'Προβολή',
        icon: '/icons/view.png'
      },
      {
        action: 'close',
        title: 'Κλείσιμο',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'EOF Alert', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('localhost:3000') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Keep service worker alive
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
