// ---------------------------------------------------------------------------
// Weightage Validation Utility
// All rules from the BRD:
//   - Max 8 goals per employee
//   - Min 10% per goal
//   - Total of ALL employee goals must equal exactly 100%
// ---------------------------------------------------------------------------

const VALID_UOM_TYPES  = ['Numeric', 'Percentage', 'Timeline', 'Zero'];
const VALID_DIRECTIONS = ['Min', 'Max'];
const MAX_GOALS        = 8;
const MIN_WEIGHT       = 10;
const TOTAL_WEIGHT     = 100;

/**
 * Validate the full set of goals for an employee.
 * Call this before saving any new / updated batch.
 *
 * @param {Array}  incomingGoals  - goals being added or replacing existing ones
 * @param {Array}  existingGoals  - goals already saved for this employee (default [])
 * @param {string} mode           - 'create' | 'update'
 */
function validateGoalWeightage(incomingGoals, existingGoals = [], mode = 'create') {
    if (!Array.isArray(incomingGoals) || incomingGoals.length === 0) {
        throw new Error('At least one goal is required.');
    }

    // When creating, the combined count must not exceed 8
    if (mode === 'create') {
        const combined = existingGoals.length + incomingGoals.length;
        if (combined > MAX_GOALS) {
            throw new Error(
                `Cannot add ${incomingGoals.length} goal(s). You already have ${existingGoals.length} goal(s). ` +
                `Maximum allowed is ${MAX_GOALS}.`
            );
        }
    }

    // Per-goal minimum weight
    incomingGoals.forEach((g, i) => {
        const w = parseFloat(g.weightage ?? 0);
        if (w < MIN_WEIGHT) {
            throw new Error(`Goal ${i + 1} ("${g.title || 'Untitled'}"): minimum weightage is ${MIN_WEIGHT}%. Got ${w}%.`);
        }
        if (w > TOTAL_WEIGHT) {
            throw new Error(`Goal ${i + 1} ("${g.title || 'Untitled'}"): weightage cannot exceed ${TOTAL_WEIGHT}%. Got ${w}%.`);
        }
    });

    // Total across ALL employee goals must equal 100%
    // For 'create': sum incoming + existing
    // For 'update': existing already has the updated goal replaced, so just sum all
    const allGoals = mode === 'create'
        ? [...existingGoals, ...incomingGoals]
        : incomingGoals; // caller passes the full merged set for update

    const total = allGoals.reduce((sum, g) => sum + parseFloat(g.weightage ?? 0), 0);
    const rounded = Math.round(total * 100) / 100;

    if (rounded !== TOTAL_WEIGHT) {
        throw new Error(
            `Total weightage across all your goals is ${rounded}%. Must be exactly ${TOTAL_WEIGHT}%.`
        );
    }

    return true;
}

/**
 * Validate a single goal's required fields and field values.
 * Used for POST (full validation) and PUT (partial allowed).
 *
 * @param {object}  goal      - goal payload from request body
 * @param {boolean} partial   - true = PUT (only validate fields that are present)
 */
function validateGoal(goal, partial = false) {
    if (!partial) {
        // Full validation for POST — all fields mandatory
        const requiredFields = ['title', 'thrust_area', 'uom_type', 'target', 'weightage'];
        for (const field of requiredFields) {
            if (goal[field] === undefined || goal[field] === null || goal[field] === '') {
                throw new Error(`'${field}' is required.`);
            }
        }
    }

    // Validate fields only if they are present in the payload
    if (goal.title !== undefined) {
        if (typeof goal.title !== 'string' || goal.title.trim() === '') {
            throw new Error("'title' must be a non-empty string.");
        }
        if (goal.title.trim().length > 200) {
            throw new Error("'title' must not exceed 200 characters.");
        }
    }

    if (goal.uom_type !== undefined) {
        if (!VALID_UOM_TYPES.includes(goal.uom_type)) {
            throw new Error(`'uom_type' must be one of: ${VALID_UOM_TYPES.join(', ')}.`);
        }
    }

    if (goal.uom_direction !== undefined) {
        if (!VALID_DIRECTIONS.includes(goal.uom_direction)) {
            throw new Error(`'uom_direction' must be one of: ${VALID_DIRECTIONS.join(', ')}.`);
        }
    }

    if (goal.target !== undefined) {
        const t = parseFloat(goal.target);
        if (isNaN(t)) {
            throw new Error("'target' must be a valid number.");
        }
    }

    if (goal.weightage !== undefined) {
        const w = parseFloat(goal.weightage);
        if (isNaN(w) || w < MIN_WEIGHT || w > TOTAL_WEIGHT) {
            throw new Error(`'weightage' must be between ${MIN_WEIGHT} and ${TOTAL_WEIGHT}.`);
        }
    }

    return true;
}

module.exports = { validateGoalWeightage, validateGoal, MAX_GOALS, MIN_WEIGHT, VALID_UOM_TYPES };
