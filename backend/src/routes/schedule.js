/**
 * Study Schedule Routes
 *
 * API endpoints for managing user study schedules
 *
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const router = express.Router();
const StudySchedule = require('../models/StudySchedule');
const { authenticate } = require('../middleware/auth');

// GET /api/schedule - Get user's study schedule
router.get('/', authenticate, async (req, res) => {
  try {
    const schedule = await StudySchedule.getOrCreate(req.user._id);
    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// GET /api/schedule/day/:dayOfWeek - Get schedule for specific day
router.get('/day/:dayOfWeek', authenticate, async (req, res) => {
  try {
    const dayOfWeek = parseInt(req.params.dayOfWeek);
    
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Invalid day of week (0-6)' });
    }
    
    const schedule = await StudySchedule.getOrCreate(req.user._id);
    const daySchedule = schedule.getScheduleForDay(dayOfWeek);
    
    res.json({ success: true, data: daySchedule });
  } catch (error) {
    console.error('Get day schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch day schedule' });
  }
});

// POST /api/schedule/entry - Add new schedule entry
router.post('/entry', authenticate, async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      dayOfWeek,
      startTime,
      endTime,
      duration,
      isRecurring,
      recurrencePattern,
      goalId,
      presetId,
      reminderEnabled,
      reminderMinutesBefore,
      color,
      icon
    } = req.body;
    
    // Validate required fields
    if (!title || dayOfWeek === undefined || !startTime || !endTime || !duration) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, dayOfWeek, startTime, endTime, duration' 
      });
    }
    
    const schedule = await StudySchedule.getOrCreate(req.user._id);
    
    // Check for conflicts
    if (schedule.hasConflict(dayOfWeek, startTime, endTime)) {
      return res.status(409).json({ 
        error: 'Schedule conflict detected',
        message: 'Another entry exists at this time'
      });
    }
    
    const newEntry = {
      title,
      subject: subject || '',
      description: description || '',
      dayOfWeek,
      startTime,
      endTime,
      duration,
      isRecurring: isRecurring !== undefined ? isRecurring : true,
      recurrencePattern: recurrencePattern || 'weekly',
      goalId: goalId || null,
      presetId: presetId || null,
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
      reminderMinutesBefore: reminderMinutesBefore || 15,
      isActive: true,
      color: color || '#3B82F6',
      icon: icon || '📚'
    };
    
    schedule.entries.push(newEntry);
    schedule.calculateTotalHours();
    schedule.lastUpdated = new Date();
    
    await schedule.save();
    
    res.status(201).json({ 
      success: true, 
      data: schedule.entries[schedule.entries.length - 1],
      message: 'Schedule entry created successfully'
    });
  } catch (error) {
    console.error('Create schedule entry error:', error);
    res.status(500).json({ error: 'Failed to create schedule entry' });
  }
});

// PATCH /api/schedule/entry/:entryId - Update schedule entry
router.patch('/entry/:entryId', authenticate, async (req, res) => {
  try {
    const schedule = await StudySchedule.findOne({ userId: req.user._id });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const entry = schedule.entries.id(req.params.entryId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }
    
    // Check for conflicts if time is being changed
    if (req.body.startTime || req.body.endTime || req.body.dayOfWeek !== undefined) {
      const dayOfWeek = req.body.dayOfWeek !== undefined ? req.body.dayOfWeek : entry.dayOfWeek;
      const startTime = req.body.startTime || entry.startTime;
      const endTime = req.body.endTime || entry.endTime;
      
      if (schedule.hasConflict(dayOfWeek, startTime, endTime, req.params.entryId)) {
        return res.status(409).json({ 
          error: 'Schedule conflict detected',
          message: 'Another entry exists at this time'
        });
      }
    }
    
    // Update fields
    const allowedUpdates = [
      'title', 'subject', 'description', 'dayOfWeek', 'startTime', 'endTime',
      'duration', 'isRecurring', 'recurrencePattern', 'goalId', 'presetId',
      'reminderEnabled', 'reminderMinutesBefore', 'isActive', 'color', 'icon'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        entry[field] = req.body[field];
      }
    });
    
    schedule.calculateTotalHours();
    schedule.lastUpdated = new Date();
    
    await schedule.save();
    
    res.json({ 
      success: true, 
      data: entry,
      message: 'Schedule entry updated successfully'
    });
  } catch (error) {
    console.error('Update schedule entry error:', error);
    res.status(500).json({ error: 'Failed to update schedule entry' });
  }
});

// DELETE /api/schedule/entry/:entryId - Delete schedule entry
router.delete('/entry/:entryId', authenticate, async (req, res) => {
  try {
    const schedule = await StudySchedule.findOne({ userId: req.user._id });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const entry = schedule.entries.id(req.params.entryId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }
    
    entry.deleteOne();
    
    schedule.calculateTotalHours();
    schedule.lastUpdated = new Date();
    
    await schedule.save();
    
    res.json({ 
      success: true,
      message: 'Schedule entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule entry error:', error);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
});

// PATCH /api/schedule/settings - Update schedule settings
router.patch('/settings', authenticate, async (req, res) => {
  try {
    const { timezone, weekStartsOn } = req.body;
    
    const schedule = await StudySchedule.getOrCreate(req.user._id);
    
    if (timezone !== undefined) {
      schedule.timezone = timezone;
    }
    
    if (weekStartsOn !== undefined) {
      if (weekStartsOn < 0 || weekStartsOn > 6) {
        return res.status(400).json({ error: 'Invalid weekStartsOn value (0-6)' });
      }
      schedule.weekStartsOn = weekStartsOn;
    }
    
    schedule.lastUpdated = new Date();
    await schedule.save();
    
    res.json({ 
      success: true, 
      data: schedule,
      message: 'Schedule settings updated successfully'
    });
  } catch (error) {
    console.error('Update schedule settings error:', error);
    res.status(500).json({ error: 'Failed to update schedule settings' });
  }
});

// POST /api/schedule/bulk-import - Bulk import schedule entries
router.post('/bulk-import', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Invalid entries array' });
    }
    
    const schedule = await StudySchedule.getOrCreate(req.user._id);
    
    const imported = [];
    const conflicts = [];
    
    for (const entry of entries) {
      // Validate required fields
      if (!entry.title || entry.dayOfWeek === undefined || !entry.startTime || 
          !entry.endTime || !entry.duration) {
        continue;
      }
      
      // Check for conflicts
      if (schedule.hasConflict(entry.dayOfWeek, entry.startTime, entry.endTime)) {
        conflicts.push(entry);
        continue;
      }
      
      schedule.entries.push({
        title: entry.title,
        subject: entry.subject || '',
        description: entry.description || '',
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        isRecurring: entry.isRecurring !== undefined ? entry.isRecurring : true,
        recurrencePattern: entry.recurrencePattern || 'weekly',
        goalId: entry.goalId || null,
        presetId: entry.presetId || null,
        reminderEnabled: entry.reminderEnabled !== undefined ? entry.reminderEnabled : true,
        reminderMinutesBefore: entry.reminderMinutesBefore || 15,
        isActive: true,
        color: entry.color || '#3B82F6',
        icon: entry.icon || '📚'
      });
      
      imported.push(entry);
    }
    
    schedule.calculateTotalHours();
    schedule.lastUpdated = new Date();
    
    await schedule.save();
    
    res.json({ 
      success: true,
      data: {
        imported: imported.length,
        conflicts: conflicts.length,
        conflictingEntries: conflicts
      },
      message: `Imported ${imported.length} entries, ${conflicts.length} conflicts`
    });
  } catch (error) {
    console.error('Bulk import schedule error:', error);
    res.status(500).json({ error: 'Failed to import schedule entries' });
  }
});

module.exports = router;
