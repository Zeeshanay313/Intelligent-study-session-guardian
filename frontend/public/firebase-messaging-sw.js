// Firebase messaging service worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "your-api-key", // Will be configured via environment
  authDomain: "study-guardian.firebaseapp.com",
  projectId: "study-guardian",
  storageBucket: "study-guardian.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Study Guardian';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: payload.data?.type === 'study_session',
    actions: getActionsForType(payload.data?.type)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'study_session':
      return [
        { action: 'start', title: 'Start Now', icon: '/icons/play.png' },
        { action: 'snooze', title: 'Snooze 5min', icon: '/icons/snooze.png' }
      ];
    case 'break_reminder':
      return [
        { action: 'start_break', title: 'Start Break', icon: '/icons/coffee.png' },
        { action: 'continue_work', title: 'Keep Working', icon: '/icons/work.png' }
      ];
    case 'goal_achievement':
      return [
        { action: 'view_goals', title: 'View Goals', icon: '/icons/goals.png' }
      ];
    default:
      return [];
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let urlToOpen = '/';
  
  // Handle different actions
  switch (action) {
    case 'start':
    case 'start_break':
      urlToOpen = '/timer';
      break;
    case 'snooze':
      // Handle snooze action - could send message to main app
      scheduleSnoozeNotification(data);
      return;
    case 'view_goals':
      urlToOpen = '/goals';
      break;
    case 'continue_work':
      // Send message to main app to continue session
      sendMessageToApp({ type: 'continue_session', data });
      return;
    default:
      urlToOpen = data.url || '/';
  }
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if not found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Schedule snooze notification
function scheduleSnoozeNotification(originalData) {
  setTimeout(() => {
    self.registration.showNotification('🎯 Study Session Reminder (Snoozed)', {
      body: 'Time for your study session!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'study-session-snooze',
      data: originalData,
      actions: [
        { action: 'start', title: 'Start Now', icon: '/icons/play.png' }
      ]
    });
  }, 5 * 60 * 1000); // 5 minutes
}

// Send message to main app
function sendMessageToApp(message) {
  clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe and send new token to server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'your-vapid-public-key'
    }).then((subscription) => {
      // Send new subscription to server
      fetch('/api/notifications/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(clients.claim());
});