import { PathfindingAlgorithm } from './PathfindingAlgorithm.js';
import { ManhattanHeuristic } from '../heuristics/ManhattanHeuristic.js';
import { EuclideanHeuristic } from '../heuristics/EuclideanHeuristic.js';

/**
 * Simple heuristic registry
 */
const HeuristicRegistry = {
    get: (heuristicName) => {
        switch (heuristicName.toLowerCase()) {
            case 'manhattan':
                return new ManhattanHeuristic();
            case 'euclidean':
                return new EuclideanHeuristic();
            default:
                console.warn(`Unknown heuristic '${heuristicName}', using Manhattan as fallback`);
                return new ManhattanHeuristic();
        }
    }
};

/**
 * A* pathfinding algorithm implementation
 */
export class AStarAlgorithm extends PathfindingAlgorithm {
    constructor(heuristicName = 'manhattan', heuristicWeight = 1.0) {
        super();
        this.heuristic = HeuristicRegistry.get(heuristicName);
        this.heuristicWeight = heuristicWeight;
    }

    getName() {
        return 'astar';
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
        fScore[startKey] = this.heuristic.calculate(startPos, endPos) * this.heuristicWeight;
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
                    fScore[neighborKey] = tentativeG + this.heuristic.calculate(neighbor, endPos) * this.heuristicWeight;

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
} 