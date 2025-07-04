/**
 * Hierarchical Pathfinding Library for JavaScript
 * Minimal version with pre-computed connections graph
 */

import { CoordUtils } from './src/utils/CoordUtils.js';
import { TransitionGraph } from './src/TransitionGraph.js';
import { LocalPathfinder } from './src/LocalPathfinder.js';

export class HierarchicalPathfinding {
    constructor() {
        this.transitionGraph = null;
        this.config = null;
    }

    /**
     * Initialize the pathfinding system
     * @param {Object} config - Configuration containing:
     *   - tileSize: tile size (in world units)
     *   - gridWidth/gridHeight: grid dimensions (in chunks)
     *   - chunkWidth/chunkHeight: chunk dimensions (in tiles)
     *   - getChunkData: function returning chunk data
     *   - transitionPoints: array of transition points between chunks
     */
    init(config) {
        // Basic validation
        if (!config || !config.tileSize || 
            !config.gridWidth || !config.gridHeight || 
            !config.chunkWidth || !config.chunkHeight ||
            !config.getChunkData || !config.transitionPoints) {
            throw new Error("Missing required configuration parameters");
        }
        
        // Save configuration
        this.config = config;
        
        // Build connections graph between transition points
        this.transitionGraph = new TransitionGraph(config.transitionPoints, {
            gridWidth: config.gridWidth,
            gridHeight: config.gridHeight,
            chunkSize: config.chunkWidth, // Use chunkWidth as chunkSize for compatibility
            tileSize: config.tileSize
        });
    }

    /**
     * Main function - finds path from startPos to endPos
     * @param {Object} startPos - Start position {x, y} in world units
     * @param {Object} endPos - End position {x, y} in world units
     * @returns {Array|null} - Array of segments [{chunk, position}] or null
     */
    findPath(startPos, endPos) {
        if (!this.config) {
            throw new Error("Pathfinder has not been initialized");
        }

        // Check if positions are within world bounds
        const worldWidth = this.config.gridWidth * this.config.chunkWidth * this.config.tileSize;
        const worldHeight = this.config.gridHeight * this.config.chunkHeight * this.config.tileSize;
        
        if (startPos.x < 0 || startPos.x >= worldWidth || 
            startPos.y < 0 || startPos.y >= worldHeight ||
            endPos.x < 0 || endPos.x >= worldWidth ||
            endPos.y < 0 || endPos.y >= worldHeight) {
            return null;
        }

        // Determine which chunks contain start and end
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);

        // If same chunk - try local A* first
        if (startChunk === endChunk) {
            const localPath = this.findLocalPath(startChunk, startPos, endPos);
            // If local path was found, return it immediately
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
        
        const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);

        if (!transitionPath) {
            return null; // No path between chunks
        }

        // Build final path segments
        const segments = this.buildPathSegments(startPos, endPos, transitionPath);
        
        return segments;
    }

    /**
     * Finds nearest transition point in a given chunk
     * @param {Object} pos - Position for which we're looking for a point
     * @param {string} chunkId - Chunk ID
     * @returns {Object|null} - Nearest available transition point
     */
    findNearestTransition(pos, chunkId) {
        // Get all transition points in this chunk
        const points = this.transitionGraph.getPointsInChunk(chunkId);
        
        if (points.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        // Find nearest point that can be reached
        for (const point of points) {
            // Calculate global position of transition point
            const pointPos = CoordUtils.getTransitionGlobalPosition(
                point, chunkId, this.config.chunkWidth, this.config.tileSize
            );

            if (!pointPos) {
                continue;
            }

            // Check if we can reach this point with local path
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
        }

        return nearest;
    }

    /**
     * Finds local path within a single chunk
     * @param {string} chunkId - Chunk ID
     * @param {Object} startPos - Start position (global)
     * @param {Object} endPos - End position (global)
     * @returns {Array|null} - Path segment or null
     */
    findLocalPath(chunkId, startPos, endPos) {
        // Get chunk data (2D array)
        const chunkData = this.config.getChunkData(chunkId);
        if (!chunkData) {
            return null;
        }

        // Convert global positions to local positions in chunk
        const localStart = CoordUtils.globalToLocal(startPos, chunkId, this.config.chunkWidth, this.config.tileSize);
        const localEnd = CoordUtils.globalToLocal(endPos, chunkId, this.config.chunkWidth, this.config.tileSize);

        // Find path with local A*
        const localPath = LocalPathfinder.findPath(chunkData, localStart, localEnd);

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
     * Finds chunk for connection between two transition points
     * @param {Object} fromPoint - Start point
     * @param {Object} toPoint - Target point  
     * @returns {string|null} - Chunk ID or null if no connection
     */
    findConnectionChunk(fromPoint, toPoint) {
        const connection = fromPoint.connections.find(conn => conn.id === toPoint.id);
        return connection ? connection.chunk : null;
    }

    /**
     * Returns clean transition points with redundant node optimization
     * @param {Object} startPos - Start position 
     * @param {Object} endPos - End position  
     * @param {Array} transitionPath - List of transition point IDs
     * @returns {Array} - List of transition points
     */
    buildPathSegments(startPos, endPos, transitionPath) {
        const segments = [];
        
        // Determine start and end chunks
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);
        
        // If no transition points (direct path)
        if (transitionPath.length === 0) {
            segments.push({
                chunk: startChunk,
                position: endPos
            });
            return segments;
        }
        
        // Create copy of path for optimization
        let effectivePath = [...transitionPath];
        
        // 🔥 FIRST NODE VERIFICATION
        if (effectivePath.length >= 2) {
            const firstPoint = this.transitionGraph.getPoint(effectivePath[0]);
            const secondPoint = this.transitionGraph.getPoint(effectivePath[1]);
            
            // Check if second point is accessible from start chunk
            // AND if there's a direct connection from first to second point in this chunk.
            const connectionChunk = this.findConnectionChunk(firstPoint, secondPoint);
            if (secondPoint.chunks.includes(startChunk) && connectionChunk === startChunk) {
                effectivePath.shift(); // Remove first, redundant node
            }
        }
        
        // Add start segment (from startPos to first transition point)
        if (effectivePath.length > 0) {
            const firstPoint = this.transitionGraph.getPoint(effectivePath[0]);
            const firstPointPos = CoordUtils.getTransitionGlobalPosition(
                firstPoint, startChunk, this.config.chunkWidth, this.config.tileSize
            );
            
            

            if (firstPointPos) {
                segments.push({
                    chunk: startChunk,
                    position: firstPointPos
                });
            }
        }
        
        // Build segments between transition points
        for (let i = 0; i < effectivePath.length - 1; i++) {
            const currentPoint = this.transitionGraph.getPoint(effectivePath[i]);
            const nextPoint = this.transitionGraph.getPoint(effectivePath[i + 1]);
            
            // Use helper function to find connection chunk
            const connectionChunk = this.findConnectionChunk(currentPoint, nextPoint);
            
            if (!connectionChunk) {
                continue;
            }
            
            const nextPointPos = CoordUtils.getTransitionGlobalPosition(
                nextPoint, connectionChunk, this.config.chunkWidth, this.config.tileSize
            );

            if (!nextPointPos) {
                continue;
            }
            
            segments.push({
                chunk: connectionChunk,
                position: nextPointPos
            });
        }
        
        // Add end segment (from last transition point to endPos)
        if (effectivePath.length > 0) {
            segments.push({
                chunk: endChunk,
                position: endPos
            });
        }

        // 🔥 PENULTIMATE SEGMENT VERIFICATION
        if (segments.length >= 2) {
            const penultimateSegment = segments[segments.length - 2];
            
            if (penultimateSegment.chunk === endChunk) {
                segments.splice(segments.length - 2, 1); // Remove penultimate segment
            }
        }
        
        return segments;
    }
} 