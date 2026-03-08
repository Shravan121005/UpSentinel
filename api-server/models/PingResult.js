const mongoose = require('mongoose');

const pingResultSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['UP', 'DOWN'],
    required: true,
  },
  statusCode: {
    type: Number,
  },
  latency: {
    type: Number,
  },
  region: {
    type: String,
    default: 'default',
  },
  errorMessage: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

pingResultSchema.index({ url: 1, timestamp: -1 });

module.exports = mongoose.model('PingResult', pingResultSchema);
