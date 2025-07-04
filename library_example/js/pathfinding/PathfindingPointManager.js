/**
 * PATHFINDING POINT MANAGEMENT - START AND END POINTS
 */

import { RENDER_CONSTANTS } from '../config/Settings.js';

export class PathfindingPointManager {
    constructor(settings) {
        this.settings = settings;
        
        // Start and end points
        this.startPoint = null;
        this.endPoint = null;
        
        // Drag and drop state
        this.isDragging = false;
        this.draggedPoint = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Point size
        this.pointRadius = 8;
        
        // Current canvas and chunk size
        this.canvasSize = null;
        this.chunks = null;
    }

    /**
     * GENERATES RANDOM POINTS ON OCEAN
     */
    generateRandomPoints(chunks) {
        this.chunks = chunks;
        
        const oceanTiles = this.findOceanTiles(chunks);
        
        if (oceanTiles.length < 2) {
            console.warn('❌ Not enough ocean tiles to generate points!');
            return false;
        }
        
        // Randomly select two different ocean tiles
        const shuffled = oceanTiles.sort(() => 0.5 - Math.random());
        const startTile = shuffled[0];
        const endTile = shuffled[1];
        
        // Convert to pixel positions
        this.startPoint = {
            x: startTile.x,
            y: startTile.y,
            chunkX: startTile.chunkX,
            chunkY: startTile.chunkY,
            localX: startTile.localX,
            localY: startTile.localY,
            pixelX: startTile.pixelX,
            pixelY: startTile.pixelY,
            type: 'start'
        };
        
        this.endPoint = {
            x: endTile.x,
            y: endTile.y,
            chunkX: endTile.chunkX,
            chunkY: endTile.chunkY,
            localX: endTile.localX,
            localY: endTile.localY,
            pixelX: endTile.pixelX,
            pixelY: endTile.pixelY,
            type: 'end'
        };
        
        return true;
    }

    /**
     * FINDS ALL OCEAN TILES
     */
    findOceanTiles(chunks) {
        const oceanTiles = [];
        
        chunks.forEach(chunk => {
            // Calculate chunk pixel position
            const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
            const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            
                            for (let localY = 0; localY < this.settings.chunkSize; localY++) {
                    for (let localX = 0; localX < this.settings.chunkSize; localX++) {
                        // Check if tile is ocean - handle both 2D and 1D format
                        let isOcean = false;
                        if (Array.isArray(chunk.tiles[0])) {
                            // 2D format: chunk.tiles[y][x]
                            isOcean = chunk.tiles[localY][localX] === 0;
                        } else {
                            // 1D format: chunk.tiles[index] (backup)
                            const index = localY * this.settings.chunkSize + localX;
                            isOcean = chunk.tiles[index] === 0;
                        }
                        
                        if (isOcean) { // Ocean
                        const globalX = chunk.x * this.settings.chunkSize + localX;
                        const globalY = chunk.y * this.settings.chunkSize + localY;
                        
                        // Calculate pixel position
                        const pixelX = chunkPixelX + localX * this.settings.tileSize;
                        const pixelY = chunkPixelY + localY * this.settings.tileSize;
                        
                        oceanTiles.push({
                            x: globalX,
                            y: globalY,
                            chunkX: chunk.x,
                            chunkY: chunk.y,
                            localX: localX,
                            localY: localY,
                            pixelX: pixelX + this.settings.tileSize / 2,
                            pixelY: pixelY + this.settings.tileSize / 2
                        });
                    }
                }
            }
        });
        
        return oceanTiles;
    }

    /**
     * CLEAR POINTS
     */
    clearPoints() {
        this.startPoint = null;
        this.endPoint = null;
        this.isDragging = false;
        this.draggedPoint = null;
    }

    /**
     * CHECKS IF CLICKED ON POINT
     */
    getPointAt(mouseX, mouseY) {
        // Increase tolerance for larger maps and larger tiles
        const baseTolerance = this.pointRadius + 5;
        const scaleTolerance = Math.max(baseTolerance, this.settings.tileSize);
        const tolerance = Math.min(scaleTolerance, 30); // Maximum tolerance 30px
        
        if (this.startPoint && this.isPointNear(this.startPoint, mouseX, mouseY, tolerance)) {
            return this.startPoint;
        }
        
        if (this.endPoint && this.isPointNear(this.endPoint, mouseX, mouseY, tolerance)) {
            return this.endPoint;
        }
        
        return null;
    }

    /**
     * CHECKS IF POINT IS NEAR MOUSE
     */
    isPointNear(point, mouseX, mouseY, tolerance) {
        const dx = point.pixelX - mouseX;
        const dy = point.pixelY - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    /**
     * STARTS DRAGGING
     */
    startDragging(point, mouseX, mouseY) {
        this.isDragging = true;
        this.draggedPoint = point;
        this.dragOffset.x = mouseX - point.pixelX;
        this.dragOffset.y = mouseY - point.pixelY;
    }

    /**
     * CONTINUES DRAGGING WITH TILE SNAPPING
     */
    updateDragging(mouseX, mouseY) {
        if (!this.isDragging || !this.draggedPoint) return false;
        
        const newPixelX = mouseX - this.dragOffset.x;
        const newPixelY = mouseY - this.dragOffset.y;
        
        // Check if new position is on ocean
        const tilePos = this.pixelToTilePosition(newPixelX, newPixelY);
        
        if (tilePos && this.isTileOcean(tilePos)) {
            // TILE SNAPPING - always snap to tile center
            const snappedPixelPos = this.snapToTileCenter(tilePos);
            
            // Update point position to snapped position
            this.draggedPoint.pixelX = snappedPixelPos.x;
            this.draggedPoint.pixelY = snappedPixelPos.y;
            this.draggedPoint.x = tilePos.x;
            this.draggedPoint.y = tilePos.y;
            this.draggedPoint.chunkX = tilePos.chunkX;
            this.draggedPoint.chunkY = tilePos.chunkY;
            this.draggedPoint.localX = tilePos.localX;
            this.draggedPoint.localY = tilePos.localY;
            return true;
        }
        
        // If cannot move to new position, but still dragging
        // at least update pixel position for smoother visual effect
        if (tilePos) {
            // Position is on map but not on ocean - allow visual movement
            this.draggedPoint.pixelX = newPixelX;
            this.draggedPoint.pixelY = newPixelY;
            // But don't update tile coordinates
            return true;
        }
        
        return false;
    }

    /**
     * SNAPS POSITION TO TILE CENTER
     */
    snapToTileCenter(tilePos) {
        if (!tilePos || !this.chunks) return { x: 0, y: 0 };
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const chunk = this.chunks.find(c => c.x === tilePos.chunkX && c.y === tilePos.chunkY);
        
        if (!chunk) return { x: 0, y: 0 };
        
        const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
        const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
        
        // Calculate tile center position in pixels
        const tileCenterX = chunkPixelX + tilePos.localX * this.settings.tileSize + this.settings.tileSize / 2;
        const tileCenterY = chunkPixelY + tilePos.localY * this.settings.tileSize + this.settings.tileSize / 2;
        
        return { x: tileCenterX, y: tileCenterY };
    }

    /**
     * ENDS DRAGGING WITH TILE SNAPPING
     */
    stopDragging() {
        if (this.isDragging && this.draggedPoint) {
            // Check if final position is on ocean
            const tilePos = this.pixelToTilePosition(this.draggedPoint.pixelX, this.draggedPoint.pixelY);
            
            if (!tilePos || !this.isTileOcean(tilePos)) {
                // If final position is not on ocean, restore point to last valid position
                // (tile coordinates remained unchanged in updateDragging)
                this.updatePointPixelFromTileCoords(this.draggedPoint);

            } else {
                // If position is valid, update tile coordinates and snap to tile center
                this.draggedPoint.x = tilePos.x;
                this.draggedPoint.y = tilePos.y;
                this.draggedPoint.chunkX = tilePos.chunkX;
                this.draggedPoint.chunkY = tilePos.chunkY;
                this.draggedPoint.localX = tilePos.localX;
                this.draggedPoint.localY = tilePos.localY;
                
                // Snap to tile center
                const snappedPixelPos = this.snapToTileCenter(tilePos);
                this.draggedPoint.pixelX = snappedPixelPos.x;
                this.draggedPoint.pixelY = snappedPixelPos.y;
            }
        }
        
        this.isDragging = false;
        this.draggedPoint = null;
        this.dragOffset.x = 0;
        this.dragOffset.y = 0;
    }

    /**
     * UPDATES POINT PIXEL POSITION BASED ON TILE COORDINATES
     */
    updatePointPixelFromTileCoords(point) {
        if (!point || !this.chunks) return;
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const chunk = this.chunks.find(c => c.x === point.chunkX && c.y === point.chunkY);
        
        if (chunk) {
            const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            
            const localX = point.x - chunk.x * this.settings.chunkSize;
            const localY = point.y - chunk.y * this.settings.chunkSize;
            
            point.pixelX = chunkPixelX + localX * this.settings.tileSize + this.settings.tileSize / 2;
            point.pixelY = chunkPixelY + localY * this.settings.tileSize + this.settings.tileSize / 2;
        }
    }

    /**
     * CONVERTS PIXEL POSITION TO TILE POSITION
     */
    pixelToTilePosition(pixelX, pixelY) {
        if (!this.chunks) return null;
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        
        // Find chunk under pixel position
        for (const chunk of this.chunks) {
            const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkRight = chunkPixelX + chunkPixelSize;
            const chunkBottom = chunkPixelY + chunkPixelSize;
            
            if (pixelX >= chunkPixelX && pixelX < chunkRight &&
                pixelY >= chunkPixelY && pixelY < chunkBottom) {
                
                // Calculate local position in chunk
                const localPixelX = pixelX - chunkPixelX;
                const localPixelY = pixelY - chunkPixelY;
                
                const localX = Math.floor(localPixelX / this.settings.tileSize);
                const localY = Math.floor(localPixelY / this.settings.tileSize);
                
                // Boundary validation - ensure we don't go beyond chunk
                if (localX < 0 || localX >= this.settings.chunkSize || 
                    localY < 0 || localY >= this.settings.chunkSize) {
                    continue; // Go to next chunk
                }
                
                const globalX = chunk.x * this.settings.chunkSize + localX;
                const globalY = chunk.y * this.settings.chunkSize + localY;
                
                return {
                    x: globalX,
                    y: globalY,
                    chunkX: chunk.x,
                    chunkY: chunk.y,
                    localX: localX,
                    localY: localY,
                    chunk: chunk
                };
            }
        }
        
        return null;
    }

    /**
     * CHECKS IF TILE IS OCEAN
     */
    isTileOcean(tilePos) {
        if (!tilePos || !tilePos.chunk) return false;
        
        // Handle both 2D and 1D format
        if (Array.isArray(tilePos.chunk.tiles[0])) {
            // 2D format: chunk.tiles[y][x]
            return tilePos.chunk.tiles[tilePos.localY][tilePos.localX] === 0;
        } else {
            // 1D format: chunk.tiles[index] (backup)
            const index = tilePos.localY * this.settings.chunkSize + tilePos.localX;
            return tilePos.chunk.tiles[index] === 0; // 0 = ocean
        }
    }

    /**
     * CALCULATES LINEAR DISTANCE BETWEEN POINTS
     */
    calculateLinearDistance() {
        if (!this.startPoint || !this.endPoint) return null;
        
        const dx = this.endPoint.x - this.startPoint.x;
        const dy = this.endPoint.y - this.startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return {
            tiles: Math.round(distance * 100) / 100,
            pixels: Math.round(distance * this.settings.tileSize * 100) / 100
        };
    }

    /**
     * GETTERS
     */
    getStartPoint() {
        return this.startPoint;
    }

    getEndPoint() {
        return this.endPoint;
    }

    hasPoints() {
        return this.startPoint && this.endPoint;
    }

    isDraggingPoint() {
        return this.isDragging;
    }

    getDraggedPoint() {
        return this.draggedPoint;
    }

    /**
     * UPDATES SETTINGS
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Update point size based on tile size
        this.pointRadius = Math.max(6, this.settings.tileSize / 2);
    }
} 