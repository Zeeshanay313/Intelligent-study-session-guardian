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

// Global audio management - CRITICAL FOR STOPPING ALL SOUNDS
let globalSoundInterval = null;
let globalAudioContext = null;

const globalStopAllSounds = () => {
  console.log('🚨 GLOBAL STOP ALL SOUNDS CALLED');
  try {
    if (globalSoundInterval) {
      clearInterval(globalSoundInterval);
      globalSoundInterval = null;
      console.log('✅ Global sound interval cleared');
    }
    if (globalAudioContext && globalAudioContext.state !== 'closed') {
      globalAudioContext.close();
      globalAudioContext = null;
      console.log('✅ Global audio context closed');
    }
  } catch (error) {
    console.error('Error in global stop:', error);
  }
};

// Expose to window for emergency stop
if (typeof window !== 'undefined') {
  window.stopReminderAlarm = globalStopAllSounds;
}

const useLocalReminders = () => {
  const [activeReminders, setActiveReminders] = useState([]);
  const checkIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const soundIntervalRef = useRef(null); // For repeating alarm sound
  const triggeredRemindersRef = useRef(new Set()); // Track which reminders have been triggered
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
    // Remove from triggered set
    triggeredRemindersRef.current.delete(id);
    // Stop any playing audio
    stopNotificationSound();
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

    // Start alarm sound (looping)
    startAlarmSound();

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
          silent: true // We're handling sound ourselves
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          stopNotificationSound();
        };
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            triggerNotification(reminder);
          }
        });
      }
    }

    console.log(`✅ Reminder notification triggered: ${title} - ${message}`);
  }, [showInfo]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      console.log('🔊 Playing notification beep');
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
      
      // Clean up this specific audio context after sound finishes
      setTimeout(() => {
        audioContext.close();
      }, 500);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Start looping alarm sound
  const startAlarmSound = () => {
    console.log('🔊 Starting alarm loop');
    // Stop any existing alarm first
    globalStopAllSounds();
    
    // Play immediately
    playNotificationSound();
    
    // Then repeat every 3 seconds - use GLOBAL interval
    globalSoundInterval = setInterval(() => {
      playNotificationSound();
    }, 3000);
  };

  // Stop notification sound
  const stopNotificationSound = () => {
    console.log('🔇 LOCAL STOP called - calling GLOBAL STOP');
    globalStopAllSounds();
    
    // Also clear local refs as backup
    try {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (error) {
      console.error('Error in local stop:', error);
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
        
        console.log(`📅 Reminder "${reminder.title}": scheduled ${reminderTime.toLocaleString()}, now ${now.toLocaleString()}, diff: ${timeDiff}ms, status: ${reminder.status}, inTriggeredSet: ${triggeredRemindersRef.current.has(reminder.id)}`);
        
        // Check if reminder is due and hasn't been triggered yet
        if (now >= reminderTime && timeDiff < 120000 && reminder.status === 'active' && !triggeredRemindersRef.current.has(reminder.id)) {
          console.log(`🔔 TRIGGERING REMINDER: ${reminder.title} - WILL NOT BE CHECKED AGAIN`);
          // ADD TO TRIGGERED SET FIRST - before anything else!
          triggeredRemindersRef.current.add(reminder.id);
          // THEN trigger notification
          triggerNotification(reminder);
          hasTriggered = true;
          // DO NOT ADD TO UPDATED LIST - this reminder is completely done
        } else if (reminder.status === 'active' && now < reminderTime) {
          // Future reminder, keep it active
          updatedReminders.push(reminder);
        } else if (reminder.status === 'triggered') {
          // Already triggered, check if it's been more than 5 minutes - if so, remove it
          const triggeredTime = reminder.triggeredAt ? new Date(reminder.triggeredAt) : reminderTime;
          const timeSinceTrigger = now - triggeredTime;
          if (timeSinceTrigger < 300000) { // Keep for 5 minutes
            updatedReminders.push(reminder);
          } else {
            console.log(`🗑️ Removing old triggered reminder: ${reminder.title}`);
            triggeredRemindersRef.current.delete(reminder.id);
          }
        }
      } else if (reminder.type === 'recurring') {
        // Basic recurring logic (daily for now)
        if (reminder.recurring.enabled && reminder.recurring.frequency === 'daily') {
          const [hours, minutes] = reminder.recurring.timeOfDay.split(':');
          const reminderTime = new Date(now);
          reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const timeDiff = now - reminderTime;
          
          // If time has passed for today and we haven't triggered today
          if (now >= reminderTime && timeDiff < 120000 && !triggeredRemindersRef.current.has(reminder.id)) {
            const lastTriggered = reminder.recurring.lastTriggered ? new Date(reminder.recurring.lastTriggered) : null;
            const isToday = lastTriggered && lastTriggered.toDateString() === now.toDateString();
            
            if (!isToday) {
              console.log(`🔔 TRIGGERING RECURRING REMINDER: ${reminder.title}`);
              triggeredRemindersRef.current.add(reminder.id);
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
      console.log(`💾 Saving updated reminders (triggered: ${hasTriggered}, list changed: ${updatedReminders.length !== activeReminders.length})`);
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
      console.log('🛑 Cleaning up reminder system');
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      // CRITICAL: Stop any playing audio on cleanup
      stopNotificationSound();
    };
  }, [loadReminders, checkDueReminders]);

  return {
    activeReminders,
    addReminder,
    removeReminder,
    loadReminders,
    stopNotificationSound, // Export to allow stopping sound from outside
    checkDueReminders: () => {
      console.log('Manual reminder check triggered');
      checkDueReminders();
    },
    subscribeToReminderTriggers: reminderEventEmitter.subscribe
  };
};

export { globalStopAllSounds };
export default useLocalReminders;