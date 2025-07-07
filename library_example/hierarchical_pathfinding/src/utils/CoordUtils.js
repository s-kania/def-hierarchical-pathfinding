/**
 * Simplified coordinate utilities for hierarchical pathfinding
 * Contains only essential functions following KISS principle
 */

export class CoordUtils {
    /**
     * Convert global position to chunk ID
     * @param {Object} globalPos - Global position {x, y}
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {string} - Chunk ID "x,y"
     */
    static globalToChunkId(globalPos, chunkSize, tileSize) {
        const chunkWorldSize = chunkSize * tileSize;
        const chunkX = Math.floor(globalPos.x / chunkWorldSize);
        const chunkY = Math.floor(globalPos.y / chunkWorldSize);
        return `${chunkX},${chunkY}`;
    }
    
    /**
     * Convert global position to local position within chunk
     * @param {Object} globalPos - Global position {x, y}
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {Object} - Local position {x, y}
     */
    static globalToLocal(globalPos, chunkId, chunkSize, tileSize) {
        const chunkCoords = this.chunkIdToCoords(chunkId);
        const chunkWorldSize = chunkSize * tileSize;
        const localX = Math.floor((globalPos.x - chunkCoords.x * chunkWorldSize) / tileSize);
        const localY = Math.floor((globalPos.y - chunkCoords.y * chunkWorldSize) / tileSize);
        
        // Clamp to chunk boundaries
        return {
            x: Math.max(0, Math.min(chunkSize - 1, localX)),
            y: Math.max(0, Math.min(chunkSize - 1, localY))
        };
    }
    
    /**
     * Convert local position to global position
     * @param {Object} localPos - Local position {x, y}
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {Object} - Global position {x, y}
     */
    static localToGlobal(localPos, chunkId, chunkSize, tileSize) {
        const chunkCoords = this.chunkIdToCoords(chunkId);
        const chunkWorldSize = chunkSize * tileSize;
        
        return {
            x: chunkCoords.x * chunkWorldSize + localPos.x * tileSize + tileSize / 2,
            y: chunkCoords.y * chunkWorldSize + localPos.y * tileSize + tileSize / 2
        };
    }
    
    /**
     * Convert chunk ID to coordinates
     * @param {string} chunkId - Chunk ID "x,y"
     * @returns {Object} - Chunk coordinates {x, y}
     */
    static chunkIdToCoords(chunkId) {
        const [x, y] = chunkId.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * Convert chunk coordinates to ID
     * @param {number} x - Chunk X coordinate
     * @param {number} y - Chunk Y coordinate
     * @returns {string} - Chunk ID "x,y"
     */
    static coordsToChunkId(x, y) {
        return `${x},${y}`;
    }
    
    /**
     * Calculate transition point position in chunk
     * @param {Object} point - Transition point
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size
     * @returns {Object|null} - Local position {x, y} or null
     */
    static getTransitionLocalPosition(point, chunkId, chunkSize) {
        if (!point.chunks.includes(chunkId)) {
            return null;
        }
        
        const otherChunkId = point.chunks.find(id => id !== chunkId);
        if (!otherChunkId) {
            return null;
        }
        
        const coords = this.chunkIdToCoords(chunkId);
        const otherCoords = this.chunkIdToCoords(otherChunkId);
        
        // Determine position on chunk edge based on direction
        const dx = otherCoords.x - coords.x;
        const dy = otherCoords.y - coords.y;
        
        if (dx > 0) return { x: chunkSize - 1, y: point.position };
        if (dx < 0) return { x: 0, y: point.position };
        if (dy > 0) return { x: point.position, y: chunkSize - 1 };
        if (dy < 0) return { x: point.position, y: 0 };
        
        return null;
    }
    
    /**
     * Calculate global position of transition point
     * @param {Object} point - Transition point
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {Object|null} - Global position {x, y} or null
     */
    static getTransitionGlobalPosition(point, chunkId, chunkSize, tileSize) {
        const localPos = this.getTransitionLocalPosition(point, chunkId, chunkSize);
        if (!localPos) {
            return null;
        }
        
        return this.localToGlobal(localPos, chunkId, chunkSize, tileSize);
    }
} 