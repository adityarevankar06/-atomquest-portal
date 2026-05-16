/**
 * Scoring Engine
 * Calculates progress_score (0–100) for a goal given an actual value.
 *
 * UoM types:
 *   Numeric / Percentage — direction-aware linear interpolation
 *   Timeline            — days early/on-time = 100; days late = 100 - days_late (min 0)
 *   Zero                — actual must be exactly 0 for score 100; any other value = 0
 */

function calculateScore(goal, actual) {
  const { uom_type, uom_direction, uom_target, uom_min, uom_max } = goal;

  switch (uom_type) {
    case 'Numeric':
    case 'Percentage':
      return scoreLinear(actual, uom_direction, uom_target, uom_min, uom_max);

    case 'Timeline':
      return scoreTimeline(actual, uom_target);

    case 'Zero':
      return scoreZero(actual);

    default:
      return 0;
  }
}

/**
 * Linear interpolation between min and target (Increase) or target and max (Decrease).
 * Clamped to [0, 100].
 */
function scoreLinear(actual, direction, target, min, max) {
  const a = parseFloat(actual);
  const t = parseFloat(target);
  const lo = parseFloat(min);
  const hi = parseFloat(max);

  if (isNaN(a) || isNaN(t)) return 0;

  if (direction === 'Increase') {
    if (isNaN(lo)) {
      // No min defined — any value >= target scores 100, below scores proportionally
      if (a >= t) return 100;
      return Math.max(0, Math.round((a / t) * 100));
    }
    if (a <= lo) return 0;
    if (a >= t) return 100;
    return Math.round(((a - lo) / (t - lo)) * 100);
  }

  // direction === 'Decrease'
  if (isNaN(hi)) {
    if (a <= t) return 100;
    return Math.max(0, Math.round((t / a) * 100));
  }
  if (a >= hi) return 0;
  if (a <= t) return 100;
  return Math.round(((hi - a) / (hi - t)) * 100);
}

/**
 * Timeline scoring.
 * actual is an ISO date string or YYYY-MM-DD.
 * Score = 100 if actual <= target date.
 * For every calendar day late, subtract 1 point (floor at 0).
 */
function scoreTimeline(actual, target) {
  const actualDate = new Date(actual);
  const targetDate = new Date(target);

  if (isNaN(actualDate.getTime()) || isNaN(targetDate.getTime())) return 0;

  const diffMs = actualDate.getTime() - targetDate.getTime();
  if (diffMs <= 0) return 100; // on time or early

  const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, 100 - daysLate);
}

/**
 * Zero-tolerance scoring.
 * Score = 100 only when actual is exactly 0; otherwise 0.
 */
function scoreZero(actual) {
  const a = parseFloat(actual);
  return a === 0 ? 100 : 0;
}

module.exports = { calculateScore, scoreLinear, scoreTimeline, scoreZero };
