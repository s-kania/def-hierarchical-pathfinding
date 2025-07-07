import { AStarAlgorithm } from '../algorithms/AStarAlgorithm.js';
import { JPSAlgorithm } from '../algorithms/JPSAlgorithm.js';
import { ManhattanHeuristic } from '../heuristics/ManhattanHeuristic.js';
import { EuclideanHeuristic } from '../heuristics/EuclideanHeuristic.js';

/**
 * Local pathfinder for single chunk pathfinding
 * Simplified version without dependency injection
 */
export class LocalPathfinder {
    constructor(algorithmType = 'astar', heuristicName = 'euclidean', heuristicWeight = 1.0) {
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
        // Create heuristic instance
        const heuristic = this.createHeuristic(heuristicName);
        
        switch (algorithmType.toLowerCase()) {
            case 'astar':
            case 'a*':
                return new AStarAlgorithm(heuristic, heuristicWeight);
            
            case 'jps':
            case 'jump point search':
                return new JPSAlgorithm(heuristic, heuristicWeight);
            
            default:
                throw new Error(`Unknown algorithm type: ${algorithmType}`);
        }
    }

    /**
     * Create heuristic instance
     * @param {string} heuristicName - Heuristic name
     * @returns {Object} - Heuristic instance
     */
    createHeuristic(heuristicName) {
        switch (heuristicName.toLowerCase()) {
            case 'manhattan':
                return new ManhattanHeuristic();
            case 'euclidean':
                return new EuclideanHeuristic();
            default:
                throw new Error(`Unknown heuristic: ${heuristicName}`);
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
} 