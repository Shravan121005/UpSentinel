const mongoose = require('mongoose');

const pingResultSchema = new mongoose.Schema(
  {
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
      default: null,
    },
    latency: {
      type: Number,
      required: true,
      description: 'Response time in milliseconds',
    },
    region: {
      type: String,
      default: 'unknown',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Create compound index for efficient queries
pingResultSchema.index({ url: 1, timestamp: -1 });

module.exports = mongoose.model('PingResult', pingResultSchema);
