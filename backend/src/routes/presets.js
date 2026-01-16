const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset
} = require('../controllers/presetsController');

const router = express.Router();

// All preset routes require authentication
router.use(authenticate);

// GET /api/presets - Get all presets for current user
router.get('/', getPresets);

// POST /api/presets - Create a new preset
router.post('/', createPreset);

// PUT /api/presets/:id - Update a preset
router.put('/:id', updatePreset);

// DELETE /api/presets/:id - Delete a preset
router.delete('/:id', deletePreset);

module.exports = router;
