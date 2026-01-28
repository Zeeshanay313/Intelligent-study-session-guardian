/**
 * Admin Routes
 * 
 * Protected routes for system administration
 * All routes require admin role authentication
 * 
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// ==================== DASHBOARD ====================

// GET /api/admin/dashboard - Get comprehensive dashboard statistics
router.get('/dashboard', getDashboardStats);

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users with pagination and filters
// Query params: ?page=1&limit=20&role=user|admin&deleted=true|false&search=keyword
router.get('/users', getAllUsers);

// POST /api/admin/users - Create new user
// Body: { email, password, displayName, role, verified, timezone, phoneNumber, ... }
router.post('/users', createUser);

// GET /api/admin/users/:id - Get single user with details
router.get('/users/:id', getUserById);

// PUT /api/admin/users/:id - Update user (including role changes, password, all profile fields)
// Body: { role, deleted, verified, displayName, email, password, timezone, phoneNumber, ... }
router.put('/users/:id', updateUser);

// POST /api/admin/users/:id/restore - Restore a soft-deleted user
router.post('/users/:id/restore', restoreUser);

// DELETE /api/admin/users/:id - Delete user
// Query params: ?permanent=true for hard delete
router.delete('/users/:id', deleteUser);

// ==================== GOAL MANAGEMENT ====================

// GET /api/admin/goals - Get all goals with pagination
// Query params: ?page=1&limit=20&userId=xxx&status=active|completed
router.get('/goals', getAllGoals);

// DELETE /api/admin/goals/:id - Delete goal
router.delete('/goals/:id', deleteGoal);

// ==================== SESSION MANAGEMENT ====================

// GET /api/admin/sessions - Get all sessions with pagination
// Query params: ?page=1&limit=20&userId=xxx
router.get('/sessions', getAllSessions);

// ==================== REWARD MANAGEMENT ====================

// GET /api/admin/rewards - Get all rewards
router.get('/rewards', getAllRewards);

// POST /api/admin/rewards - Create new reward
// Body: { name, description, type, category, icon, pointsValue, criteria, ... }
router.post('/rewards', createReward);

// PUT /api/admin/rewards/:id - Update reward
// Body: { name, description, isActive, ... }
router.put('/rewards/:id', updateReward);

// DELETE /api/admin/rewards/:id - Delete reward
router.delete('/rewards/:id', deleteReward);

// ==================== CHALLENGE MANAGEMENT ====================

// GET /api/admin/challenges - Get all challenges
// Query params: ?page=1&limit=20&status=active|upcoming|completed
router.get('/challenges', getAllChallenges);

// POST /api/admin/challenges - Create new challenge
// Body: { title, description, type, target, unit, startDate, endDate, rewards, ... }
router.post('/challenges', createChallenge);

// GET /api/admin/challenges/:id - Get challenge details
router.get('/challenges/:id', getChallengeById);

// PUT /api/admin/challenges/:id - Update challenge
router.put('/challenges/:id', updateChallenge);

// DELETE /api/admin/challenges/:id - Delete challenge
router.delete('/challenges/:id', deleteChallenge);

// ==================== RESOURCE MANAGEMENT ====================

// GET /api/admin/resources - Get all resources
// Query params: ?page=1&limit=20
router.get('/resources', getAllResources);

// DELETE /api/admin/resources/:id - Delete resource
router.delete('/resources/:id', deleteResource);

// ==================== AUDIT LOGS ====================

// GET /api/admin/audit-logs - Get audit logs
// Query params: ?page=1&limit=50&userId=xxx&action=xxx&category=xxx
router.get('/audit-logs', getAuditLogs);

// ==================== SYSTEM MANAGEMENT ====================

// GET /api/admin/system/stats - Get system statistics
router.get('/system/stats', getSystemStats);

// POST /api/admin/system/backup - Backup database
router.post('/system/backup', backupDatabase);

module.exports = router;
