import { CoordUtils } from '../utils/CoordUtils.js';

/**
 * Builder for path segments in hierarchical pathfinding
 * Handles segment creation and optimization
 */
export class PathSegmentBuilder {
    constructor(config, transitionPathfinder = null) {
        this.config = config;
        this.transitionPathfinder = transitionPathfinder;
    }

    /**
     * Build path segments from transition path
     * @param {Object} startPos - Start position
     * @param {Object} endPos - End position
     * @param {Array} transitionPath - Array of transition point IDs
     * @returns {Array} - Array of path segments
     */
    buildSegments(startPos, endPos, transitionPath) {
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
        
        // Apply optimizations
        effectivePath = this.optimizePath(effectivePath, startChunk, endChunk);
        
        // Build segments
        segments.push(...this.buildSegmentList(startPos, endPos, effectivePath, startChunk, endChunk));
        
        return segments;
    }

    /**
     * Optimize transition path
     * @param {Array} path - Transition path
     * @param {string} startChunk - Start chunk ID
     * @param {string} endChunk - End chunk ID
     * @returns {Array} - Optimized path
     */
    optimizePath(path, startChunk, endChunk) {
        let optimizedPath = [...path];
        
        // FIRST NODE VERIFICATION
        if (optimizedPath.length >= 2) {
            const firstPoint = this.getTransitionPoint(optimizedPath[0]);
            const secondPoint = this.getTransitionPoint(optimizedPath[1]);
            
            // Check if second point is accessible from start chunk
            // AND if there's a direct connection from first to second point in this chunk.
            const connectionChunk = this.findConnectionChunk(firstPoint, secondPoint);
            if (secondPoint.chunks.includes(startChunk) && connectionChunk === startChunk) {
                optimizedPath.shift(); // Remove first, redundant node
            }
        }
        
        return optimizedPath;
    }

    /**
     * Build list of segments from optimized path
     * @param {Object} startPos - Start position
     * @param {Object} endPos - End position
     * @param {Array} effectivePath - Optimized transition path
     * @param {string} startChunk - Start chunk ID
     * @param {string} endChunk - End chunk ID
     * @returns {Array} - Array of segments
     */
    buildSegmentList(startPos, endPos, effectivePath, startChunk, endChunk) {
        const segments = [];
        
        // Add start segment (from startPos to first transition point)
        if (effectivePath.length > 0) {
            const firstPoint = this.getTransitionPoint(effectivePath[0]);
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
            const currentPoint = this.getTransitionPoint(effectivePath[i]);
            const nextPoint = this.getTransitionPoint(effectivePath[i + 1]);
            
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

        // PENULTIMATE SEGMENT VERIFICATION
        if (segments.length >= 2) {
            const penultimateSegment = segments[segments.length - 2];
            
            if (penultimateSegment.chunk === endChunk) {
                segments.splice(segments.length - 2, 1); // Remove penultimate segment
            }
        }
        
        return segments;
    }

    /**
     * Get transition point by ID
     * @param {string} pointId - Point ID
     * @returns {Object} - Transition point
     */
    getTransitionPoint(pointId) {
        // Use transition pathfinder if available, otherwise fall back to config
        if (this.transitionPathfinder) {
            return this.transitionPathfinder.getPoint(pointId);
        }
        return this.config.transitionPoints.find(p => p.id === pointId);
    }

    /**
     * Find chunk for connection between two transition points
     * @param {Object} fromPoint - Start point
     * @param {Object} toPoint - Target point  
     * @returns {string|null} - Chunk ID or null if no connection
     */
    findConnectionChunk(fromPoint, toPoint) {
        const connection = fromPoint.connections.find(conn => conn.id === toPoint.id);
        return connection ? connection.chunk : null;
    }
} 