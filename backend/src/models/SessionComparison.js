const mongoose = require('mongoose');

const sessionComparisonSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    unique: true
  },
  comparisonData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SessionComparison', sessionComparisonSchema);
