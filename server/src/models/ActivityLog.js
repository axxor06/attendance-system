import mongoose from 'mongoose';
import { ACTIVITY_ACTION } from '../config/constants.js';

const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ACTIVITY_ACTION),
      required: true,
    },
    targetType: {
      // e.g. "User", "Subject", "Attendance"
      type: String,
      default: null,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
