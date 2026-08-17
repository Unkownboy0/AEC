// Firebase Messaging Service Worker for CampusOS Web Push
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDNmzuZ2ghENWy2_8mtD8m5TE9qU_l-yoU",
  authDomain: "campusos-db831.firebaseapp.com",
  projectId: "campusos-db831",
  storageBucket: "campusos-db831.firebasestorage.app",
  messagingSenderId: "336442577619",
  appId: "1:336442577619:web:46b3ef7b10a1a6f495ba26",
  measurementId: "G-268XQS934Y"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'CampusOS Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || payload.data?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click on Web
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deepLinkRoute || event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.navigate(deepLink);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(deepLink);
      }
    })
  );
});
