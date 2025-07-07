import { ManhattanHeuristic } from './ManhattanHeuristic.js';
import { EuclideanHeuristic } from './EuclideanHeuristic.js';
import { DiagonalHeuristic } from './DiagonalHeuristic.js';
import { OctileHeuristic } from './OctileHeuristic.js';

/**
 * Registry for heuristic functions
 * Provides centralized access to all available heuristics
 */
export class HeuristicRegistry {
    static #heuristics = new Map();

    /**
     * Initialize registry with default heuristics
     */
    static initialize() {
        this.register('manhattan', new ManhattanHeuristic());
        this.register('euclidean', new EuclideanHeuristic());
        this.register('diagonal', new DiagonalHeuristic());
        this.register('octile', new OctileHeuristic());
    }

    /**
     * Register a new heuristic
     * @param {string} name - Heuristic name
     * @param {Heuristic} heuristic - Heuristic instance
     */
    static register(name, heuristic) {
        this.#heuristics.set(name, heuristic);
    }

    /**
     * Get heuristic by name
     * @param {string} name - Heuristic name
     * @returns {Heuristic} - Heuristic instance
     */
    static get(name) {
        if (!this.#heuristics.has(name)) {
            console.warn(`Heuristic '${name}' not found, using 'manhattan' as fallback`);
            return this.#heuristics.get('manhattan');
        }
        return this.#heuristics.get(name);
    }

    /**
     * Get all available heuristic names
     * @returns {Array<string>} - Array of heuristic names
     */
    static getAvailableHeuristics() {
        return Array.from(this.#heuristics.keys());
    }

    /**
     * Check if heuristic exists
     * @param {string} name - Heuristic name
     * @returns {boolean} - True if heuristic exists
     */
    static has(name) {
        return this.#heuristics.has(name);
    }
}

// Initialize registry with default heuristics
HeuristicRegistry.initialize(); 