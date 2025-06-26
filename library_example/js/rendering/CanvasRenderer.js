/**
 * RENDERER CANVAS - RENDEROWANIE MAPY I PUNKTÓW PRZEJŚCIA
 */

import { COLORS, RENDER_CONSTANTS } from '../config/Settings.js';

export class CanvasRenderer {
    constructor(canvas, settings, pathfindingSettings) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = settings;
        this.pathfindingSettings = pathfindingSettings;
    }

    /**
     * RENDERUJE CAŁĄ MAPĘ
     */
    renderMap(chunks, chunkManager, transitionPoints, selectedPoint = null, pathfindingPoints = null) {
        const canvasSize = chunkManager.calculateCanvasSize();
        
        // Ustaw rozmiar canvas
        this.canvas.width = canvasSize.width;
        this.canvas.height = canvasSize.height;
        
        // Debug log dla dużych map
        if (this.settings.chunkSize > 8) {
            console.log(`🖼️ Rendering map: ${this.settings.chunkCols}x${this.settings.chunkRows} chunks, ${this.settings.chunkSize}x${this.settings.chunkSize} tiles, canvas: ${this.canvas.width}x${this.canvas.height}`);
        }
        
        // Wyczyść canvas (tło)
        this.ctx.fillStyle = COLORS.chunkBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderuj każdy chunk
        chunks.forEach(chunk => {
            chunkManager.renderChunk(this.ctx, chunk);
        });

        // Renderuj punkty przejścia jeśli włączone
        if (this.pathfindingSettings.showTransitionPoints && transitionPoints.length > 0) {
            if (this.settings.chunkSize > 8) {
                console.log(`🔴 Rendering ${transitionPoints.length} transition points`);
            }
            
            this.renderTransitionPoints(transitionPoints, selectedPoint);
        }
        
        // Renderuj punkty pathfinding jeśli istnieją
        if (pathfindingPoints) {
            this.renderPathfindingPoints(pathfindingPoints);
        }
    }

    /**
     * RENDERUJE PUNKTY PRZEJŚCIA
     */
    renderTransitionPoints(transitionPoints, selectedPoint = null) {
        const baseRadius = Math.max(RENDER_CONSTANTS.MIN_POINT_RADIUS, this.settings.tileSize / 3);
        const pointRadius = baseRadius * this.pathfindingSettings.transitionPointScale;
        
        transitionPoints.forEach(point => {
            // Użyj pre-obliczonych współrzędnych, jeśli istnieją
            if (!point.pixelX || !point.pixelY) return;

            const pixelX = point.pixelX;
            const pixelY = point.pixelY;
            
            // Sprawdź czy punkt jest aktywny (zaznaczony)
            const isActive = selectedPoint && 
                           selectedPoint.chunkA === point.chunkA && 
                           selectedPoint.chunkB === point.chunkB && 
                           selectedPoint.x === point.x && 
                           selectedPoint.y === point.y;
            
            // Dostosuj rozmiar dla aktywnego punktu
            const currentRadius = isActive ? pointRadius * 1.5 : pointRadius;

            // Narysuj punkt przejścia jako koło z lepszą widocznością
            
            // Zewnętrzne obramowanie (cień)
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(pixelX + 1, pixelY + 1, currentRadius + 1, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Główny punkt przejścia
            this.ctx.fillStyle = COLORS.transitionPoint;
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, currentRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Obramowanie - zielone dla aktywnego punktu, białe dla zwykłego
            this.ctx.strokeStyle = isActive ? '#00ff00' : '#ffffff';
            this.ctx.lineWidth = Math.max(2, currentRadius / 3);
            this.ctx.stroke();
            
            // Wewnętrzny punkt dla lepszej widoczności
            if (currentRadius >= 8) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(pixelX, pixelY, Math.max(2, currentRadius / 4), 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
    }

    /**
     * RENDERUJE PUNKTY PATHFINDING (START I KONIEC)
     */
    renderPathfindingPoints(pathfindingPointManager) {
        const startPoint = pathfindingPointManager.getStartPoint();
        const endPoint = pathfindingPointManager.getEndPoint();
        const draggedPoint = pathfindingPointManager.getDraggedPoint();
        
        // Renderuj punkt startowy (zielony krzyżyk)
        if (startPoint) {
            this.renderSinglePathfindingPoint(startPoint, '#00ff00', '', startPoint === draggedPoint);
        }
        
        // Renderuj punkt końcowy (czerwony krzyżyk)
        if (endPoint) {
            this.renderSinglePathfindingPoint(endPoint, '#ff4444', '', endPoint === draggedPoint);
        }
    }

    /**
     * RENDERUJE POJEDYNCZY PUNKT PATHFINDING JAKO KRZYŻYK PIRACKI OBRÓCONY O 45°
     */
    renderSinglePathfindingPoint(point, color, emoji, isDragged = false) {
        const baseSize = Math.max(12, this.settings.tileSize / 1.5);
        const scaledSize = baseSize * this.pathfindingSettings.pathfindingPointScale;
        const currentSize = isDragged ? scaledSize * 1.3 : scaledSize;
        const halfSize = currentSize / 2;
        
        const x = point.pixelX;
        const y = point.pixelY;
        
        // Zapisz stan kontekstu i obróć o 45 stopni
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.PI / 4); // 45 stopni w radianach
        
        // Cień krzyżyka (przesunięty o offset cienia po rotacji)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = Math.max(4, currentSize / 4) + 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Pozioma linia cienia (przesunięta o cień w lokalnych współrzędnych)
        this.ctx.moveTo(-halfSize + 1.5, 1.5);
        this.ctx.lineTo(halfSize + 1.5, 1.5);
        // Pionowa linia cienia  
        this.ctx.moveTo(1.5, -halfSize + 1.5);
        this.ctx.lineTo(1.5, halfSize + 1.5);
        this.ctx.stroke();
        
        // Główny krzyżyk
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Math.max(4, currentSize / 4);
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Pozioma linia
        this.ctx.moveTo(-halfSize, 0);
        this.ctx.lineTo(halfSize, 0);
        // Pionowa linia
        this.ctx.moveTo(0, -halfSize);
        this.ctx.lineTo(0, halfSize);
        this.ctx.stroke();
        
        // Białe obramowanie krzyżyka
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = Math.max(2, currentSize / 6);
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Pozioma linia
        this.ctx.moveTo(-halfSize, 0);
        this.ctx.lineTo(halfSize, 0);
        // Pionowa linia
        this.ctx.moveTo(0, -halfSize);
        this.ctx.lineTo(0, halfSize);
        this.ctx.stroke();
        
        // Środkowe kółko dla lepszej widoczności
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.max(3, currentSize / 8), 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Przywróć stan kontekstu
        this.ctx.restore();
        
        // Pulsujące obramowanie jeśli przeciągany (bez rotacji)
        if (isDragged) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, currentSize + 8, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    /**
     * EKSPORTUJE CANVAS DO PNG
     */
    exportToPNG(presetName, chunkCols, chunkRows) {
        const link = document.createElement('a');
        link.download = `island-map-${presetName}-${chunkCols}x${chunkRows}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    /**
     * AKTUALIZUJE USTAWIENIA RENDERERA
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    updatePathfindingSettings(newPathfindingSettings) {
        this.pathfindingSettings = { ...this.pathfindingSettings, ...newPathfindingSettings };
    }

    /**
     * GETTER DLA CANVAS
     */
    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }
} 