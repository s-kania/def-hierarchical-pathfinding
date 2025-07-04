/**
 * CHUNK MANAGER - MAP DIVISION AND RENDERING
 */

import { COLORS, RENDER_CONSTANTS } from '../config/Settings.js';

export class ChunkManager {
    constructor(settings) {
        this.settings = settings;
    }

    /**
     * DIVIDES LARGE MAP INTO CHUNKS
     * 
     * INPUT: unifiedMap - Array[totalWidth * totalHeight] with values 0/1
     * OUTPUT: Array of chunks [{id, x, y, tiles}, ...] 
     */
    splitMapIntoChunks(unifiedMap, totalWidth, totalHeight) {
        const chunks = [];
        const chunkSize = this.settings.chunkSize;
        
        // Iterate through chunk grid (chunkRows x chunkCols)
        for (let chunkY = 0; chunkY < this.settings.chunkRows; chunkY++) {
            for (let chunkX = 0; chunkX < this.settings.chunkCols; chunkX++) {
                const chunk = {
                    id: `${chunkX},${chunkY}`,     // Chunk ID as string
                    x: chunkX,                     // X position in chunk grid
                    y: chunkY,                     // Y position in chunk grid
                    tiles: []                      // Array[chunkSize²] for this chunk
                };
                
                // Extract tiles for this chunk from the large map
                for (let localY = 0; localY < chunkSize; localY++) {
                    for (let localX = 0; localX < chunkSize; localX++) {
                        // Convert local coordinates to global
                        const globalX = chunkX * chunkSize + localX;
                        const globalY = chunkY * chunkSize + localY;
                        const globalIndex = globalY * totalWidth + globalX;
                        const localIndex = localY * chunkSize + localX;
                        
                        // Copy tile from large map to chunk
                        chunk.tiles[localIndex] = unifiedMap[globalIndex];
                    }
                }
                
                chunks.push(chunk);
            }
        }
        
        return chunks; // Array of chunks ready for this.chunks
    }

    /**
     * RENDERS SINGLE CHUNK
     */
    renderChunk(ctx, chunk, gapSize = RENDER_CONSTANTS.GAP_SIZE) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const startX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + gapSize);
        const startY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + gapSize);
        
        // Draw chunk border
        ctx.strokeStyle = COLORS.chunkBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(startX - 1, startY - 1, chunkPixelSize + 2, chunkPixelSize + 2);
        
        // Draw tiles
        for (let y = 0; y < this.settings.chunkSize; y++) {
            for (let x = 0; x < this.settings.chunkSize; x++) {
                const tileIndex = y * this.settings.chunkSize + x;
                const tileValue = chunk.tiles[tileIndex];
                
                const tileX = startX + x * this.settings.tileSize;
                const tileY = startY + y * this.settings.tileSize;
                
                ctx.fillStyle = tileValue === 1 ? COLORS.island : COLORS.ocean;
                ctx.fillRect(tileX, tileY, this.settings.tileSize, this.settings.tileSize);
                
                // Add subtle tile borders for larger tiles
                if (this.settings.tileSize >= RENDER_CONSTANTS.TILE_BORDER_MIN_SIZE) {
                    ctx.strokeStyle = tileValue === 1 ? '#1e5e1e' : '#004499';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(tileX, tileY, this.settings.tileSize, this.settings.tileSize);
                }
            }
        }
        
        // Draw chunk ID
        ctx.fillStyle = COLORS.chunkBorder;
        ctx.font = 'bold 12px var(--font-family-base)';
        ctx.fillText(chunk.id, startX + 2, startY + 14);
    }

    /**
     * CALCULATES CANVAS DIMENSIONS FOR CHUNKS
     */
    calculateCanvasSize(gapSize = RENDER_CONSTANTS.GAP_SIZE) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        
        const totalWidth = this.settings.chunkCols * chunkPixelSize + (this.settings.chunkCols - 1) * gapSize;
        const totalHeight = this.settings.chunkRows * chunkPixelSize + (this.settings.chunkRows - 1) * gapSize;
        
        return {
            width: totalWidth + 2 * RENDER_CONSTANTS.CANVAS_PADDING,
            height: totalHeight + 2 * RENDER_CONSTANTS.CANVAS_PADDING
        };
    }

    /**
     * CALCULATES CHUNK POSITION IN PIXELS
     */
    getChunkPixelPosition(chunkX, chunkY, gapSize = RENDER_CONSTANTS.GAP_SIZE) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        
        return {
            x: RENDER_CONSTANTS.CANVAS_PADDING + chunkX * (chunkPixelSize + gapSize),
            y: RENDER_CONSTANTS.CANVAS_PADDING + chunkY * (chunkPixelSize + gapSize)
        };
    }

    /**
     * VALIDATES CHUNK
     */
    validateChunk(chunk) {
        if (!chunk || typeof chunk !== 'object') {
            return false;
        }
        
        if (!chunk.id || typeof chunk.x !== 'number' || typeof chunk.y !== 'number') {
            return false;
        }
        
        if (!Array.isArray(chunk.tiles) || chunk.tiles.length !== this.settings.chunkSize ** 2) {
            return false;
        }
        
        return true;
    }

    /**
     * FINDS CHUNK BY ID
     */
    findChunkById(chunks, chunkId) {
        return chunks.find(chunk => chunk.id === chunkId);
    }

    /**
     * FINDS CHUNK BY GRID COORDINATES
     */
    findChunkByPosition(chunks, x, y) {
        return chunks.find(chunk => chunk.x === x && chunk.y === y);
    }
} 