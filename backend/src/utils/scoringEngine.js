/**
 * Calculate progress score based on UoM type and direction
 * @param {string} uomType - Type of measurement (Numeric, Percentage, Timeline, Zero)
 * @param {string} uomDirection - Direction (Min/Max) for Numeric/Percentage
 * @param {number} target - Target value
 * @param {number|string} actual - Actual achieved value
 * @returns {number} Progress score (0-100)
 */
function calculateProgressScore(uomType, uomDirection, target, actual) {
    try {
        const targetNum = parseFloat(target);
        const actualNum = parseFloat(actual);

        if (isNaN(targetNum) || targetNum === 0) {
            return 0;
        }

        // Numeric type with direction Min (higher is better)
        if (uomType === 'Numeric' && uomDirection === 'Min') {
            const score = (actualNum / targetNum) * 100;
            return Math.min(Math.round(score * 100) / 100, 100);
        }

        // Numeric type with direction Max (lower is better)
        if (uomType === 'Numeric' && uomDirection === 'Max') {
            const score = (targetNum / actualNum) * 100;
            return Math.min(Math.round(score * 100) / 100, 100);
        }

        // Percentage type with direction Min
        if (uomType === 'Percentage' && uomDirection === 'Min') {
            const score = (actualNum / targetNum) * 100;
            return Math.min(Math.round(score * 100) / 100, 100);
        }

        // Percentage type with direction Max
        if (uomType === 'Percentage' && uomDirection === 'Max') {
            const score = (targetNum / actualNum) * 100;
            return Math.min(Math.round(score * 100) / 100, 100);
        }

        // Timeline type - check if deadline met
        if (uomType === 'Timeline') {
            const deadlineDate = new Date(target);
            const completionDate = new Date(actual);
            return completionDate <= deadlineDate ? 100 : 0;
        }

        // Zero type - 100 if zero, else 0
        if (uomType === 'Zero') {
            return actualNum === 0 ? 100 : 0;
        }

        return 0;
    } catch (error) {
        console.error('Scoring error:', error);
        return 0;
    }
}

/**
 * Format score with rounding
 */
function formatScore(score) {
    return Math.round(score * 100) / 100;
}

module.exports = { calculateProgressScore, formatScore };
