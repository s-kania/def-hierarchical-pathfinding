/**
 * Transition points graph for hierarchical pathfinding
 * Minimal A* implementation on pre-computed connections graph
 */

/**
 * Simple Min Heap implementation for A*
 */
class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(element) {
        this.heap.push(element);
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        
        const min = this.heap[0];
        const end = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        
        return min;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].f >= this.heap[parentIndex].f) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < this.heap.length && this.heap[leftChild].f < this.heap[smallest].f) {
                smallest = leftChild;
            }

            if (rightChild < this.heap.length && this.heap[rightChild].f < this.heap[smallest].f) {
                smallest = rightChild;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }
}

export class TransitionGraph {
    constructor(transitionPoints, gridConfig = null) {
        // Store points and their connections
        this.points = new Map(); // id -> point
        this.graph = new Map();  // id -> connections
        this.gridConfig = gridConfig;
        
        // Build data structures
        for (const point of transitionPoints) {
            this.points.set(point.id, point);
            this.graph.set(point.id, point.connections || []);
        }
    }
    
    /**
     * Main function - find path between points using A*
     * @param {string} startId - Start point ID
     * @param {string} endId - End point ID
     * @returns {Array|null} - Array of point IDs or null
     */
    findPath(startId, endId) {
        // Trivial case
        if (startId === endId) {
            return [startId];
        }
        
        // Check if points exist
        if (!this.points.has(startId) || !this.points.has(endId)) {
            return null;
        }
        
        // A* implementation
        const openSet = new MinHeap();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        
        // Initialize start
        gScore.set(startId, 0);
        openSet.push({ 
            id: startId, 
            f: this.heuristic(startId, endId) 
        });
        
        let iterations = 0;
        const maxIterations = 1000; // protection against infinite loop
        
        // Main A* loop
        while (!openSet.isEmpty() && iterations < maxIterations) {
            iterations++;
            const current = openSet.pop();
            
            // Found the goal!
            if (current.id === endId) {
                const path = this.reconstructPath(cameFrom, endId);
                return path;
            }
            
            closedSet.add(current.id);
            
            // Check all connections
            const connections = this.graph.get(current.id) || [];
            
            for (const connection of connections) {
                const neighbor = connection.id;
                const weight = connection.weight || 1;
                
                // Skip already visited
                if (closedSet.has(neighbor)) {
                    continue;
                }
                
                // Calculate new cost
                const currentG = gScore.get(current.id) || 0;
                const tentativeG = currentG + weight;
                
                // Check if we have a better path
                const existingG = gScore.get(neighbor);
                if (existingG !== undefined && tentativeG >= existingG) {
                    continue;
                }
                
                // Update path
                cameFrom.set(neighbor, current.id);
                gScore.set(neighbor, tentativeG);
                
                const heuristicValue = this.heuristic(neighbor, endId);
                const fScore = tentativeG + heuristicValue;
                
                // Add to priority queue
                openSet.push({
                    id: neighbor,
                    f: fScore
                });
            }
        }
        
        // No path found
        return null;
    }
    
    /**
     * Get transition points in a given chunk
     * @param {string} chunkId - Chunk ID
     * @returns {Array} - Array of points
     */
    getPointsInChunk(chunkId) {
        const result = [];
        for (const [id, point] of this.points) {
            if (point.chunks.includes(chunkId)) {
                result.push(point);
            }
        }
        return result;
    }
    
    /**
     * Get point by ID
     * @param {string} pointId - Point ID
     * @returns {Object|null} - Point or null
     */
    getPoint(pointId) {
        return this.points.get(pointId) || null;
    }
    
    /**
     * Heuristic for A* - Manhattan distance between chunks
     * @param {string} pointId1 - First point ID
     * @param {string} pointId2 - Second point ID
     * @returns {number} - Estimated distance
     */
    heuristic(pointId1, pointId2) {
        const point1 = this.points.get(pointId1);
        const point2 = this.points.get(pointId2);
        
        if (!point1 || !point2) {
            return 0;
        }
        
        // Use first chunk from each point
        const chunk1 = this.parseChunkId(point1.chunks[0]);
        const chunk2 = this.parseChunkId(point2.chunks[0]);
        
        // Manhattan distance in chunks
        const chunkDistance = Math.abs(chunk2.x - chunk1.x) + Math.abs(chunk2.y - chunk1.y);
        
        // Scale if we have configuration
        if (this.gridConfig) {
            const scale = (this.gridConfig.chunkSize * this.gridConfig.tileSize) * 0.5;
            return chunkDistance * scale;
        }
        
        return chunkDistance;
    }
    
    /**
     * Reconstruct path from predecessors map
     * @param {Map} cameFrom - Predecessors map
     * @param {string} endId - End ID
     * @returns {Array} - Path of point IDs
     */
    reconstructPath(cameFrom, endId) {
        const path = [endId];
        let currentId = endId;
        
        while (cameFrom.has(currentId)) {
            currentId = cameFrom.get(currentId);
            path.unshift(currentId);
        }
        
        return path;
    }
    
    /**
     * Parse chunk ID to coordinates
     * @param {string} chunkId - ID in format "x,y"
     * @returns {Object} - {x, y}
     */
    parseChunkId(chunkId) {
        const [x, y] = chunkId.split(',').map(Number);
        return { x, y };
    }
} 