import { AStarAlgorithm } from './AStarAlgorithm.js';
import { JPSAlgorithm } from './JPSAlgorithm.js';

/**
 * Factory for creating pathfinding algorithms
 * Provides centralized access to all available algorithms
 */
export class AlgorithmFactory {
    /**
     * Create algorithm instance
     * @param {string} type - Algorithm type ('astar' or 'jps')
     * @param {string} heuristicName - Heuristic name
     * @param {number} heuristicWeight - Heuristic weight
     * @returns {PathfindingAlgorithm} - Algorithm instance
     */
    static createAlgorithm(type, heuristicName = 'manhattan', heuristicWeight = 1.0) {
        switch (type.toLowerCase()) {
            case 'astar':
            case 'a*':
                return new AStarAlgorithm(heuristicName, heuristicWeight);
            
            case 'jps':
            case 'jump point search':
                return new JPSAlgorithm(heuristicName, heuristicWeight);
            
            default:
                console.warn(`Unknown algorithm type '${type}', using A* as fallback`);
                return new AStarAlgorithm(heuristicName, heuristicWeight);
        }
    }

    /**
     * Get all available algorithm types
     * @returns {Array<string>} - Array of algorithm types
     */
    static getAvailableAlgorithms() {
        return ['astar', 'jps'];
    }

    /**
     * Check if algorithm type is supported
     * @param {string} type - Algorithm type
     * @returns {boolean} - True if supported
     */
    static isSupported(type) {
        return this.getAvailableAlgorithms().includes(type.toLowerCase());
    }

    /**
     * Get algorithm display name
     * @param {string} type - Algorithm type
     * @returns {string} - Display name
     */
    static getDisplayName(type) {
        switch (type.toLowerCase()) {
            case 'astar':
            case 'a*':
                return 'A* (A-Star)';
            
            case 'jps':
            case 'jump point search':
                return 'JPS (Jump Point Search)';
            
            default:
                return 'Unknown Algorithm';
        }
    }
} 