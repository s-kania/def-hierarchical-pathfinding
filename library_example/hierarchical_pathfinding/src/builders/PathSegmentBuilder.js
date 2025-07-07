import { CoordUtils } from '../utils/CoordUtils.js';

/**
 * Builder for path segments in hierarchical pathfinding
 * Single function approach following KISS principle
 */
export class PathSegmentBuilder {
    constructor(config, transitionPathfinder = null) {
        this.config = config;
        this.transitionPathfinder = transitionPathfinder;
    }

    /**
     * Build path segments from transition path
     * Single function that handles everything in a clear, linear way
     * @param {Object} startPos - Start position
     * @param {Object} endPos - End position
     * @param {Array} transitionPath - Array of transition point IDs
     * @returns {Array} - Array of path segments
     */
    buildSegments(startPos, endPos, transitionPath) {
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);
        
        // Direct path - no transitions needed
        if (transitionPath.length === 0) {
            return [{ chunk: startChunk, position: endPos }];
        }
        
        const segments = [];
        let effectivePath = [...transitionPath];
        
        // 🔥 FIRST NODE VERIFICATION - remove redundant first node
        if (effectivePath.length >= 2) {
            const firstPoint = this.getTransitionPoint(effectivePath[0]);
            const secondPoint = this.getTransitionPoint(effectivePath[1]);
            
            const connectionChunk = this.findConnectionChunk(firstPoint, secondPoint);
            if (secondPoint.chunks.includes(startChunk) && connectionChunk === startChunk) {
                effectivePath.shift(); // Remove first, redundant node
            }
        }
        
        // Add start segment (from startPos to first transition point)
        if (effectivePath.length > 0) {
            const firstPoint = this.getTransitionPoint(effectivePath[0]);
            const firstPointPos = CoordUtils.getTransitionGlobalPosition(
                firstPoint, startChunk, this.config.chunkWidth, this.config.tileSize
            );
            
            if (firstPointPos) {
                segments.push({ chunk: startChunk, position: firstPointPos });
            }
        }
        
        // Build segments between transition points
        for (let i = 0; i < effectivePath.length - 1; i++) {
            const currentPoint = this.getTransitionPoint(effectivePath[i]);
            const nextPoint = this.getTransitionPoint(effectivePath[i + 1]);
            
            const connectionChunk = this.findConnectionChunk(currentPoint, nextPoint);
            if (!connectionChunk) continue;
            
            const nextPointPos = CoordUtils.getTransitionGlobalPosition(
                nextPoint, connectionChunk, this.config.chunkWidth, this.config.tileSize
            );
            if (!nextPointPos) continue;
            
            segments.push({ chunk: connectionChunk, position: nextPointPos });
        }
        
        // Add end segment (from last transition point to endPos)
        if (effectivePath.length > 0) {
            segments.push({ chunk: endChunk, position: endPos });
        }

        // 🔥 PENULTIMATE SEGMENT VERIFICATION - remove duplicate end segments
        if (segments.length >= 2) {
            const penultimateSegment = segments[segments.length - 2];
            if (penultimateSegment.chunk === endChunk) {
                segments.splice(segments.length - 2, 1);
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