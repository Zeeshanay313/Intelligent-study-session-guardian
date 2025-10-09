const express = require('express');
const DeviceAccess = require('../models/DeviceAccess');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');
const { validateDeviceRegistration, validateDeviceAccess, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Register new device
router.post('/register', authenticate, validateDeviceRegistration, async (req, res) => {
  try {
    const {
      deviceId,
      deviceInfo = {},
      fingerprint = {}
    } = req.body;
    
    const userId = req.user._id;
    
    // Check if device already exists for user
    let device = await DeviceAccess.findOne({ userId, deviceId });
    
    if (device) {
      // Update existing device activity
      await device.updateActivity(req.ip);
      
      res.json({
        message: 'Device activity updated',
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceInfo: device.deviceInfo,
          lastSeen: device.lastSeen,
          accessEnabled: device.accessEnabled,
          trustScore: device.trustScore,
          status: device.status
        }
      });
    } else {
      // Create new device record
      device = new DeviceAccess({
        userId,
        deviceId,
        deviceInfo: {
          name: deviceInfo.name || 'Unknown Device',
          type: deviceInfo.type || 'unknown',
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          userAgent: req.get('User-Agent')
        },
        fingerprint,
        registeredIP: req.ip,
        lastIP: req.ip
      });
      
      await device.save();
      
      // Log device registration
      await AuditLog.logPrivacyAction(
        userId,
        'DEVICE_REGISTERED',
        {
          deviceId,
          deviceInfo: device.deviceInfo,
          fingerprint
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          deviceId
        }
      );
      
      res.status(201).json({
        message: 'Device registered successfully',
        device: {
          id: device._id,
          deviceId: device.deviceId,
          deviceInfo: device.deviceInfo,
          lastSeen: device.lastSeen,
          accessEnabled: device.accessEnabled,
          trustScore: device.trustScore,
          status: device.status
        }
      });
    }
    
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Get user's devices
router.get('/my-devices', authenticate, async (req, res) => {
  try {
    const { activeOnly = false } = req.query;
    
    const devices = await DeviceAccess.findUserDevices(
      req.user._id,
      activeOnly === 'true'
    );
    
    // Add computed fields
    const devicesWithStatus = devices.map(device => ({
      id: device._id,
      deviceId: device.deviceId,
      deviceInfo: device.deviceInfo,
      lastSeen: device.lastSeen,
      lastIP: device.lastIP,
      accessEnabled: device.accessEnabled,
      permissions: device.permissions,
      trustScore: device.trustScore,
      status: device.status,
      isTrusted: device.isTrusted,
      loginCount: device.loginCount,
      suspicious: device.suspicious,
      blocked: device.blocked,
      blockedReason: device.blockedReason,
      createdAt: device.createdAt
    }));
    
    res.json({
      devices: devicesWithStatus,
      total: devicesWithStatus.length
    });
    
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Update device access settings
router.patch('/:id/access', authenticate, validateObjectId('id'), validateDeviceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { accessEnabled, permissions } = req.body;
    
    // Find device and verify ownership
    const device = await DeviceAccess.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const originalState = {
      accessEnabled: device.accessEnabled,
      permissions: { ...device.permissions }
    };
    
    // Update access settings
    if (accessEnabled !== undefined) {
      if (accessEnabled) {
        await device.enableAccess();
      } else {
        await device.revokeAccess('User disabled access');
      }
    }
    
    // Update permissions
    if (permissions) {
      await device.updatePermissions(permissions);
    }
    
    // Log device access changes
    await AuditLog.logPrivacyAction(
      req.user._id,
      'DEVICE_ACCESS_CHANGED',
      {
        deviceId: device.deviceId,
        changes: {
          accessEnabled: {
            from: originalState.accessEnabled,
            to: device.accessEnabled
          },
          permissions: {
            from: originalState.permissions,
            to: device.permissions
          }
        }
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device.deviceId
      }
    );
    
    res.json({
      message: 'Device access updated successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        accessEnabled: device.accessEnabled,
        permissions: device.permissions,
        status: device.status,
        trustScore: device.trustScore
      }
    });
    
  } catch (error) {
    console.error('Device access update error:', error);
    res.status(500).json({ error: 'Failed to update device access' });
  }
});

// Revoke device access (block device)
router.post('/:id/revoke', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Access revoked by user' } = req.body;
    
    // Find device and verify ownership
    const device = await DeviceAccess.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Revoke access
    await device.revokeAccess(reason);
    
    // Log device revocation
    await AuditLog.logPrivacyAction(
      req.user._id,
      'DEVICE_ACCESS_REVOKED',
      {
        deviceId: device.deviceId,
        reason
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device.deviceId
      }
    );
    
    res.json({
      message: 'Device access revoked successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        accessEnabled: device.accessEnabled,
        blocked: device.blocked,
        blockedReason: device.blockedReason
      }
    });
    
  } catch (error) {
    console.error('Device revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke device access' });
  }
});

// Remove device completely
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find device and verify ownership
    const device = await DeviceAccess.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Store device info for logging
    const deviceInfo = {
      deviceId: device.deviceId,
      deviceInfo: device.deviceInfo
    };
    
    // Delete device
    await DeviceAccess.findByIdAndDelete(id);
    
    // Log device removal
    await AuditLog.logPrivacyAction(
      req.user._id,
      'DEVICE_REMOVED',
      deviceInfo,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device.deviceId
      }
    );
    
    res.json({
      message: 'Device removed successfully'
    });
    
  } catch (error) {
    console.error('Device removal error:', error);
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

// Get device details
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find device and verify ownership
    const device = await DeviceAccess.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({
      device: {
        id: device._id,
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        lastSeen: device.lastSeen,
        lastIP: device.lastIP,
        registeredIP: device.registeredIP,
        accessEnabled: device.accessEnabled,
        permissions: device.permissions,
        trustScore: device.trustScore,
        status: device.status,
        isTrusted: device.isTrusted,
        loginCount: device.loginCount,
        suspicious: device.suspicious,
        blocked: device.blocked,
        blockedReason: device.blockedReason,
        blockedAt: device.blockedAt,
        fingerprint: device.fingerprint,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Get device details error:', error);
    res.status(500).json({ error: 'Failed to get device details' });
  }
});

// Mark device as suspicious (admin only or automated)
router.post('/:id/flag-suspicious', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Flagged as suspicious' } = req.body;
    
    // Only allow admin or device owner
    const device = await DeviceAccess.findOne({
      _id: id,
      $or: [
        { userId: req.user._id },
        ...(req.user.role === 'admin' ? [{}] : [])
      ]
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Mark as suspicious
    await device.markSuspicious(reason);
    
    // Log suspicious activity
    await AuditLog.logPrivacyAction(
      device.userId,
      'DEVICE_FLAGGED_SUSPICIOUS',
      {
        deviceId: device.deviceId,
        reason,
        flaggedBy: req.user._id
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: device.deviceId
      }
    );
    
    res.json({
      message: 'Device flagged as suspicious',
      device: {
        id: device._id,
        suspicious: device.suspicious,
        trustScore: device.trustScore,
        blockedReason: device.blockedReason
      }
    });
    
  } catch (error) {
    console.error('Flag suspicious device error:', error);
    res.status(500).json({ error: 'Failed to flag device as suspicious' });
  }
});

module.exports = router;