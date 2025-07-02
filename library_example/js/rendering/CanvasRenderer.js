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
    renderMap(chunks, chunkManager, transitionPoints, activePoint = null, pathfindingPoints = null, gameDataManager = null, pathSegments = null) {
        const canvasSize = chunkManager.calculateCanvasSize();
        
        // Ustaw rozmiar canvas
        this.canvas.width = canvasSize.width;
        this.canvas.height = canvasSize.height;
        

        
        // Wyczyść canvas (tło)
        this.ctx.fillStyle = COLORS.chunkBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderuj każdy chunk
        chunks.forEach(chunk => {
            chunkManager.renderChunk(this.ctx, chunk);
        });

        // Renderuj linie połączeń PRZED punktami przejścia (żeby były pod nimi)
        if (this.pathfindingSettings.showTransitionPoints && gameDataManager) {
            this.renderAllConnectionLines(transitionPoints, gameDataManager);
        }

        // Renderuj obliczoną ścieżkę pathfinding (zielone przerywane linie)
        if (pathSegments && pathSegments.length > 0) {
            this.renderPathSegments(pathSegments);
        }

        // Renderuj punkty przejścia jeśli włączone
        if (this.pathfindingSettings.showTransitionPoints && transitionPoints.length > 0) {
            this.renderTransitionPoints(transitionPoints, activePoint);
        }
        
        // Renderuj punkty pathfinding jeśli istnieją
        if (pathfindingPoints) {
            this.renderPathfindingPoints(pathfindingPoints);
        }
    }

    /**
     * RENDERUJE PUNKTY PRZEJŚCIA
     */
    renderTransitionPoints(transitionPoints, activePoint = null) {
        const baseRadius = Math.max(RENDER_CONSTANTS.MIN_POINT_RADIUS, this.settings.tileSize / 3);
        const pointRadius = baseRadius * this.pathfindingSettings.transitionPointScale;
        
        transitionPoints.forEach(point => {
            // Użyj pre-obliczonych współrzędnych, jeśli istnieją
            if (!point.pixelX || !point.pixelY) return;

            const pixelX = point.pixelX;
            const pixelY = point.pixelY;
            
            // Sprawdź czy punkt jest aktywny (zaznaczony lub hover)
            const isActive = activePoint && 
                           activePoint.chunkA === point.chunkA && 
                           activePoint.chunkB === point.chunkB && 
                           activePoint.x === point.x && 
                           activePoint.y === point.y;
            
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
            this.ctx.arc(x, y, currentSize + 5, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    /**
     * RENDERUJE WSZYSTKIE AKTYWNE LINIE POŁĄCZEŃ (SELECTED + HOVER)
     */
    renderAllConnectionLines(allTransitionPoints, gameDataManager) {
        // Renderuj połączenia dla zaznaczonego punktu (zielone linie)
        if (this.selectedPoint) {
            this.renderConnectionLines(this.selectedPoint, allTransitionPoints, gameDataManager, {
                color: '#00ff00',  // Zielony dla selected
                lineWidth: 3,
                dashPattern: [10, 5],
                showArrows: true
            });
        }
        
        // Renderuj połączenia dla hovered punktu (pomarańczowe linie)
        if (this.hoveredPoint && (!this.selectedPoint || this.hoveredPoint !== this.selectedPoint)) {
            const hoveredId = `${this.hoveredPoint.chunkA}-${this.hoveredPoint.chunkB}`;
            const selectedId = this.selectedPoint ? `${this.selectedPoint.chunkA}-${this.selectedPoint.chunkB}` : null;
            
            if (hoveredId !== selectedId) {
                this.renderConnectionLines(this.hoveredPoint, allTransitionPoints, gameDataManager, {
                    color: '#ff8800',  // Pomarańczowy dla hover
                    lineWidth: 2,
                    dashPattern: [8, 4],
                    showArrows: false
                });
            }
        }
    }

    /**
     * RENDERUJE LINIE POŁĄCZEŃ MIĘDZY PUNKTAMI PRZEJŚCIA
     */
    renderConnectionLines(selectedPoint, allTransitionPoints, gameDataManager, style = null) {
        // Domyślny styl jeśli nie podano
        const defaultStyle = {
            color: '#00ff00',
            lineWidth: 3,
            dashPattern: [10, 5],
            showArrows: true
        };
        const currentStyle = style || defaultStyle;

        // Znajdź ID wybranego punktu w formacie GameDataManager
        const selectedPointId = this.findPointIdInGameData(selectedPoint, gameDataManager);
        if (!selectedPointId) {
            return;
        }

        // Pobierz połączenia dla wybranego punktu
        const connections = gameDataManager.getConnections(selectedPointId);
        if (!connections || connections.length === 0) {
            return;
        }

        // Ustaw style dla linii
        this.ctx.strokeStyle = currentStyle.color;
        this.ctx.lineWidth = currentStyle.lineWidth;
        this.ctx.setLineDash(currentStyle.dashPattern);
        this.ctx.lineCap = 'round';

        // Dla każdego połączenia narysuj linię
        connections.forEach(connection => {
            // Obsługa nowego formatu z wagami i starego formatu
            const connectedPointId = typeof connection === 'string' ? connection : connection.id;
            const weight = typeof connection === 'object' && connection.weight ? connection.weight : 1;
            
            const connectedPoint = this.findTransitionPointById(connectedPointId, allTransitionPoints, gameDataManager);
            if (connectedPoint && connectedPoint.pixelX && connectedPoint.pixelY) {
                // Narysuj linię od wybranego punktu do połączonego
                this.ctx.beginPath();
                this.ctx.moveTo(selectedPoint.pixelX, selectedPoint.pixelY);
                this.ctx.lineTo(connectedPoint.pixelX, connectedPoint.pixelY);
                this.ctx.stroke();

                // Dodaj strzałkę na końcu linii (opcjonalne)
                if (currentStyle.showArrows) {
                    this.drawArrowHead(selectedPoint.pixelX, selectedPoint.pixelY, 
                                     connectedPoint.pixelX, connectedPoint.pixelY);
                }
                
                // Narysuj wagę na środku linii
                if (typeof connection === 'object' && connection.weight && this.pathfindingSettings.showConnectionWeights) {
                    this.drawConnectionWeight(selectedPoint.pixelX, selectedPoint.pixelY,
                                            connectedPoint.pixelX, connectedPoint.pixelY, weight);
                }
            }
        });

        // Przywróć domyślne style
        this.ctx.setLineDash([]);
    }

    /**
     * ZNAJDUJE ID PUNKTU W GAMEDATA MANAGER
     */
    findPointIdInGameData(point, gameDataManager) {
        // Konwertuj punkt z TransitionPointManager na format GameDataManager
        const chunkA = point.chunkA.replace('_', ',');
        const chunkB = point.chunkB.replace('_', ',');
        
        // Określ pozycję na podstawie kierunku
        let position;
        if (point.direction === 'vertical') {
            position = point.x % this.settings.chunkSize;
        } else {
            position = point.y % this.settings.chunkSize;
        }
        
        // Znajdź punkt w GameDataManager
        const gameDataPoint = gameDataManager.transitionPoints.find(gdPoint => {
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            return (gdChunkA === chunkA && gdChunkB === chunkB && gdPoint.position === position) ||
                   (gdChunkA === chunkB && gdChunkB === chunkA && gdPoint.position === position);
        });
        
        return gameDataPoint ? gameDataPoint.id : null;
    }

    /**
     * ZNAJDUJE PUNKT PRZEJŚCIA PO ID W DANYCH RENDEROWANIA
     */
    findTransitionPointById(pointId, allTransitionPoints, gameDataManager) {
        // Pobierz dane punktu z GameDataManager
        const gameDataPoint = gameDataManager.getTransitionPointById(pointId);
        if (!gameDataPoint) {
            return null;
        }

        // Znajdź odpowiadający punkt w allTransitionPoints (ma pixelX/pixelY)
        return allTransitionPoints.find(point => {
            const chunkA = point.chunkA.replace('_', ',');
            const chunkB = point.chunkB.replace('_', ',');
            
            let position;
            if (point.direction === 'vertical') {
                position = point.x % this.settings.chunkSize;
            } else {
                position = point.y % this.settings.chunkSize;
            }
            
            const [gdChunkA, gdChunkB] = gameDataPoint.chunks;
            return (gdChunkA === chunkA && gdChunkB === chunkB && gameDataPoint.position === position) ||
                   (gdChunkA === chunkB && gdChunkB === chunkA && gameDataPoint.position === position);
        });
    }

    /**
     * RYSUJE STRZAŁKĘ NA KOŃCU LINII
     */
    drawArrowHead(fromX, fromY, toX, toY) {
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6; // 30 stopni

        // Oblicz kąt linii
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Oblicz punkty strzałki
        const arrowX1 = toX - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = toY - arrowLength * Math.sin(angle - arrowAngle);
        
        const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle);
        
        // Narysuj strzałkę
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(arrowX1, arrowY1);
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(arrowX2, arrowY2);
        this.ctx.stroke();
    }

    /**
     * RYSUJE WAGĘ POŁĄCZENIA NA ŚRODKU LINII
     */
    drawConnectionWeight(fromX, fromY, toX, toY, weight) {
        // Oblicz środek linii
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        // Zapisz obecny stan kontekstu
        this.ctx.save();
        
        // Ustaw style dla tekstu
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Tło dla tekstu (żeby był czytelny)
        const text = weight.toString();
        const textMetrics = this.ctx.measureText(text);
        const padding = 4;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 16;
        
        // Narysuj tło
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
        
        // Narysuj obramowanie
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        this.ctx.strokeRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
        
        // Narysuj tekst
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(text, midX, midY);
        
        // Przywróć stan kontekstu
        this.ctx.restore();
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

    /**
     * RENDERUJE ŚCIEŻKĘ PATHFINDING NA PODSTAWIE SEGMENTÓW
     * @param {Array} pathSegments - Tablica segmentów [{chunk, position}, ...]
     */
    renderPathSegments(pathSegments) {
        if (!pathSegments || pathSegments.length < 2) {
            return; // Potrzebujemy przynajmniej 2 punkty do narysowania linii
        }

        // Ustaw style dla ścieżki - zielone przerywane linie
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff00'; // Zielony kolor
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]); // Przerywana linia
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Rysuj linie między kolejnymi segmentami
        this.ctx.beginPath();
        
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            
            // Konwertuj pozycję świata na pozycję pixel na canvasie
            const pixelPos = this.worldToPixel(segment.position);
            
            if (i === 0) {
                // Pierwszy punkt - rozpocznij ścieżkę
                this.ctx.moveTo(pixelPos.x, pixelPos.y);
            } else {
                // Kolejne punkty - rysuj linie
                this.ctx.lineTo(pixelPos.x, pixelPos.y);
            }
        }
        
        this.ctx.stroke();
        
        // Dodaj kółka na węzłach ścieżki dla lepszej widoczności
        pathSegments.forEach((segment, index) => {
            const pixelPos = this.worldToPixel(segment.position);
            
            // Ustaw różne kolory dla start/end vs punkty pośrednie
            if (index === 0 && segment.chunk === 'start') {
                // Punkt startowy - niebieski (żeby odróżnić od punktów przejścia)
                this.ctx.fillStyle = '#4499ff';
            } else if (index === pathSegments.length - 1) {
                // Punkt końcowy - ciemnozielony
                this.ctx.fillStyle = '#00aa00';
            } else {
                // Punkty pośrednie (punkty przejścia) - zielony
                this.ctx.fillStyle = '#00ff00';
            }
            
            this.ctx.beginPath();
            this.ctx.arc(pixelPos.x, pixelPos.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Białe obramowanie dla lepszej widoczności
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.stroke();
            
            // Przywróć styl linii
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([10, 5]);
        });

        this.ctx.restore();
    }

    /**
     * KONWERTUJE POZYCJĘ ŚWIATA NA POZYCJĘ PIXEL NA CANVASIE
     * @param {Object} worldPos - Pozycja w świecie {x, y}
     * @returns {Object} - Pozycja w pikselach {x, y}
     */
    worldToPixel(worldPos) {
        // Oblicz w jakim chunku znajduje się pozycja
        const chunkSize = this.settings.chunkSize * this.settings.tileSize;
        const chunkX = Math.floor(worldPos.x / chunkSize);
        const chunkY = Math.floor(worldPos.y / chunkSize);
        
        // Oblicz pozycję lokalną w chunku
        const localX = worldPos.x % chunkSize;
        const localY = worldPos.y % chunkSize;
        
        // Oblicz pozycję pixel na canvasie
        const pixelX = RENDER_CONSTANTS.CANVAS_PADDING + 
                      chunkX * (chunkSize + RENDER_CONSTANTS.GAP_SIZE) + 
                      localX;
        const pixelY = RENDER_CONSTANTS.CANVAS_PADDING + 
                      chunkY * (chunkSize + RENDER_CONSTANTS.GAP_SIZE) + 
                      localY;
        
        return { x: pixelX, y: pixelY };
    }
} 