// ─── FIX 4: Decimal rounding in progress scores ──────────────────────────────
// Before: floating-point arithmetic produced scores like 84.99999999 or 100.00000001
//         which broke the ≤100 cap and displayed ugly numbers in the UI.
// After:  every score is rounded to 2 decimal places and hard-capped at 100.00.
//
// round2() is used on every return path — no NaN can leak through because
// parseFloat() of undefined/null/'' returns NaN, and NaN passed to Math.min
// returns NaN, so we guard with an explicit isNaN check on each input.

function round2(n) {
  // Guard: if somehow NaN slips through, return 0 instead of NaN
  if (isNaN(n) || !isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function capAt100(n) {
  return Math.min(round2(n), 100);
}

/**
 * calculateProgressScore
 *
 * @param {string} uomType   — 'Numeric' | 'Percentage' | 'Timeline' | 'Zero'
 * @param {string} direction — 'Min' | 'Max'  (ignored for Timeline and Zero)
 * @param {number|string} target
 * @param {number|string} actual
 * @param {string} [deadlineDate]  — ISO date string, required for Timeline
 * @returns {number} score 0–100 rounded to 2 decimal places
 */
function calculateProgressScore(uomType, direction, target, actual, deadlineDate) {
  const t = parseFloat(target);
  const a = parseFloat(actual);

  // Validate numeric inputs for types that need them
  const numericTypes = ['Numeric', 'Percentage'];
  if (numericTypes.includes(uomType)) {
    if (isNaN(t) || isNaN(a)) return 0;
    if (t === 0) return a === 0 ? 100 : 0; // avoid division by zero
  }

  switch (uomType) {
    case 'Numeric':
    case 'Percentage': {
      if (direction === 'Min') {
        // Higher actual is better: (actual / target) × 100
        return capAt100((a / t) * 100);
      }
      if (direction === 'Max') {
        // Lower actual is better: (target / actual) × 100
        if (a === 0) return 100; // achieved zero when minimising — perfect
        return capAt100((t / a) * 100);
      }
      // Unknown direction — return 0 rather than crash
      return 0;
    }

    case 'Timeline': {
      // 100 if actual completion date ≤ deadline, else 0
      if (!deadlineDate || !actual) return 0;
      const deadline  = new Date(deadlineDate);
      const completed = new Date(actual);
      if (isNaN(deadline.getTime()) || isNaN(completed.getTime())) return 0;
      return completed <= deadline ? 100 : 0;
    }

    case 'Zero': {
      // Must achieve exactly zero incidents / errors
      if (isNaN(a)) return 0;
      return round2(a) === 0 ? 100 : 0;
    }

    default:
      return 0;
  }
}

/**
 * calculateWeightedScore
 * Aggregates per-goal scores into one overall score.
 *
 * @param {Array<{ progressScore: number, weightage: number }>} goalsWithScores
 * @returns {number} weighted average 0–100 rounded to 2 decimal places
 */
function calculateWeightedScore(goalsWithScores) {
  if (!Array.isArray(goalsWithScores) || goalsWithScores.length === 0) return 0;

  let weightedSum  = 0;
  let totalWeight  = 0;

  for (const g of goalsWithScores) {
    const score  = parseFloat(g.progressScore);
    const weight = parseFloat(g.weightage);
    if (isNaN(score) || isNaN(weight)) continue;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return round2(weightedSum / totalWeight);
}

module.exports = { calculateProgressScore, calculateWeightedScore };
