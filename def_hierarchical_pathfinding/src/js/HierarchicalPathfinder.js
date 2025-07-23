import { CoordUtils } from './CoordUtils.js';
import { PathSegmentBuilder } from './PathSegmentBuilder.js';

/**
 * Main hierarchical pathfinding class
 * Orchestrates local and hierarchical pathfinding using injected algorithms
 */
export class HierarchicalPathfinder {
    constructor() {
        this.config = null;
        this.localAlgorithmFn = null;
        this.hierarchicalAlgorithmFn = null;
        this.segmentBuilder = null;
    }

    /**
     * Initialize the pathfinding system
     * @param {Object} config - Configuration object
     */
    init(config) {
        // Validate configuration
        this.validateConfig(config);
        
        this.config = config;
        this.localAlgorithmFn = config.localAlgorithmFn;
        this.hierarchicalAlgorithmFn = config.hierarchicalAlgorithmFn;
        
        // Create segment builder
        this.segmentBuilder = new PathSegmentBuilder(config, this);
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration object
     * @throws {Error} If configuration is invalid
     */
    validateConfig(config) {
        if (!config) {
            throw new Error('Configuration is required');
        }
        
        if (!config.tileSize || config.tileSize <= 0) {
            throw new Error('tileSize must be positive');
        }
        
        if (!config.gridWidth || config.gridWidth <= 0) {
            throw new Error('gridWidth must be positive');
        }
        
        if (!config.gridHeight || config.gridHeight <= 0) {
            throw new Error('gridHeight must be positive');
        }
        
        if (!config.chunkWidth || config.chunkWidth <= 0) {
            throw new Error('chunkWidth must be positive');
        }
        
        if (!config.chunkHeight || config.chunkHeight <= 0) {
            throw new Error('chunkHeight must be positive');
        }
        
        if (typeof config.getChunkData !== 'function') {
            throw new Error('getChunkData must be a function');
        }
        
        if (!Array.isArray(config.transitionPoints)) {
            throw new Error('transitionPoints must be an array');
        }
        
        if (typeof config.localAlgorithmFn !== 'function') {
            throw new Error('localAlgorithmFn must be a function');
        }
        
        if (typeof config.hierarchicalAlgorithmFn !== 'function') {
            throw new Error('hierarchicalAlgorithmFn must be a function');
        }
    }

    /**
     * Find path from start position to end position
     * @param {Object} startPos - Start position {x, y} in world units
     * @param {Object} endPos - End position {x, y} in world units
     * @returns {Array|null} - Array of segments [{chunk, position}] or null
     */
    findPath(startPos, endPos) {
        if (!this.config) {
            throw new Error("Pathfinder has not been initialized");
        }

        // Validate input parameters
        this.validatePositions(startPos, endPos);

        // Check if positions are within world bounds
        if (!this.arePositionsInBounds(startPos, endPos)) {
            return null;
        }

        // Determine which chunks contain start and end
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.chunkHeight, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.chunkHeight, this.config.tileSize);

        // If same chunk - try local pathfinding first
        if (startChunk === endChunk) {
            const localPath = this.findLocalPath(startChunk, startPos, endPos);
            if (localPath) {
                return localPath;
            }
            // If not, allow continuation to hierarchical search.
            // It may happen that points are in the same chunk, but in separate,
            // unconnected areas, so we need to go outside.
        }

        // Different chunks (or same chunk without local path) - search through transition points
        const startPoint = this.findNearestTransition(startPos, startChunk);
        const endPoint = this.findNearestTransition(endPos, endChunk);

        if (!startPoint || !endPoint) {
            return null; // No available transition points
        }
        
        const transitionPath = this.findTransitionPath(startPoint.id, endPoint.id);

        if (!transitionPath) {
            return null; // No path between chunks
        }

        // Build final path segments
        const segments = this.segmentBuilder.buildSegments(startPos, endPos, transitionPath);
        
        return segments;
    }

    /**
     * Validate input positions
     * @param {Object} startPos - Start position
     * @param {Object} endPos - End position
     * @throws {Error} If positions are invalid
     */
    validatePositions(startPos, endPos) {
        if (!startPos || typeof startPos.x !== 'number' || typeof startPos.y !== 'number') {
            throw new Error('Invalid startPos: must be {x: number, y: number}');
        }
        if (!endPos || typeof endPos.x !== 'number' || typeof endPos.y !== 'number') {
            throw new Error('Invalid endPos: must be {x: number, y: number}');
        }
    }

    /**
     * Check if positions are within world bounds
     * @param {Object} startPos - Start position
     * @param {Object} endPos - End position
     * @returns {boolean} - True if positions are in bounds
     */
    arePositionsInBounds(startPos, endPos) {
        const worldWidth = this.config.gridWidth * this.config.chunkWidth * this.config.tileSize;
        const worldHeight = this.config.gridHeight * this.config.chunkHeight * this.config.tileSize;
        
        return startPos.x >= 0 && startPos.x < worldWidth &&
               startPos.y >= 0 && startPos.y < worldHeight &&
               endPos.x >= 0 && endPos.x < worldWidth &&
               endPos.y >= 0 && endPos.y < worldHeight;
    }

    /**
     * Find local path within a single chunk
     * @param {string} chunkId - Chunk ID
     * @param {Object} startPos - Start position (global)
     * @param {Object} endPos - End position (global)
     * @returns {Array|null} - Path segment or null
     */
    findLocalPath(chunkId, startPos, endPos) {
        // Get chunk data (2D array)
        const chunkData = this.config.getChunkData(chunkId);
        if (!chunkData) {
            console.log(`🔍 No chunk data for chunk ${chunkId}`);
            return null;
        }

        // Convert global positions to local positions in chunk
        const localStart = CoordUtils.globalToLocal(startPos, chunkId, this.config.chunkWidth, this.config.chunkHeight, this.config.tileSize);
        const localEnd = CoordUtils.globalToLocal(endPos, chunkId, this.config.chunkWidth, this.config.chunkHeight, this.config.tileSize);



        // Find path with injected local algorithm
        const localPath = this.localAlgorithmFn(chunkData, localStart, localEnd);



        if (localPath) {
            // Return as single segment
            return [{
                chunk: chunkId,
                position: endPos
            }];
        }

        return null;
    }

    /**
     * Find path between transition points using injected hierarchical algorithm
     * @param {string} startId - Start point ID
     * @param {string} endId - End point ID
     * @returns {Array|null} - Array of point IDs or null
     */
    findTransitionPath(startId, endId) {
        const graphData = {
            nodes: this.getTransitionPointsMap(),
            connections: this.getTransitionConnectionsMap()
        };
        
        return this.hierarchicalAlgorithmFn(graphData, startId, endId, {
            maxIterations: 1000
        });
    }

    /**
     * Get transition points as Map
     * @returns {Map} - Map of transition points
     */
    getTransitionPointsMap() {
        const points = new Map();
        for (const point of this.config.transitionPoints) {
            points.set(point.id, point);
        }
        return points;
    }

    /**
     * Get transition connections as Map
     * @returns {Map} - Map of connections
     */
    getTransitionConnectionsMap() {
        const connections = new Map();
        for (const point of this.config.transitionPoints) {
            connections.set(point.id, point.connections || []);
        }
        return connections;
    }

    /**
     * Find nearest transition point in a given chunk
     * @param {Object} pos - Position for which we're looking for a point
     * @param {string} chunkId - Chunk ID
     * @returns {Object|null} - Nearest available transition point
     */
    findNearestTransition(pos, chunkId) {
        // Get all transition points in this chunk
        const points = this.getPointsInChunk(chunkId);
        
        if (points.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        // Find nearest point that can be reached
        for (const point of points) {
            // Calculate global position of transition point
            const pointPos = CoordUtils.getTransitionGlobalPosition(
                point, chunkId, this.config.chunkWidth, this.config.chunkHeight, this.config.tileSize
            );

            if (!pointPos) {
                continue;
            }

            // Check if we can reach this point with local path
            try {
                const localPath = this.findLocalPath(chunkId, pos, pointPos);

                if (localPath) {
                    // Calculate Euclidean distance
                    const dx = pointPos.x - pos.x;
                    const dy = pointPos.y - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = point;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error checking local path to transition point ${point.id}:`, error);
                // Continue with next point instead of crashing
                continue;
            }
        }

        return nearest;
    }

    /**
     * Get all transition points in a chunk
     * @param {string} chunkId - Chunk ID
     * @returns {Array} - Array of transition points
     */
    getPointsInChunk(chunkId) {
        const points = [];
        for (const point of this.config.transitionPoints) {
            if (point.chunks.includes(chunkId)) {
                points.push(point);
            }
        }
        return points;
    }

    /**
     * Get configuration
     * @returns {Object} - Current configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Get local algorithm function
     * @returns {Function} - Local algorithm function
     */
    getLocalAlgorithmFn() {
        return this.localAlgorithmFn;
    }

    /**
     * Get hierarchical algorithm function
     * @returns {Function} - Hierarchical algorithm function
     */
    getHierarchicalAlgorithmFn() {
        return this.hierarchicalAlgorithmFn;
    }
} 