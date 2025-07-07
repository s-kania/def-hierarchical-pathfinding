/**
 * Interface for pathfinding algorithms
 * All pathfinding algorithms must implement this interface
 */

export class PathfindingAlgorithm {
    /**
     * Find path between two positions
     * @param {Array} chunkData - 2D array of tiles (0=walkable, 1=blocked)
     * @param {Object} startPos - Start position {x, y}
     * @param {Object} endPos - End position {x, y}
     * @param {Object} config - Algorithm configuration
     * @returns {Array|null} - Array of positions or null if no path found
     */
    findPath(chunkData, startPos, endPos, config) {
        throw new Error('findPath method must be implemented by subclass');
    }

    /**
     * Get algorithm name
     * @returns {string} - Algorithm name
     */
    getName() {
        throw new Error('getName method must be implemented by subclass');
    }

    /**
     * Check if position is walkable
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} pos - Position {x, y}
     * @returns {boolean} - True if walkable
     */
    isWalkable(chunkData, pos) {
        // Check boundaries
        if (pos.x < 0 || pos.y < 0 || 
            pos.y >= chunkData.length || 
            pos.x >= chunkData[0].length) {
            return false;
        }
        
        // 0 = walkable, 1 = blocked
        return chunkData[pos.y][pos.x] === 0;
    }

    /**
     * Reconstruct path from predecessors map
     * @param {Object} cameFrom - Predecessors map
     * @param {Object} endPos - End position
     * @returns {Array} - Path of positions
     */
    reconstructPath(cameFrom, endPos) {
        const path = [];
        let current = endPos;
        
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            const key = `${current.x},${current.y}`;
            current = cameFrom[key];
        }
        
        return path;
    }
} 