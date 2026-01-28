/**
 * Admin Controller
 * 
 * Comprehensive admin panel for managing all system data
 * Only accessible by users with admin role
 * 
 * @author Intelligent Study Session Guardian Team
 */

const User = require('../models/User');
const Goal = require('../models/Goal');
const Reward = require('../models/Reward');
const UserRewards = require('../models/UserRewards');
const StudySession = require('../models/StudySession');
const SessionLog = require('../models/SessionLog');
const Preset = require('../models/Preset');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');
const CommunityChallenge = require('../models/CommunityChallenge');
const Resource = require('../models/Resource');
const MotivationalTip = require('../models/MotivationalTip');
const StudySchedule = require('../models/StudySchedule');
const Guardian = require('../models/Guardian');
const DeviceAccess = require('../models/DeviceAccess');

// ==================== DASHBOARD STATS ====================

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalGoals,
      completedGoals,
      totalSessions,
      totalStudyHours,
      recentUsers,
      topUsers,
      totalRewardsEarned,
      totalPointsEarned,
      systemHealth
    ] = await Promise.all([
      User.countDocuments({ deleted: false }),
      User.countDocuments({ deleted: false, lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ role: 'admin', deleted: false }),
      Goal.countDocuments({}),
      Goal.countDocuments({ status: 'completed' }),
      SessionLog.countDocuments({}),
      SessionLog.aggregate([
        { $group: { _id: null, total: { $sum: '$durationSeconds' } } }
      ]),
      User.find({ deleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email profile.displayName createdAt lastLogin'),
      UserRewards.find()
        .sort({ totalPoints: -1 })
        .limit(10)
        .populate('userId', 'email profile.displayName'),
      // Count total rewards earned across all users
      UserRewards.aggregate([
        { $unwind: { path: '$earnedRewards', preserveNullAndEmptyArrays: true } },
        { $count: 'total' }
      ]),
      // Sum total points earned
      UserRewards.aggregate([
        { $group: { _id: null, total: { $sum: '$totalPoints' } } }
      ]),
      {
        database: 'connected',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    ]);

    const totalStudyHoursValue = totalStudyHours.length > 0 ? totalStudyHours[0].total / 3600 : 0;
    const rewardsCount = totalRewardsEarned.length > 0 ? totalRewardsEarned[0].total : 0;
    const pointsTotal = totalPointsEarned.length > 0 ? totalPointsEarned[0].total : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers
        },
        goals: {
          total: totalGoals,
          completed: completedGoals,
          completionRate: totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(2) : 0
        },
        sessions: {
          total: totalSessions,
          totalHours: totalStudyHoursValue.toFixed(2)
        },
        rewards: {
          totalEarned: rewardsCount,
          totalPoints: pointsTotal
        },
        recentUsers,
        topUsers,
        systemHealth
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with pagination and filters
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      deleted,
      search
    } = req.query;

    const filter = {};
    
    if (role) filter.role = role;
    if (deleted !== undefined) filter.deleted = deleted === 'true';
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.displayName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens -verificationToken -resetPasswordToken')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

/**
 * Get single user details
 * @route GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's related data
    const [goals, sessions, rewards, settings] = await Promise.all([
      Goal.countDocuments({ userId: user._id }),
      SessionLog.countDocuments({ userId: user._id }),
      UserRewards.findOne({ userId: user._id }),
      Settings.findOne({ userId: user._id })
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: {
          goals,
          sessions,
          rewards: rewards?.totalPoints || 0,
          level: rewards?.currentLevel || 1
        },
        settings
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

/**
 * Update user (including role changes)
 * @route PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    console.log('Admin updateUser called with body:', req.body);
    console.log('User ID:', req.params.id);
    
    const { 
      role, 
      deleted, 
      verified,
      email,
      password,
      displayName,
      timezone,
      phoneNumber,
      dateOfBirth,
      studyLevel,
      institution,
      bio,
      theme,
      fontSize,
      language
    } = req.body;

    const updates = {};
    
    // Role and status updates
    if (role !== undefined) updates.role = role;
    if (deleted !== undefined) updates.deleted = deleted;
    if (verified !== undefined) updates.verified = verified;
    
    // Email update
    if (email) updates.email = email.toLowerCase();
    
    // Profile updates
    if (displayName !== undefined) updates['profile.displayName'] = displayName;
    if (timezone !== undefined) updates['profile.timezone'] = timezone;
    if (phoneNumber !== undefined) updates['profile.phoneNumber'] = phoneNumber;
    if (dateOfBirth !== undefined) updates['profile.dateOfBirth'] = dateOfBirth ? new Date(dateOfBirth) : null;
    if (studyLevel !== undefined) updates['profile.studyLevel'] = studyLevel;
    if (institution !== undefined) updates['profile.institution'] = institution;
    if (bio !== undefined) updates['profile.bio'] = bio;
    
    // Preferences updates
    if (theme !== undefined) updates['profile.preferences.theme'] = theme;
    if (fontSize !== undefined) updates['profile.preferences.fontSize'] = fontSize;
    if (language !== undefined) updates['profile.preferences.language'] = language;

    console.log('Updates to apply:', updates);

    // Handle password update separately (needs hashing)
    let user;
    if (password) {
      user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      user.password = password; // Will be hashed by pre-save middleware
      Object.keys(updates).forEach(key => {
        const keys = key.split('.');
        if (keys.length === 1) {
          user[key] = updates[key];
        } else if (keys.length === 2) {
          if (!user[keys[0]]) user[keys[0]] = {};
          user[keys[0]][keys[1]] = updates[key];
        } else if (keys.length === 3) {
          if (!user[keys[0]]) user[keys[0]] = {};
          if (!user[keys[0]][keys[1]]) user[keys[0]][keys[1]] = {};
          user[keys[0]][keys[1]][keys[2]] = updates[key];
        }
      });
      await user.save();
    } else {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove sensitive data from response
    const userResponse = user.toObject ? user.toObject() : user;
    delete userResponse.password;
    delete userResponse.refreshTokens;

    // Log admin action
    await AuditLog.create({
      userId: user._id,
      action: 'USER_UPDATED_BY_ADMIN',
      category: 'admin',
      details: {
        adminId: req.user._id,
        changes: Object.keys(updates)
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

/**
 * Delete user (soft or hard)
 * @route DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { permanent } = req.query;
    let message;

    if (permanent === 'true') {
      // Hard delete
      await User.findByIdAndDelete(req.params.id);
      message = 'User permanently deleted';
    } else {
      // Soft delete
      const user = await User.findById(req.params.id);
      if (user) {
        await user.softDelete();
      }
      message = 'User soft deleted';
    }

    // Log admin action
    await AuditLog.create({
      userId: req.params.id,
      action: permanent === 'true' ? 'USER_HARD_DELETED_BY_ADMIN' : 'USER_SOFT_DELETED_BY_ADMIN',
      category: 'admin',
      details: {
        adminId: req.user._id
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

/**
 * Create new user (admin only)
 * @route POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      displayName,
      role = 'user',
      verified = false,
      timezone = 'UTC',
      phoneNumber = '',
      dateOfBirth = null,
      studyLevel = '',
      institution = '',
      bio = '',
      theme = 'system',
      fontSize = 'medium',
      language = 'en'
    } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and display name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      role,
      verified,
      profile: {
        displayName,
        timezone,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        studyLevel,
        institution,
        bio,
        preferences: {
          theme,
          fontSize,
          language
        }
      },
      privacy: {
        cameraConsent: false,
        guardianSharing: false,
        notifications: {
          inApp: true,
          email: false,
          studyReminders: true,
          goalUpdates: true,
          achievementAlerts: true,
          breakReminders: true
        }
      },
      refreshTokens: [],
      loginCount: 0
    });

    await newUser.save();

    // Create initial settings for user
    await Settings.create({ userId: newUser._id });

    // Create initial rewards profile for user
    await UserRewards.create({ userId: newUser._id });

    // Log admin action
    await AuditLog.create({
      userId: newUser._id,
      action: 'USER_CREATED_BY_ADMIN',
      category: 'admin',
      details: {
        adminId: req.user._id,
        email: newUser.email,
        role: newUser.role
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Remove sensitive data from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: error.message
    });
  }
};

/**
 * Restore deleted user
 * @route POST /api/admin/users/:id/restore
 */
const restoreUser = async (req, res) => {
  try {
    console.log('Restoring user:', req.params.id);
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.log('User not found for restore:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found, deleted status:', user.deleted);
    
    if (!user.deleted) {
      return res.status(400).json({
        success: false,
        error: 'User is not deleted'
      });
    }

    // Restore the user
    user.deleted = false;
    user.deletedAt = null;
    user.deleteRequestedAt = null;
    await user.save();
    console.log('User restored successfully');

    // Log admin action
    await AuditLog.create({
      userId: user._id,
      action: 'USER_RESTORED_BY_ADMIN',
      category: 'admin',
      details: {
        adminId: req.user._id
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'User restored successfully',
      data: user
    });
  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore user'
    });
  }
};

// ==================== GOAL MANAGEMENT ====================

/**
 * Get all goals with pagination
 * @route GET /api/admin/goals
 */
const getAllGoals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      status
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [goals, total] = await Promise.all([
      Goal.find(filter)
        .populate('userId', 'email profile.displayName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Goal.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: goals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch goals'
    });
  }
};

/**
 * Delete goal
 * @route DELETE /api/admin/goals/:id
 */
const deleteGoal = async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete goal'
    });
  }
};

// ==================== SESSION MANAGEMENT ====================

/**
 * Get all sessions with pagination
 * @route GET /api/admin/sessions
 */
const getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      SessionLog.find(filter)
        .populate('userId', 'email profile.displayName')
        .sort({ startedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      SessionLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
};

// ==================== REWARD MANAGEMENT ====================

/**
 * Get all rewards
 * @route GET /api/admin/rewards
 */
const getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ displayOrder: 1 });

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Error getting rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards'
    });
  }
};

/**
 * Create new reward
 * @route POST /api/admin/rewards
 */
const createReward = async (req, res) => {
  try {
    const reward = new Reward(req.body);
    await reward.save();

    res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      data: reward
    });
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reward'
    });
  }
};

/**
 * Update reward
 * @route PUT /api/admin/rewards/:id
 */
const updateReward = async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!reward) {
      return res.status(404).json({
        success: false,
        error: 'Reward not found'
      });
    }

    res.json({
      success: true,
      message: 'Reward updated successfully',
      data: reward
    });
  } catch (error) {
    console.error('Error updating reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reward'
    });
  }
};

/**
 * Delete reward
 * @route DELETE /api/admin/rewards/:id
 */
const deleteReward = async (req, res) => {
  try {
    await Reward.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete reward'
    });
  }
};

// ==================== RESOURCE MANAGEMENT ====================

/**
 * Get all resources
 * @route GET /api/admin/resources
 */
const getAllResources = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resources, total] = await Promise.all([
      Resource.find()
        .populate('uploadedBy', 'email profile.displayName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Resource.countDocuments()
    ]);

    res.json({
      success: true,
      data: resources,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
};

/**
 * Delete resource
 * @route DELETE /api/admin/resources/:id
 */
const deleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource'
    });
  }
};

// ==================== AUDIT LOGS ====================

/**
 * Get audit logs
 * @route GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      category
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'email profile.displayName')
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
};

// ==================== SYSTEM MANAGEMENT ====================

/**
 * Get system statistics
 * @route GET /api/admin/system/stats
 */
const getSystemStats = async (req, res) => {
  try {
    const collections = [
      { name: 'users', model: User },
      { name: 'goals', model: Goal },
      { name: 'sessions', model: SessionLog },
      { name: 'rewards', model: Reward },
      { name: 'userRewards', model: UserRewards },
      { name: 'presets', model: Preset },
      { name: 'settings', model: Settings },
      { name: 'challenges', model: CommunityChallenge },
      { name: 'resources', model: Resource },
      { name: 'auditLogs', model: AuditLog }
    ];

    const counts = await Promise.all(
      collections.map(async ({ name, model }) => ({
        name,
        count: await model.countDocuments()
      }))
    );

    res.json({
      success: true,
      data: {
        collections: counts,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics'
    });
  }
};

/**
 * Backup database
 * @route POST /api/admin/system/backup
 */
const backupDatabase = async (req, res) => {
  try {
    // This is a placeholder - implement actual backup logic
    res.json({
      success: true,
      message: 'Backup initiated',
      note: 'Implement backup logic based on your infrastructure'
    });
  } catch (error) {
    console.error('Error backing up database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to backup database'
    });
  }
};

// ==================== CHALLENGE MANAGEMENT ====================

/**
 * Get all challenges
 * @route GET /api/admin/challenges
 */
const getAllChallenges = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const [challenges, total] = await Promise.all([
      CommunityChallenge.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CommunityChallenge.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: challenges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenges'
    });
  }
};

/**
 * Create new challenge
 * @route POST /api/admin/challenges
 */
const createChallenge = async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Calculate duration if not provided
    if (req.body.startDate && req.body.endDate && !req.body.duration) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      challengeData.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    
    const challenge = new CommunityChallenge(challengeData);
    await challenge.save();

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create challenge'
    });
  }
};

/**
 * Update challenge
 * @route PUT /api/admin/challenges/:id
 */
const updateChallenge = async (req, res) => {
  try {
    const challenge = await CommunityChallenge.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      message: 'Challenge updated successfully',
      data: challenge
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update challenge'
    });
  }
};

/**
 * Delete challenge
 * @route DELETE /api/admin/challenges/:id
 */
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await CommunityChallenge.findByIdAndDelete(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete challenge'
    });
  }
};

/**
 * Get challenge by ID
 * @route GET /api/admin/challenges/:id
 */
const getChallengeById = async (req, res) => {
  try {
    const challenge = await CommunityChallenge.findById(req.params.id)
      .populate('participants.userId', 'email profile.displayName');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error('Error getting challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenge'
    });
  }
};

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  
  // Goal Management
  getAllGoals,
  deleteGoal,
  
  // Session Management
  getAllSessions,
  
  // Reward Management
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  
  // Challenge Management
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  
  // Resource Management
  getAllResources,
  deleteResource,
  
  // Audit Logs
  getAuditLogs,
  
  // System Management
  getSystemStats,
  backupDatabase
};
