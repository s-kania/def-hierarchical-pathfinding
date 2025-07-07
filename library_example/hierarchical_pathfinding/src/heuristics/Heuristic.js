/**
 * Interface for heuristic functions
 * All heuristics must implement this interface
 */

export class Heuristic {
    /**
     * Calculate heuristic value between two positions
     * @param {Object} a - First position {x, y}
     * @param {Object} b - Second position {x, y}
     * @returns {number} - Heuristic value
     */
    calculate(a, b) {
        throw new Error('calculate method must be implemented by subclass');
    }

    /**
     * Get heuristic name
     * @returns {string} - Heuristic name
     */
    getName() {
        throw new Error('getName method must be implemented by subclass');
    }

    /**
     * Check if heuristic is admissible (never overestimates)
     * @returns {boolean} - True if admissible
     */
    isAdmissible() {
        throw new Error('isAdmissible method must be implemented by subclass');
    }
} 