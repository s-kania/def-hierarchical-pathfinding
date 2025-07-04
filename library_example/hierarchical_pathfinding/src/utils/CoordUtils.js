/**
 * Simplified coordinate utilities for hierarchical pathfinding
 * Contains only essential functions following KISS principle
 */

export class CoordUtils {
    /**
     * Convert global position to chunk ID
     * @param {Object} globalPos - Global position {x, y} or object with chunkX/chunkY
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {string} - Chunk ID "x,y"
     */
    static globalToChunkId(globalPos, chunkSize, tileSize) {
        // Check if position already has calculated chunk coordinates
        if (globalPos.chunkX !== undefined && globalPos.chunkY !== undefined) {
            return `${globalPos.chunkX},${globalPos.chunkY}`;
        }
        
        // Calculate from global position
        const chunkWorldSize = chunkSize * tileSize;
        const chunkX = Math.floor(globalPos.x / chunkWorldSize);
        const chunkY = Math.floor(globalPos.y / chunkWorldSize);
        return `${chunkX},${chunkY}`;
    }
    
    /**
     * Convert global position to local position within chunk
     * @param {Object} globalPos - Global position {x, y} or object with localX/localY
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {Object} - Local position {x, y}
     */
    static globalToLocal(globalPos, chunkId, chunkSize, tileSize) {
        // Check if position already has calculated local coordinates
        if (globalPos.localX !== undefined && globalPos.localY !== undefined) {
            const expectedChunkId = globalPos.chunkX !== undefined && globalPos.chunkY !== undefined 
                ? `${globalPos.chunkX},${globalPos.chunkY}` 
                : null;
            
            if (expectedChunkId === chunkId) {
                return { x: globalPos.localX, y: globalPos.localY };
            }
        }
        
        // Calculate local position
        const chunkCoords = globalPos.chunkX !== undefined && globalPos.chunkY !== undefined
            ? { x: globalPos.chunkX, y: globalPos.chunkY }
            : this.chunkIdToCoords(chunkId);
            
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
     * @returns {Object} - Global position {x, y, z}
     */
    static localToGlobal(localPos, chunkId, chunkSize, tileSize) {
        const chunkCoords = this.chunkIdToCoords(chunkId);
        const chunkWorldSize = chunkSize * tileSize;
        
        return {
            x: chunkCoords.x * chunkWorldSize + localPos.x * tileSize + tileSize / 2,
            y: chunkCoords.y * chunkWorldSize + localPos.y * tileSize + tileSize / 2,
            z: 0
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
        
        // Find second chunk to determine direction
        const otherChunkId = point.chunks.find(id => id !== chunkId);
        if (!otherChunkId) {
            return null;
        }
        
        const coords = this.chunkIdToCoords(chunkId);
        const otherCoords = this.chunkIdToCoords(otherChunkId);
        
        // Determine position on chunk edge
        if (otherCoords.x > coords.x) {
            return { x: chunkSize - 1, y: point.position };
        } else if (otherCoords.x < coords.x) {
            return { x: 0, y: point.position };
        } else if (otherCoords.y > coords.y) {
            return { x: point.position, y: chunkSize - 1 };
        } else if (otherCoords.y < coords.y) {
            return { x: point.position, y: 0 };
        }
        
        return null;
    }
    
    /**
     * Calculate global position of transition point
     * @param {Object} point - Transition point
     * @param {string} chunkId - Chunk ID
     * @param {number} chunkSize - Chunk size in tiles
     * @param {number} tileSize - Tile size in world units
     * @returns {Object|null} - Global position {x, y, z} or null
     */
    static getTransitionGlobalPosition(point, chunkId, chunkSize, tileSize) {
        const localPos = this.getTransitionLocalPosition(point, chunkId, chunkSize);
        if (!localPos) {
            return null;
        }
        
        return this.localToGlobal(localPos, chunkId, chunkSize, tileSize);
    }
} 