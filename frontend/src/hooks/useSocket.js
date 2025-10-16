import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import { useNotifications } from '../components/shared/NotificationToast';

export const useSocket = () => {
  const { user, token } = useAuth();
  const { showReminder, showInfo, showSuccess } = useNotifications();

  useEffect(() => {
    if (token && user) {
      // Connect to socket with authentication
      socketService.connect(token);
      
      // Join user room for personal notifications
      socketService.joinUserRoom(user.id);

      return () => {
        socketService.leaveUserRoom(user.id);
        socketService.disconnect();
      };
    }
  }, [token, user]);

  const setupTimerListeners = useCallback((onTimerUpdate, onTimerFinished, onPhaseChange) => {
    const unsubscribers = [];

    if (onTimerUpdate) {
      unsubscribers.push(
        socketService.on('timerUpdate', onTimerUpdate)
      );
    }

    if (onTimerFinished) {
      unsubscribers.push(
        socketService.on('timerFinished', (data) => {
          onTimerFinished(data);
          showSuccess(
            'Timer Finished!',
            `${data.phase} session completed.`,
            {
              actions: [
                {
                  label: 'Start Next',
                  primary: true,
                  handler: () => data.onStartNext?.()
                }
              ]
            }
          );
        })
      );
    }

    if (onPhaseChange) {
      unsubscribers.push(
        socketService.on('timerPhaseChange', (data) => {
          onPhaseChange(data);
          showInfo(
            'Phase Changed',
            `Switched to ${data.newPhase} phase.`
          );
        })
      );
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [showSuccess, showInfo]);

  const setupReminderListeners = useCallback((onReminderDue, onReminderUpdate) => {
    const unsubscribers = [];

    unsubscribers.push(
      socketService.on('reminderDue', (data) => {
        if (onReminderDue) {
          onReminderDue(data);
        }
        
        showReminder(
          data.title,
          data.message || 'Time for your reminder!',
          {
            actions: [
              {
                label: 'Mark Complete',
                primary: true,
                handler: () => data.onMarkComplete?.()
              },
              {
                label: 'Snooze',
                handler: () => data.onSnooze?.()
              }
            ]
          }
        );
      })
    );

    if (onReminderUpdate) {
      unsubscribers.push(
        socketService.on('reminderCreated', onReminderUpdate),
        socketService.on('reminderUpdated', onReminderUpdate),
        socketService.on('reminderDeleted', onReminderUpdate)
      );
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [showReminder]);

  const joinTimerRoom = useCallback((timerId) => {
    socketService.joinTimerRoom(timerId);
  }, []);

  const leaveTimerRoom = useCallback((timerId) => {
    socketService.leaveTimerRoom(timerId);
  }, []);

  return {
    isConnected: socketService.isSocketConnected(),
    setupTimerListeners,
    setupReminderListeners,
    joinTimerRoom,
    leaveTimerRoom,
    socketService
  };
};

export default useSocket;