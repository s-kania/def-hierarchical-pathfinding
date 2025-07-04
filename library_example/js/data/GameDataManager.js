/**
 * GAME DATA MANAGEMENT - HIERARCHICAL PATHFINDING
 */

/**
 * GAME DATA MANAGER WITH TRANSITION POINT GRAPH
 */
export class GameDataManager {
    constructor(gridWidth, gridHeight, chunkWidth, chunkHeight) {
        this.gridWidth = gridWidth;       // Number of chunks horizontally
        this.gridHeight = gridHeight;     // Number of chunks vertically
        this.chunkWidth = chunkWidth;     // Chunk width in tiles (from settings)
        this.chunkHeight = chunkHeight;   // Chunk height in tiles (from settings)
        
        /**
         * TRANSITION POINTS - Array of transition points between chunks
         * Format of each point:
         * {
         *   id: string,           // "chunkA-chunkB-position" e.g. "0,0-1,0-15"
         *   chunks: [string],     // ["chunkA_id", "chunkB_id"] e.g. ["0,0", "1,0"]
         *   position: number,     // position on chunk edge (0-chunkSize-1)
         *   connections: [object] // [{id: "point_id", weight: number, chunk: "chunk_id"}] connections with weights and chunk
         * }
         */
        this.transitionPoints = [];
        
        /**
         * CHUNKS - Object of chunks where keys are chunk IDs, values are tiles
         * Format:
         * {
         *   "0,0": [[0,1,0,1], [1,0,0,1], ...],  // 2D array tiles (0=ocean, 1=land)
         *   "1,0": [[1,0,1,0], [0,1,1,0], ...],
         *   ...
         * }
         */
        this.chunks = {};
    }
    
    /**
     * ADDS TRANSITION POINT WITH ID GENERATION AND CONNECTIONS
     */
    addTransitionPoint(chunkA, chunkB, position) {
        // Normalize chunk ID format to commas
        const normalizeChunkId = (id) => id.replace('_', ',');
        chunkA = normalizeChunkId(chunkA);
        chunkB = normalizeChunkId(chunkB);
        
        // Generate unique ID in format "chunkA-chunkB-position"
        const [sortedA, sortedB] = this.sortChunks(chunkA, chunkB);
        const id = `${sortedA}-${sortedB}-${position}`;
        
        const transitionPoint = {
            id: id,
            chunks: [sortedA, sortedB],
            position: position,
            connections: []  // Will be filled by buildConnections
        };
        
        this.transitionPoints.push(transitionPoint);
        return transitionPoint;
    }
    
    /**
     * BUILDS CONNECTION GRAPH BETWEEN TRANSITION POINTS
     */
    buildConnections(chunks) {
        // Convert chunks array to object with chunk IDs as keys
        this.chunks = {};
        chunks.forEach(chunk => {
            this.chunks[chunk.id] = this.convertChunkTo2D(chunk);
        });
        
        // Clear previous connections
        this.transitionPoints.forEach(point => point.connections = []);
        
        // Group transition points by chunks
        const pointsByChunk = this.groupPointsByChunk();
        
        // For each chunk build connections between its transition points
        Object.entries(pointsByChunk).forEach(([chunkId, points]) => {
            if (points.length > 1) {
                this.buildChunkConnections(chunkId, points);
            }
        });
    }
    
    /**
     * CONVERTS CHUNK FROM 1D TILES ARRAY TO 2D FORMAT
     */
    convertChunkTo2D(chunk) {
        if (!chunk || !chunk.tiles) {
            return null;
        }
        
        // Check if already has 2D format
        if (Array.isArray(chunk.tiles[0])) {
            return chunk.tiles; // Return only tiles in 2D format
        }
        
        // Calculate chunkSize from tiles array (sqrt of length)
        const chunkSize = Math.sqrt(chunk.tiles.length);
        
        // Convert 1D → 2D
        const tiles2D = [];
        for (let y = 0; y < chunkSize; y++) {
            const row = [];
            for (let x = 0; x < chunkSize; x++) {
                const index = y * chunkSize + x;
                row.push(chunk.tiles[index]); // 0=ocean, 1=land
            }
            tiles2D.push(row);
        }
        
        return tiles2D; // Return only tiles in 2D format
    }
    
    /**
     * GROUPS TRANSITION POINTS BY CHUNKS
     */
    groupPointsByChunk() {
        const pointsByChunk = {};
        
        this.transitionPoints.forEach(point => {
            point.chunks.forEach(chunkId => {
                if (!pointsByChunk[chunkId]) {
                    pointsByChunk[chunkId] = [];
                }
                pointsByChunk[chunkId].push(point);
            });
        });
        
        return pointsByChunk;
    }
    
    /**
     * BUILDS CONNECTIONS WITHIN A SINGLE CHUNK USING A*
     */
    buildChunkConnections(chunkId, points) {
        const chunkTiles = this.chunks[chunkId];
        if (!chunkTiles) {
            return;
        }
        
        // For each pair of transition points in chunk check A* connection
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const pointA = points[i];
                const pointB = points[j];
                
                const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
                if (pathData) {
                    // Add bidirectional connection with weight and chunk information
                    const connectionA = {
                        id: pointB.id,
                        weight: pathData.weight,
                        chunk: chunkId
                    };
                    const connectionB = {
                        id: pointA.id,
                        weight: pathData.weight,
                        chunk: chunkId
                    };
                    
                    pointA.connections.push(connectionA);
                    pointB.connections.push(connectionB);
                }
            }
        }
    }
    
    /**
     * CHECKS IF TWO TRANSITION POINTS CAN BE CONNECTED WITH A* AND RETURNS WEIGHT
     */
    canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB) {
        // Calculate point positions in chunk
        const posA = this.getPointPositionInChunk(chunkId, pointA);
        const posB = this.getPointPositionInChunk(chunkId, pointB);
        
        if (!posA || !posB) {
            return null;
        }
        
        // Use A* to find path
        const path = this.findPathAStar(chunkTiles, posA, posB);
        if (path) {
            return {
                weight: path.length - 1, // Number of steps (nodes - 1)
                path: path
            };
        }
        
        return null;
    }
    
    /**
     * CHECKS IF TWO TRANSITION POINTS CAN BE CONNECTED WITH A* (OLD METHOD - COMPATIBILITY)
     */
    canConnectPoints(chunkTiles, chunkId, pointA, pointB) {
        const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
        return pathData !== null;
    }

    /**
     * CHECKS CONNECTION BETWEEN TRANSITION POINTS ON SPECIFIC CHUNK
     */
    checkConnectionOnChunk(chunkId, pointAId, pointBId) {
        // Check if chunk exists
        const chunkTiles = this.chunks[chunkId];
        if (!chunkTiles) {
            return {
                canConnect: false,
                error: `Chunk ${chunkId} does not exist`
            };
        }

        // Find transition points
        const pointA = this.getTransitionPointById(pointAId);
        const pointB = this.getTransitionPointById(pointBId);
        
        if (!pointA) {
            return {
                canConnect: false,
                error: `Transition point ${pointAId} does not exist`
            };
        }
        
        if (!pointB) {
            return {
                canConnect: false,
                error: `Transition point ${pointBId} does not exist`
            };
        }

        // Check if both points belong to this chunk
        if (!pointA.chunks.includes(chunkId)) {
            return {
                canConnect: false,
                error: `Point ${pointAId} does not belong to chunk ${chunkId}`
            };
        }
        
        if (!pointB.chunks.includes(chunkId)) {
            return {
                canConnect: false,
                error: `Point ${pointBId} does not belong to chunk ${chunkId}`
            };
        }

        // Check A* connection
        const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
        
        if (pathData) {
            return {
                canConnect: true,
                weight: pathData.weight,
                pathLength: pathData.path.length,
                chunk: chunkId,
                path: pathData.path
            };
        } else {
            return {
                canConnect: false,
                error: `No possible path between points on chunk ${chunkId}`
            };
        }
    }
    
    /**
     * CALCULATES TRANSITION POINT POSITION IN CHUNK (LOCAL COORDINATES)
     */
    getPointPositionInChunk(chunkId, point) {
        // Check if we have chunk dimension information
        if (!this.chunkWidth || !this.chunkHeight) {
            console.warn('GameDataManager: missing chunk dimension information');
            return null;
        }
        
        // Find which chunk edge contains this point
        const chunkCoords = this.parseChunkId(chunkId);
        const [chunkA, chunkB] = point.chunks.map(id => this.parseChunkId(id));
        
        // Determine position on chunk edge
        if (chunkA.x === chunkB.x) {
            // Vertical connection
            if (chunkA.y < chunkB.y) {
                // If this is chunk A (top)
                if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: point.position, y: this.chunkHeight - 1 };
                }
                // If this is chunk B (bottom)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: 0 };
                }
            } else {
                // If this is chunk B (top)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: this.chunkHeight - 1 };
                }
                // If this is chunk A (bottom)
                else if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: point.position, y: 0 };
                }
            }
        } else {
            // Horizontal connection
            if (chunkA.x < chunkB.x) {
                // If this is chunk A (left)
                if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: this.chunkWidth - 1, y: point.position };
                }
                // If this is chunk B (right)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: 0, y: point.position };
                }
            } else {
                // If this is chunk B (left)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: this.chunkWidth - 1, y: point.position };
                }
                // If this is chunk A (right)
                else if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: 0, y: point.position };
                }
            }
        }
        
        return null;
    }
    
    /**
     * A* ALGORITHM FOR FINDING PATH IN CHUNK
     */
    findPathAStar(chunkTiles, start, goal) {
        // Check if start and goal are on ocean
        if (!this.isOceanTile(chunkTiles, start.x, start.y) || 
            !this.isOceanTile(chunkTiles, goal.x, goal.y)) {
            return null;
        }
        
        const chunkSize = chunkTiles.length; // Chunk height
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${start.x},${start.y}`;
        const goalKey = `${goal.x},${goal.y}`;
        
        openSet.push({ x: start.x, y: start.y, f: 0 });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            openSet.sort((a, b) => fScore.get(`${a.x},${a.y}`) - fScore.get(`${b.x},${b.y}`));
            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;
            
            if (currentKey === goalKey) {
                // Path found
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            
            // Check neighbors
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Check if neighbor is within chunk bounds and on ocean
                if (neighbor.x < 0 || neighbor.x >= chunkSize ||
                    neighbor.y < 0 || neighbor.y >= chunkSize ||
                    !this.isOceanTile(chunkTiles, neighbor.x, neighbor.y) ||
                    closedSet.has(neighborKey)) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(currentKey) + 1;
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));
                    
                    if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null; // Path not found
    }
    
    /**
     * CHECKS IF TILE IS OCEAN
     */
    isOceanTile(chunkTiles, x, y) {
        if (!chunkTiles || !Array.isArray(chunkTiles)) {
            return false;
        }
        
        // Check bounds
        if (x < 0 || y < 0 || y >= chunkTiles.length || x >= chunkTiles[0].length) {
            return false;
        }
        
        // 2D format: chunkTiles[y][x]
        return chunkTiles[y][x] === 0;
    }
    
    /**
     * HEURISTIC FOR A* (MANHATTAN DISTANCE)
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    /**
     * GETS NODE NEIGHBORS
     */
    getNeighbors(node) {
        return [
            { x: node.x - 1, y: node.y },
            { x: node.x + 1, y: node.y },
            { x: node.x, y: node.y - 1 },
            { x: node.x, y: node.y + 1 }
        ];
    }
    
    /**
     * RECONSTRUCTS PATH FROM A*
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }
        
        return path;
    }
    
    /**
     * SORTS CHUNKS ALPHABETICALLY
     */
    sortChunks(chunkA, chunkB) {
        const a = this.parseChunkId(chunkA);
        const b = this.parseChunkId(chunkB);
        
        if (a.y < b.y || (a.y === b.y && a.x < b.x)) {
            return [chunkA, chunkB];
        } else {
            return [chunkB, chunkA];
        }
    }
    
    /**
     * GETS TRANSITION POINT BY ID
     */
    getTransitionPointById(id) {
        return this.transitionPoints.find(point => point.id === id);
    }
    
    /**
     * GETS ALL CONNECTIONS FOR TRANSITION POINT
     */
    getConnections(pointId) {
        const point = this.getTransitionPointById(pointId);
        return point ? point.connections : [];
    }
    
    /**
     * GETS ONLY CONNECTION IDS (WITHOUT WEIGHTS) - FOR COMPATIBILITY
     */
    getConnectionIds(pointId) {
        const connections = this.getConnections(pointId);
        return connections.map(conn => typeof conn === 'string' ? conn : conn.id);
    }
    
    /**
     * GETS CONNECTION WEIGHT BETWEEN TWO POINTS
     */
    getConnectionWeight(fromPointId, toPointId) {
        const connections = this.getConnections(fromPointId);
        const connection = connections.find(conn => 
            (typeof conn === 'string' ? conn : conn.id) === toPointId
        );
        
        if (connection && typeof connection === 'object' && connection.weight !== undefined) {
            return connection.weight;
        }
        
        // If no weight, return 1 as default
        return 1;
    }
    
    /**
     * CONVERTS TRANSITION POINTS TO DEFAULT FORMAT (FOR COMPATIBILITY)
     */
    convertTransitionPointsToDefault() {
        return this.transitionPoints.map(point => {
            const [a, b] = point.chunks.map(id => this.parseChunkId(id));
            
            // Use chunk dimensions from GameDataManager
            const chunkWidth = this.chunkWidth || 11;   // fallback to 11
            const chunkHeight = this.chunkHeight || 11; // fallback to 11
            
            // Deduce direction from chunk positions
            const direction = a.x === b.x ? 'vertical' : 'horizontal';
            
            // Calculate global coordinates
            let globalX, globalY;
            if (direction === 'vertical') {
                globalX = a.x * chunkWidth + point.position;
                globalY = a.y * chunkHeight + chunkHeight;
            } else {
                globalX = a.x * chunkWidth + chunkWidth;
                globalY = a.y * chunkHeight + point.position;
            }
            
            return {
                id: point.id,
                chunkA: point.chunks[0],
                chunkB: point.chunks[1],
                x: globalX,
                y: globalY,
                direction: direction,
                segmentLength: 1,
                pixelX: 0,
                pixelY: 0,
                connections: point.connections
            };
        });
    }
    
    /**
     * PARSES CHUNK ID TO COORDINATES
     */
    parseChunkId(chunkId) {
        // Handle both formats: "1_0" and "1,0"
        const separator = chunkId.includes(',') ? ',' : '_';
        const [x, y] = chunkId.split(separator).map(Number);
        return { x, y };
    }
    
    /**
     * GETS CHUNK DATA IN 2D FORMAT FOR HIERARCHICAL PATHFINDING
     */
    getChunkData(chunkId) {
        // Normalize ID format to commas
        const normalizedId = chunkId.replace('_', ',');
        return this.chunks[normalizedId] || null;
    }
    
    /**
     * DISPLAYS ALL CONNECTIONS FOR SPECIFIC TRANSITION POINT
     */
    printPointConnections(pointId) {
        const point = this.getTransitionPointById(pointId);
        if (!point) {
            console.error(`❌ Transition point ${pointId} does not exist`);
            return;
        }

        console.log(`\n=== CONNECTIONS OF POINT ${pointId} ===`);
        console.log(`📍 Chunks: [${point.chunks.join(', ')}]`);
        console.log(`📐 Position: ${point.position}`);
        console.log(`🔗 Number of connections: ${point.connections.length}`);
        
        if (point.connections.length === 0) {
            console.log('❌ No connections');
            return;
        }

        // Group connections by chunks
        const connectionsByChunk = {};
        point.connections.forEach(conn => {
            const chunk = conn.chunk || 'unknown';
            if (!connectionsByChunk[chunk]) {
                connectionsByChunk[chunk] = [];
            }
            connectionsByChunk[chunk].push(conn);
        });

        // Display connections grouped by chunks
        Object.entries(connectionsByChunk).forEach(([chunk, connections]) => {
            console.log(`\n📦 Chunk: ${chunk}`);
            connections.forEach(conn => {
                console.log(`  → ${conn.id} (weight: ${conn.weight})`);
            });
        });
        
        console.log('===============================\n');
    }

    /**
     * PRINTS GRAPH STATISTICS
     */
    printGraphStats() {
        // Function preserved for compatibility, but without logging
    }
} 