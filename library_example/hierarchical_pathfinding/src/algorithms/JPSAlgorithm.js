import { PathfindingAlgorithm } from './PathfindingAlgorithm.js';
import { HeuristicRegistry } from '../heuristics/HeuristicRegistry.js';

/**
 * Jump Point Search (JPS) algorithm implementation
 */
export class JPSAlgorithm extends PathfindingAlgorithm {
    constructor(heuristicName = 'manhattan', heuristicWeight = 1.0) {
        super();
        this.heuristic = HeuristicRegistry.get(heuristicName);
        this.heuristicWeight = heuristicWeight;
    }

    getName() {
        return 'jps';
    }

    findPath(chunkData, startPos, endPos, config = {}) {
        // Check if start and end are walkable
        if (!this.isWalkable(chunkData, startPos) || 
            !this.isWalkable(chunkData, endPos)) {
            return null;
        }

        // Same position
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            return [startPos];
        }

        // Structures for JPS
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
        fScore[startKey] = this.heuristic.calculate(startPos, endPos) * this.heuristicWeight;
        openList.push({ pos: startPos, f: fScore[startKey] });

        // Main JPS loop
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

            // Get jump points for current node
            const jumpPoints = this.getJumpPoints(chunkData, current.pos, endPos);

            for (const jumpPoint of jumpPoints) {
                const jumpKey = key(jumpPoint.pos);
                
                // Skip already visited
                if (closedSet.has(jumpKey)) continue;

                // Calculate cost (distance to jump point)
                const distance = this.calculateDistance(current.pos, jumpPoint.pos);
                const tentativeG = gScore[currentKey] + distance;

                // Check if this is a better path
                if (!(jumpKey in gScore) || tentativeG < gScore[jumpKey]) {
                    // Save path
                    cameFrom[jumpKey] = current.pos;
                    gScore[jumpKey] = tentativeG;
                    fScore[jumpKey] = tentativeG + this.heuristic.calculate(jumpPoint.pos, endPos) * this.heuristicWeight;

                    // Add to open list if not already there
                    if (!openList.some(n => n.pos.x === jumpPoint.pos.x && n.pos.y === jumpPoint.pos.y)) {
                        openList.push({ pos: jumpPoint.pos, f: fScore[jumpKey] });
                    }
                }
            }
        }

        // No path found
        return null;
    }

    /**
     * Get jump points for JPS algorithm
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} current - Current position
     * @param {Object} goal - Goal position
     * @returns {Array} - Array of jump points with positions and distances
     */
    getJumpPoints(chunkData, current, goal) {
        const jumpPoints = [];
        
        // 8 directions for JPS
        const directions = [
            { dx: 0, dy: -1 },  // North
            { dx: 1, dy: -1 },  // Northeast
            { dx: 1, dy: 0 },   // East
            { dx: 1, dy: 1 },   // Southeast
            { dx: 0, dy: 1 },   // South
            { dx: -1, dy: 1 },  // Southwest
            { dx: -1, dy: 0 },  // West
            { dx: -1, dy: -1 }  // Northwest
        ];

        for (const dir of directions) {
            const jumpPoint = this.findJumpPoint(chunkData, current, dir, goal);
            if (jumpPoint) {
                jumpPoints.push(jumpPoint);
            }
        }

        return jumpPoints;
    }

    /**
     * Find jump point in given direction
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} start - Start position
     * @param {Object} direction - Direction {dx, dy}
     * @param {Object} goal - Goal position
     * @returns {Object|null} - Jump point with position and distance
     */
    findJumpPoint(chunkData, start, direction, goal) {
        const { dx, dy } = direction;
        let current = { x: start.x + dx, y: start.y + dy };
        let distance = 1;

        // Check if initial step is walkable
        if (!this.isWalkable(chunkData, current)) {
            return null;
        }

        // Check if goal is reached
        if (current.x === goal.x && current.y === goal.y) {
            return { pos: current, distance };
        }

        // For diagonal movement, check if both cardinal directions are walkable
        if (dx !== 0 && dy !== 0) {
            const horizontalWalkable = this.isWalkable(chunkData, { x: start.x + dx, y: start.y });
            const verticalWalkable = this.isWalkable(chunkData, { x: start.x, y: start.y + dy });
            
            if (!horizontalWalkable || !verticalWalkable) {
                return null;
            }
        }

        // Jump in the direction until we hit an obstacle or find a jump point
        while (this.isWalkable(chunkData, current)) {
            // Check if this is a jump point (has forced neighbors)
            if (this.hasForcedNeighbors(chunkData, current, direction)) {
                return { pos: current, distance };
            }

            // Check if goal is reached
            if (current.x === goal.x && current.y === goal.y) {
                return { pos: current, distance };
            }

            // For diagonal movement, try to jump in cardinal directions
            if (dx !== 0 && dy !== 0) {
                // Try horizontal jump
                const horizontalJump = this.findJumpPoint(chunkData, current, { dx, dy: 0 }, goal);
                if (horizontalJump) {
                    return { pos: current, distance };
                }

                // Try vertical jump
                const verticalJump = this.findJumpPoint(chunkData, current, { dx: 0, dy }, goal);
                if (verticalJump) {
                    return { pos: current, distance };
                }
            }

            // Move to next position
            current = { x: current.x + dx, y: current.y + dy };
            distance++;
        }

        return null;
    }

    /**
     * Check if position has forced neighbors (simplified version)
     * @param {Array} chunkData - 2D array of tiles
     * @param {Object} pos - Position to check
     * @param {Object} direction - Current direction
     * @returns {boolean} - True if has forced neighbors
     */
    hasForcedNeighbors(chunkData, pos, direction) {
        // Simplified forced neighbor check
        // In a full JPS implementation, this would check for specific patterns
        // For now, we'll consider any position with diagonal movement as a potential jump point
        return direction.dx !== 0 && direction.dy !== 0;
    }

    /**
     * Calculate distance between two positions
     * @param {Object} a - First position
     * @param {Object} b - Second position
     * @returns {number} - Distance
     */
    calculateDistance(a, b) {
        const dx = Math.abs(b.x - a.x);
        const dy = Math.abs(b.y - a.y);
        
        if (dx === dy) {
            return dx * Math.SQRT2; // Diagonal movement
        } else {
            return dx + dy; // Manhattan distance
        }
    }
} 