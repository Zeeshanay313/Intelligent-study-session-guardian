import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5004';
    
    this.socket = io(serverUrl, {
      auth: {
        token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.emit('socketConnected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('socketDisconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('socketError', error);
    });

    // Timer events
    this.socket.on('timer:update', (data) => {
      this.emit('timerUpdate', data);
    });

    this.socket.on('timer:finished', (data) => {
      this.emit('timerFinished', data);
    });

    this.socket.on('timer:phase-change', (data) => {
      this.emit('timerPhaseChange', data);
    });

    // Reminder events
    this.socket.on('reminder:due', (data) => {
      this.emit('reminderDue', data);
    });

    this.socket.on('reminder:created', (data) => {
      this.emit('reminderCreated', data);
    });

    this.socket.on('reminder:updated', (data) => {
      this.emit('reminderUpdated', data);
    });

    this.socket.on('reminder:deleted', (data) => {
      this.emit('reminderDeleted', data);
    });

    // Session events
    this.socket.on('session:started', (data) => {
      this.emit('sessionStarted', data);
    });

    this.socket.on('session:ended', (data) => {
      this.emit('sessionEnded', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Timer methods
  joinTimerRoom(timerId) {
    if (this.socket) {
      this.socket.emit('join-timer', timerId);
    }
  }

  leaveTimerRoom(timerId) {
    if (this.socket) {
      this.socket.emit('leave-timer', timerId);
    }
  }

  // Reminder methods
  joinUserRoom(userId) {
    if (this.socket) {
      this.socket.emit('join-user-room', userId);
    }
  }

  leaveUserRoom(userId) {
    if (this.socket) {
      this.socket.emit('leave-user-room', userId);
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;