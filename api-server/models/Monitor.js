const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    url: {
      type: String,
      required: [true, 'Please provide a URL to monitor'],
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Please provide a valid URL',
      ],
    },
    interval: {
      type: Number,
      required: [true, 'Please provide an interval'],
      enum: {
        values: [60, 300, 600],
        message: 'Interval must be 1 min (60s), 5 min (300s), or 10 min (600s)',
      },
    },
    antiSleep: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Monitor', monitorSchema);
