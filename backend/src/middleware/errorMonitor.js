// 🚨 ERROR MONITORING & AUTO-RECOVERY SYSTEM
// This middleware provides comprehensive error tracking and automatic recovery

const fs = require('fs');
const path = require('path');

class ErrorMonitor {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.logFile = path.join(__dirname, '../logs/error-monitor.log');
    this.createLogDirectory();
  }

  createLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      severity: this.determineSeverity(error)
    };

    this.errorLog.push(errorEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Write to file
    this.writeToFile(errorEntry);
    
    // Auto-recovery attempts
    this.attemptRecovery(error, context);
    
    return errorEntry;
  }

  determineSeverity(error) {
    if (error.name === 'MongooseError' || error.message.includes('MongoDB')) {
      return 'HIGH';
    }
    if (error.name === 'ValidationError') {
      return 'MEDIUM';
    }
    if (error.status >= 500) {
      return 'HIGH';
    }
    if (error.status >= 400) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  attemptRecovery(error, context) {
    switch (error.name) {
      case 'MongooseError':
        this.recoverDatabaseConnection();
        break;
      case 'EADDRINUSE':
        this.recoverPortConflict();
        break;
      case 'ValidationError':
        this.logValidationTips(error);
        break;
    }
  }

  recoverDatabaseConnection() {
    console.log('🔄 Attempting database reconnection...');
    // Database reconnection is handled by the connectDB retry logic
  }

  recoverPortConflict() {
    console.log('🔄 Port conflict detected - check ULTIMATE_START.bat for automatic port cleanup');
  }

  logValidationTips(error) {
    console.log('💡 Validation Error Tips:');
    if (error.message.includes('password')) {
      console.log('   - Password must be 8+ chars with uppercase, lowercase, number, and special character');
    }
    if (error.message.includes('displayName')) {
      console.log('   - Display name allows letters, numbers, spaces, hyphens, apostrophes, periods');
    }
    if (error.message.includes('email')) {
      console.log('   - Email must be in valid format (user@domain.com)');
    }
  }

  writeToFile(errorEntry) {
    const logLine = `${errorEntry.timestamp} [${errorEntry.severity}] ${errorEntry.error.name}: ${errorEntry.error.message}\n`;
    fs.appendFileSync(this.logFile, logLine, 'utf8');
  }

  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(entry => {
      const type = entry.error.name;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.bySeverity[entry.severity]++;
    });

    return stats;
  }

  // Express middleware
  middleware() {
    return (err, req, res, next) => {
      // Log the error
      this.logError(err, {
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers,
        ip: req.ip
      });

      // Send appropriate response
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: Object.values(err.errors).map(e => e.message),
          tip: 'Check PERMANENT_SOLUTIONS_GUIDE.md for validation requirements'
        });
      }

      if (err.name === 'MongooseError') {
        return res.status(503).json({
          error: 'Database temporarily unavailable',
          tip: 'Please try again in a moment. Auto-recovery in progress.'
        });
      }

      if (err.code === 11000) {
        return res.status(400).json({
          error: 'Duplicate entry - user already exists',
          tip: 'Try logging in instead of registering'
        });
      }

      // Default error response
      const isDevelopment = process.env.NODE_ENV === 'development';
      res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack }),
        tip: 'Check PERMANENT_SOLUTIONS_GUIDE.md for troubleshooting'
      });
    };
  }

  // Health check endpoint data
  healthCheck() {
    const stats = this.getErrorStats();
    const isHealthy = stats.bySeverity.HIGH < 5; // Less than 5 high-severity errors

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      errorStats: stats,
      recommendations: this.getRecommendations(stats)
    };
  }

  getRecommendations(stats) {
    const recommendations = [];
    
    if (stats.bySeverity.HIGH > 0) {
      recommendations.push('Run SYSTEM_HEALTH_CHECK.bat to diagnose issues');
    }
    
    if (stats.byType.ValidationError > 10) {
      recommendations.push('Review validation requirements in PERMANENT_SOLUTIONS_GUIDE.md');
    }
    
    if (stats.byType.MongooseError > 0) {
      recommendations.push('Check MongoDB connection stability');
    }

    return recommendations;
  }
}

// Singleton instance
const errorMonitor = new ErrorMonitor();

module.exports = errorMonitor;