/**
 * Local pathfinding within a single chunk using A*
 * Finds paths on water tiles (0) avoiding land (1)
 */

export class LocalPathfinder {
    /**
     * Check if position is walkable (water)
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} pos - Position {x, y}
     * @returns {boolean}
     */
    static isWalkable(chunkData, pos) {
        // Check boundaries
        if (pos.x < 0 || pos.y < 0 || 
            pos.y >= chunkData.length || 
            pos.x >= chunkData[0].length) {
            return false;
        }
        
        // 0 = water (walkable), 1 = land (not walkable)
        return chunkData[pos.y][pos.x] === 0;
    }

    /**
     * Find path using A*
     * @param {Array} chunkData - 2D array of tiles (0=water, 1=land)
     * @param {Object} startPos - Start {x, y}
     * @param {Object} endPos - End {x, y}
     * @returns {Array|null} - Array of positions or null
     */
    static findPath(chunkData, startPos, endPos) {
        // Check if start and end are walkable
        if (!this.isWalkable(chunkData, startPos) || 
            !this.isWalkable(chunkData, endPos)) {
            return null;
        }

        // Same position
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            return [startPos];
        }

        // Structures for A*
        const openList = [];
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        // Helper for keys
        const key = (pos) => `${pos.x},${pos.y}`;

        // Initialize start
        const startKey = key(startPos);
        gScore[startKey] = 0;
        fScore[startKey] = this.heuristic(startPos, endPos);
        openList.push({ pos: startPos, f: fScore[startKey] });

        // Main A* loop
        while (openList.length > 0) {
            // Find node with lowest f-score
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();
            const currentKey = key(current.pos);

            // Found the goal!
            if (current.pos.x === endPos.x && current.pos.y === endPos.y) {
                return this.reconstructPath(cameFrom, endPos);
            }

            closedSet.add(currentKey);

            // Check neighbors (4 directions)
            const neighbors = [
                { x: current.pos.x, y: current.pos.y - 1 }, // Up
                { x: current.pos.x, y: current.pos.y + 1 }, // Down
                { x: current.pos.x - 1, y: current.pos.y }, // Left
                { x: current.pos.x + 1, y: current.pos.y }   // Right
            ];

            for (const neighbor of neighbors) {
                // Skip unwalkable
                if (!this.isWalkable(chunkData, neighbor)) continue;

                const neighborKey = key(neighbor);
                
                // Skip already visited
                if (closedSet.has(neighborKey)) continue;

                // Calculate cost
                const tentativeG = gScore[currentKey] + 1;

                // Check if this is a better path
                if (!(neighborKey in gScore) || tentativeG < gScore[neighborKey]) {
                    // Save path
                    cameFrom[neighborKey] = current.pos;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this.heuristic(neighbor, endPos);

                    // Add to open list if not already there
                    if (!openList.some(n => n.pos.x === neighbor.x && n.pos.y === neighbor.y)) {
                        openList.push({ pos: neighbor, f: fScore[neighborKey] });
                    }
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Heuristic - Manhattan distance
     * @param {Object} a - Position {x, y}
     * @param {Object} b - Position {x, y}
     * @returns {number} - Distance
     */
    static heuristic(a, b) {
        return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    }

    /**
     * Reconstruct path from predecessors map
     * @param {Object} cameFrom - Predecessors map
     * @param {Object} endPos - End position
     * @returns {Array} - Path of positions
     */
    static reconstructPath(cameFrom, endPos) {
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