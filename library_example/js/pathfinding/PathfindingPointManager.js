/**
 * ZARZĄDZANIE PUNKTAMI PATHFINDING - PUNKT STARTOWY I KOŃCOWY
 */

import { RENDER_CONSTANTS } from '../config/Settings.js';

export class PathfindingPointManager {
    constructor(settings) {
        this.settings = settings;
        
        // Punkty startowy i końcowy
        this.startPoint = null;
        this.endPoint = null;
        
        // Stan drag and drop
        this.isDragging = false;
        this.draggedPoint = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Rozmiar punktów
        this.pointRadius = 8;
        
        // Aktualny rozmiar canvas i chunków
        this.canvasSize = null;
        this.chunks = null;
    }

    /**
     * GENERUJE LOSOWE PUNKTY NA OCEANIE
     */
    generateRandomPoints(chunks) {
        this.chunks = chunks;
        
        const oceanTiles = this.findOceanTiles(chunks);
        
        if (oceanTiles.length < 2) {
            console.warn('❌ Niewystarczająco dużo kafelków oceanu do wygenerowania punktów!');
            return false;
        }
        
        // Losuj dwa różne kafelki oceanu
        const shuffled = oceanTiles.sort(() => 0.5 - Math.random());
        const startTile = shuffled[0];
        const endTile = shuffled[1];
        
        // Konwertuj na pozycje pixel
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
     * ZNAJDUJE WSZYSTKIE KAFELKI OCEANU
     */
    findOceanTiles(chunks) {
        const oceanTiles = [];
        
        chunks.forEach(chunk => {
            // Oblicz pozycję pixel chunka
            const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
            const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            
                            for (let localY = 0; localY < this.settings.chunkSize; localY++) {
                    for (let localX = 0; localX < this.settings.chunkSize; localX++) {
                        // Sprawdź czy tile jest oceanem - obsługa zarówno 2D jak i 1D format
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
                        
                        // Oblicz pozycję pixel
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
     * WYCZYŚĆ PUNKTY
     */
    clearPoints() {
        this.startPoint = null;
        this.endPoint = null;
        this.isDragging = false;
        this.draggedPoint = null;
    }

    /**
     * SPRAWDZA CZY KLIKNIĘTO NA PUNKT
     */
    getPointAt(mouseX, mouseY) {
        // Zwiększ tolerancję dla większych map i większych tile'ów
        const baseTolerance = this.pointRadius + 5;
        const scaleTolerance = Math.max(baseTolerance, this.settings.tileSize);
        const tolerance = Math.min(scaleTolerance, 30); // Maksymalna tolerancja 30px
        
        if (this.startPoint && this.isPointNear(this.startPoint, mouseX, mouseY, tolerance)) {
            return this.startPoint;
        }
        
        if (this.endPoint && this.isPointNear(this.endPoint, mouseX, mouseY, tolerance)) {
            return this.endPoint;
        }
        
        return null;
    }

    /**
     * SPRAWDZA CZY PUNKT JEST BLISKO MYSZY
     */
    isPointNear(point, mouseX, mouseY, tolerance) {
        const dx = point.pixelX - mouseX;
        const dy = point.pixelY - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    /**
     * ROZPOCZYNA PRZECIĄGANIE
     */
    startDragging(point, mouseX, mouseY) {
        this.isDragging = true;
        this.draggedPoint = point;
        this.dragOffset.x = mouseX - point.pixelX;
        this.dragOffset.y = mouseY - point.pixelY;
    }

    /**
     * KONTYNUUJE PRZECIĄGANIE
     */
    updateDragging(mouseX, mouseY) {
        if (!this.isDragging || !this.draggedPoint) return false;
        
        const newPixelX = mouseX - this.dragOffset.x;
        const newPixelY = mouseY - this.dragOffset.y;
        
        // Sprawdź czy nowa pozycja jest na oceanie
        const tilePos = this.pixelToTilePosition(newPixelX, newPixelY);
        
        if (tilePos && this.isTileOcean(tilePos)) {
            // Zaktualizuj pozycję punktu
            this.draggedPoint.pixelX = newPixelX;
            this.draggedPoint.pixelY = newPixelY;
            this.draggedPoint.x = tilePos.x;
            this.draggedPoint.y = tilePos.y;
            this.draggedPoint.chunkX = tilePos.chunkX;
            this.draggedPoint.chunkY = tilePos.chunkY;
            this.draggedPoint.localX = tilePos.localX;
            this.draggedPoint.localY = tilePos.localY;
            return true;
        }
        
        // Jeśli nie można przenieść do nowej pozycji, ale nadal przeciągamy
        // przynajmniej zaktualizuj pozycję pixel dla płynniejszego efektu wizualnego
        if (tilePos) {
            // Pozycja jest na mapie, ale nie na oceanie - pozwól na wizualny ruch
            this.draggedPoint.pixelX = newPixelX;
            this.draggedPoint.pixelY = newPixelY;
            // Ale nie aktualizuj tile coordinates
            return true;
        }
        
        return false;
    }

    /**
     * KOŃCZY PRZECIĄGANIE
     */
    stopDragging() {
        if (this.isDragging && this.draggedPoint) {
            // Sprawdź czy końcowa pozycja jest na oceanie
            const tilePos = this.pixelToTilePosition(this.draggedPoint.pixelX, this.draggedPoint.pixelY);
            
            if (!tilePos || !this.isTileOcean(tilePos)) {
                // Jeśli końcowa pozycja nie jest na oceanie, przywróć punkt do ostatniej ważnej pozycji
                // (współrzędne tile pozostały niezmienione w updateDragging)
                this.updatePointPixelFromTileCoords(this.draggedPoint);

            } else {
                // Jeśli pozycja jest ważna, zaktualizuj współrzędne tile
                this.draggedPoint.x = tilePos.x;
                this.draggedPoint.y = tilePos.y;
                this.draggedPoint.chunkX = tilePos.chunkX;
                this.draggedPoint.chunkY = tilePos.chunkY;
                this.draggedPoint.localX = tilePos.localX;
                this.draggedPoint.localY = tilePos.localY;
            }
        }
        
        this.isDragging = false;
        this.draggedPoint = null;
        this.dragOffset.x = 0;
        this.dragOffset.y = 0;
    }

    /**
     * AKTUALIZUJE POZYCJĘ PIXEL PUNKTU NA PODSTAWIE WSPÓŁRZĘDNYCH TILE
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
     * KONWERTUJE POZYCJĘ PIXEL NA POZYCJĘ TILE
     */
    pixelToTilePosition(pixelX, pixelY) {
        if (!this.chunks) return null;
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        
        // Znajdź chunk pod pozycją pixel
        for (const chunk of this.chunks) {
            const chunkPixelX = RENDER_CONSTANTS.CANVAS_PADDING + chunk.x * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkPixelY = RENDER_CONSTANTS.CANVAS_PADDING + chunk.y * (chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE);
            const chunkRight = chunkPixelX + chunkPixelSize;
            const chunkBottom = chunkPixelY + chunkPixelSize;
            
            if (pixelX >= chunkPixelX && pixelX < chunkRight &&
                pixelY >= chunkPixelY && pixelY < chunkBottom) {
                
                // Oblicz lokalną pozycję w chunku
                const localPixelX = pixelX - chunkPixelX;
                const localPixelY = pixelY - chunkPixelY;
                
                const localX = Math.floor(localPixelX / this.settings.tileSize);
                const localY = Math.floor(localPixelY / this.settings.tileSize);
                
                // Walidacja granic - upewnij się że nie wykraczamy poza chunk
                if (localX < 0 || localX >= this.settings.chunkSize || 
                    localY < 0 || localY >= this.settings.chunkSize) {
                    continue; // Przejdź do następnego chunk'a
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
     * SPRAWDZA CZY TILE JEST OCEANEM
     */
    isTileOcean(tilePos) {
        if (!tilePos || !tilePos.chunk) return false;
        
        // Obsługa zarówno 2D jak i 1D format
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
     * OBLICZA DYSTANS LINIOWY MIĘDZY PUNKTAMI
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
     * GETTERY
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
     * AKTUALIZUJE USTAWIENIA
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Aktualizuj rozmiar punktów w zależności od rozmiaru tile
        this.pointRadius = Math.max(6, this.settings.tileSize / 2);
    }
} 