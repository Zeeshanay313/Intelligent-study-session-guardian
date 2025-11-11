import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '../components/shared/NotificationToast';

// Global event emitter for reminder triggers
const reminderEventEmitter = {
  listeners: [],
  subscribe: (callback) => {
    reminderEventEmitter.listeners.push(callback);
    return () => {
      reminderEventEmitter.listeners = reminderEventEmitter.listeners.filter(l => l !== callback);
    };
  },
  emit: (reminder) => {
    reminderEventEmitter.listeners.forEach(callback => callback(reminder));
  }
};

const useLocalReminders = () => {
  const [activeReminders, setActiveReminders] = useState([]);
  const checkIntervalRef = useRef(null);
  const { showSuccess, showError, showInfo } = useNotifications();

  // Load reminders from localStorage
  const loadReminders = useCallback(() => {
    try {
      const saved = localStorage.getItem('localReminders');
      if (saved) {
        const reminders = JSON.parse(saved);
        const now = new Date();
        
        // Filter out expired reminders and update state
        const activeReminders = reminders.filter(r => {
          if (r.type === 'one-off') {
            return new Date(r.datetime) > now && r.status === 'active';
          } else if (r.type === 'recurring') {
            return r.status === 'active' && r.recurring.enabled;
          }
          return false;
        });
        
        setActiveReminders(activeReminders);
        
        // Save back the filtered list
        localStorage.setItem('localReminders', JSON.stringify(activeReminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  }, []);

  // Save reminders to localStorage
  const saveReminders = useCallback((reminders) => {
    try {
      localStorage.setItem('localReminders', JSON.stringify(reminders));
      setActiveReminders(reminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }, []);

  // Add a new reminder
  const addReminder = useCallback((reminder) => {
    const newReminder = {
      id: Date.now().toString(),
      title: reminder.title || 'Reminder',
      message: reminder.message || 'Time for your reminder!',
      customMessage: reminder.customMessage || '',
      datetime: reminder.datetime,
      type: reminder.type || 'one-off',
      status: 'active',
      recurring: reminder.recurring || {},
      sound: reminder.sound || false,
      channels: {
        inApp: true,
        browser: true,
        ...reminder.channels
      },
      createdAt: new Date().toISOString()
    };

    const updatedReminders = [...activeReminders, newReminder];
    saveReminders(updatedReminders);
    
    // Request notification permission if needed
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    showSuccess(`Reminder "${newReminder.title}" set for ${new Date(newReminder.datetime).toLocaleString()}`);
    return newReminder;
  }, [activeReminders, saveReminders, showSuccess]);

  // Remove a reminder
  const removeReminder = useCallback((id) => {
    const updatedReminders = activeReminders.filter(r => r.id !== id);
    saveReminders(updatedReminders);
    showInfo('Reminder removed');
  }, [activeReminders, saveReminders, showInfo]);

  // Trigger a reminder notification
  const triggerNotification = useCallback((reminder) => {
    const title = reminder.title || 'Reminder';
    const message = reminder.customMessage || reminder.message || 'Time for your reminder!';

    console.log(`🔔 TRIGGERING NOTIFICATION: ${title}`);

    // Emit event for popup display
    reminderEventEmitter.emit(reminder);

    // In-app notification
    showInfo(message, title);

    // Browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
          tag: `reminder-${reminder.id}`,
          vibrate: [200, 100, 200],
          silent: false
        });

        // Play sound when notification is shown
        if (reminder.sound) {
          playNotificationSound();
        }

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            triggerNotification(reminder);
          }
        });
      }
    }

    // Audio notification if enabled
    if (reminder.sound) {
      playNotificationSound();
    }

    console.log(`✅ Reminder notification triggered: ${title} - ${message}`);
  }, [showInfo]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      // Create a pleasant notification sound
      const frequencies = [523.25, 659.25, 783.99]; // C, E, G
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = now + (index * 0.15);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Check for due reminders
  const checkDueReminders = useCallback(() => {
    const now = new Date();
    console.log(`🔍 Checking reminders at ${now.toLocaleTimeString()}`);
    const updatedReminders = [];
    let hasTriggered = false;
    
    activeReminders.forEach(reminder => {
      if (reminder.type === 'one-off') {
        const reminderTime = new Date(reminder.datetime);
        const timeDiff = now - reminderTime;
        
        console.log(`📅 Reminder "${reminder.title}": scheduled ${reminderTime.toLocaleString()}, now ${now.toLocaleString()}, diff: ${timeDiff}ms`);
        
        // Check if reminder is due (current time is past reminder time and within 2 minutes)
        if (now >= reminderTime && timeDiff < 120000 && reminder.status === 'active') {
          console.log(`🔔 TRIGGERING REMINDER: ${reminder.title}`);
          triggerNotification(reminder);
          hasTriggered = true;
          // Mark as triggered to prevent re-triggering
          reminder.status = 'triggered';
          reminder.triggeredAt = now.toISOString();
          updatedReminders.push(reminder);
        } else if (reminder.status === 'active' && now < reminderTime) {
          // Future reminder, keep it active
          updatedReminders.push(reminder);
        }
        // Don't keep triggered reminders older than 2 minutes
      } else if (reminder.type === 'recurring') {
        // Basic recurring logic (daily for now)
        if (reminder.recurring.enabled && reminder.recurring.frequency === 'daily') {
          const [hours, minutes] = reminder.recurring.timeOfDay.split(':');
          const reminderTime = new Date(now);
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const timeDiff = now - reminderTime;
          
          // If time has passed for today and we haven't triggered today
          if (now >= reminderTime && timeDiff < 120000) {
            const lastTriggered = reminder.recurring.lastTriggered ? new Date(reminder.recurring.lastTriggered) : null;
            const isToday = lastTriggered && lastTriggered.toDateString() === now.toDateString();
            
            if (!isToday) {
              console.log(`🔔 TRIGGERING RECURRING REMINDER: ${reminder.title}`);
              triggerNotification(reminder);
              hasTriggered = true;
              reminder.recurring.lastTriggered = now.toISOString();
            }
          }
        }
        updatedReminders.push(reminder);
      }
    });

    if (hasTriggered || updatedReminders.length !== activeReminders.length) {
      saveReminders(updatedReminders);
    }
  }, [activeReminders, triggerNotification, saveReminders]);

  // Start checking for reminders
  useEffect(() => {
    console.log('🚀 useLocalReminders initialized - loading reminders');
    loadReminders();
    
    // Do an immediate check for due reminders
    setTimeout(() => {
      console.log('⚡ Performing initial reminder check');
      checkDueReminders();
    }, 2000);
    
    // Check every 10 seconds for more responsive triggering
    console.log('⏰ Setting up reminder check interval (every 10 seconds)');
    checkIntervalRef.current = setInterval(() => {
      checkDueReminders();
    }, 10000); // Check every 10 seconds
    
    return () => {
      if (checkIntervalRef.current) {
        console.log('🛑 Cleaning up reminder check interval');
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [loadReminders, checkDueReminders]);

  return {
    activeReminders,
    addReminder,
    removeReminder,
    loadReminders,
    checkDueReminders: () => {
      console.log('Manual reminder check triggered');
      checkDueReminders();
    },
    subscribeToReminderTriggers: reminderEventEmitter.subscribe
  };
};

export default useLocalReminders;