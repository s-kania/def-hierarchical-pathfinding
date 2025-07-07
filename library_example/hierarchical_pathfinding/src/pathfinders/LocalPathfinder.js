import { AlgorithmFactory } from '../algorithms/AlgorithmFactory.js';

/**
 * Local pathfinder for single chunk pathfinding
 * Uses dependency injection for algorithm selection
 */
export class LocalPathfinder {
    constructor(algorithm) {
        this.algorithm = algorithm;
    }

    /**
     * Create LocalPathfinder with algorithm factory
     * @param {string} algorithmType - Algorithm type
     * @param {string} heuristicName - Heuristic name
     * @param {number} heuristicWeight - Heuristic weight
     * @returns {LocalPathfinder} - LocalPathfinder instance
     */
    static create(algorithmType, heuristicName = 'manhattan', heuristicWeight = 1.0) {
        const algorithm = AlgorithmFactory.createAlgorithm(algorithmType, heuristicName, heuristicWeight);
        return new LocalPathfinder(algorithm);
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