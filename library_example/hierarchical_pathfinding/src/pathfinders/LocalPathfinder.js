import { AStarAlgorithm } from '../algorithms/AStarAlgorithm.js';
import { JPSAlgorithm } from '../algorithms/JPSAlgorithm.js';

/**
 * Local pathfinder for single chunk pathfinding
 * Simplified version without dependency injection
 */
export class LocalPathfinder {
    constructor(algorithmType = 'astar', heuristicName = 'manhattan', heuristicWeight = 1.0) {
        this.algorithm = this.createAlgorithm(algorithmType, heuristicName, heuristicWeight);
    }

    /**
     * Create algorithm instance
     * @param {string} algorithmType - Algorithm type ('astar' or 'jps')
     * @param {string} heuristicName - Heuristic name
     * @param {number} heuristicWeight - Heuristic weight
     * @returns {Object} - Algorithm instance
     */
    createAlgorithm(algorithmType, heuristicName, heuristicWeight) {
        switch (algorithmType.toLowerCase()) {
            case 'astar':
            case 'a*':
                return new AStarAlgorithm(heuristicName, heuristicWeight);
            
            case 'jps':
            case 'jump point search':
                return new JPSAlgorithm(heuristicName, heuristicWeight);
            
            default:
                console.warn(`Unknown algorithm type '${algorithmType}', using A* as fallback`);
                return new AStarAlgorithm(heuristicName, heuristicWeight);
        }
    }

    /**
     * Find path within a single chunk
     * @param {Array} chunkData - 2D array of tiles (0=walkable, 1=blocked)
     * @param {Object} startPos - Start position {x, y}
     * @param {Object} endPos - End position {x, y}
     * @param {Object} config - Additional configuration
     * @returns {Array|null} - Array of positions or null
     */
    findPath(chunkData, startPos, endPos, config = {}) {
        return this.algorithm.findPath(chunkData, startPos, endPos, config);
    }

    /**
     * Get algorithm name
     * @returns {string} - Algorithm name
     */
    getAlgorithmName() {
        return this.algorithm.getName();
    }

    /**
     * Get heuristic name
     * @returns {string} - Heuristic name
     */
    getHeuristicName() {
        return this.algorithm.heuristic.getName();
    }

    /**
     * Get heuristic weight
     * @returns {number} - Heuristic weight
     */
    getHeuristicWeight() {
        return this.algorithm.heuristicWeight;
    }

    /**
     * Check if position is walkable
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} pos - Position {x, y}
     * @returns {boolean} - True if walkable
     */
    isWalkable(chunkData, pos) {
        return this.algorithm.isWalkable(chunkData, pos);
    }
} 