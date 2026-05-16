function validateGoalWeightage(goals) {
    if (!Array.isArray(goals) || goals.length === 0) {
        throw new Error('At least one goal is required');
    }

    if (goals.length > 8) {
        throw new Error('Maximum 8 goals per employee allowed');
    }

    const totalWeight = goals.reduce((sum, g) => {
        const weight = parseFloat(g.weightage || 0);
        return sum + weight;
    }, 0);

    // Round to 2 decimal places for comparison
    const roundedTotal = Math.round(totalWeight * 100) / 100;

    if (roundedTotal !== 100) {
        throw new Error(`Total weightage is ${roundedTotal}%. Must be exactly 100%.`);
    }

    goals.forEach((g, index) => {
        const weight = parseFloat(g.weightage || 0);
        if (weight < 10) {
            throw new Error(`Goal ${index + 1}: Minimum weightage is 10%. Got ${weight}%.`);
        }
        if (weight > 100) {
            throw new Error(`Goal ${index + 1}: Maximum weightage is 100%. Got ${weight}%.`);
        }
    });

    return true;
}

function validateGoal(goal) {
    const requiredFields = ['title', 'thrust_area', 'uom_type', 'target', 'weightage'];
    
    for (const field of requiredFields) {
        if (!goal[field]) {
            throw new Error(`${field} is required`);
        }
    }

    const validUOMTypes = ['Numeric', 'Percentage', 'Timeline', 'Zero'];
    if (!validUOMTypes.includes(goal.uom_type)) {
        throw new Error(`Invalid UOM type. Must be one of: ${validUOMTypes.join(', ')}`);
    }

    const weight = parseFloat(goal.weightage);
    if (weight < 10 || weight > 100) {
        throw new Error(`Weightage must be between 10% and 100%`);
    }

    return true;
}

module.exports = { validateGoalWeightage, validateGoal };
