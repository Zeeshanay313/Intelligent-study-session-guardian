const Preset = require('../models/Preset');

// Get all presets for authenticated user
const getPresets = async (req, res) => {
  try {
    const presets = await Preset.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch presets'
    });
  }
};

// Create new preset
const createPreset = async (req, res) => {
  try {
    const {
      name,
      subject,
      workDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak,
      icon,
      color,
      isDefault
    } = req.body;

    const preset = new Preset({
      userId: req.user._id,
      name,
      subject,
      workDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak,
      icon,
      color,
      isDefault: isDefault || false
    });

    await preset.save();

    res.status(201).json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create preset'
    });
  }
};

// Update preset
const updatePreset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      subject,
      workDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak,
      icon,
      color,
      isDefault
    } = req.body;

    const preset = await Preset.findOne({ _id: id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      });
    }

    if (name !== undefined) preset.name = name;
    if (subject !== undefined) preset.subject = subject;
    if (workDuration !== undefined) preset.workDuration = workDuration;
    if (breakDuration !== undefined) preset.breakDuration = breakDuration;
    if (longBreakDuration !== undefined) preset.longBreakDuration = longBreakDuration;
    if (cyclesBeforeLongBreak !== undefined) preset.cyclesBeforeLongBreak = cyclesBeforeLongBreak;
    if (icon !== undefined) preset.icon = icon;
    if (color !== undefined) preset.color = color;
    if (isDefault !== undefined) preset.isDefault = isDefault;

    await preset.save();

    res.json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preset'
    });
  }
};

// Delete preset
const deletePreset = async (req, res) => {
  try {
    const { id } = req.params;

    const preset = await Preset.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!preset) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      });
    }

    res.json({
      success: true,
      message: 'Preset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete preset'
    });
  }
};

module.exports = {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset
};
