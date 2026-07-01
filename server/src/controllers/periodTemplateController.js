import asyncHandler from 'express-async-handler';
import { PeriodTemplate } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import sendResponse from '../utils/sendResponse.js';
import { logActivity } from '../services/activityLogService.js';
import { ACTIVITY_ACTION, DAYS_OF_WEEK } from '../config/constants.js';

/**
 * Creates (or replaces) the active period template for a given day of week.
 * Only one template may be active per day - if one already exists, it is
 * deactivated (not deleted) so historical attendance records still resolve
 * their periodName snapshot correctly.
 */
export const upsertPeriodTemplate = asyncHandler(async (req, res) => {
  const { dayOfWeek, periods } = req.body;

  if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
    throw ApiError.badRequest('Invalid day of week.');
  }

  if (!Array.isArray(periods) || periods.length === 0) {
    throw ApiError.badRequest('At least one period is required.');
  }

  // Deactivate any existing active template for this day.
  await PeriodTemplate.updateMany(
    { dayOfWeek, isActive: true },
    { isActive: false }
  );

  const template = await PeriodTemplate.create({
    dayOfWeek,
    periods,
    isActive: true,
    createdBy: req.user._id,
  });

  await logActivity({
    actorId: req.user._id,
    action: ACTIVITY_ACTION.CREATE,
    targetType: 'PeriodTemplate',
    targetId: template._id,
    description: `Configured periods for ${dayOfWeek}`,
  });

  return sendResponse(res, 201, `Period template for ${dayOfWeek} saved successfully`, {
    template,
  });
});

/**
 * Returns the currently active template for every day of the week
 * (days with no configured template are omitted, not error-padded).
 */
export const getActivePeriodTemplates = asyncHandler(async (req, res) => {
  const templates = await PeriodTemplate.find({ isActive: true }).sort({ dayOfWeek: 1 });

  // Sort by canonical week order rather than alphabetical.
  const ordered = DAYS_OF_WEEK
    .map((day) => templates.find((t) => t.dayOfWeek === day))
    .filter(Boolean);

  return sendResponse(res, 200, 'Active period templates fetched', { templates: ordered });
});

export const getPeriodTemplateByDay = asyncHandler(async (req, res) => {
  const { day } = req.params;
  if (!DAYS_OF_WEEK.includes(day)) {
    throw ApiError.badRequest('Invalid day of week.');
  }

  const template = await PeriodTemplate.findOne({ dayOfWeek: day, isActive: true });
  if (!template) {
    throw ApiError.notFound(`No active period template configured for ${day}.`);
  }

  return sendResponse(res, 200, 'Period template fetched', { template });
});

export const deactivatePeriodTemplate = asyncHandler(async (req, res) => {
  const template = await PeriodTemplate.findById(req.params.id);
  if (!template) throw ApiError.notFound('Period template not found');

  template.isActive = false;
  await template.save();

  return sendResponse(res, 200, 'Period template deactivated', { template });
});
