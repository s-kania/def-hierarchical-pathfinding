/**
 * KONTROLER UI DLA SEKCJI PATHFINDING
 */

export class PathfindingUIController {
    constructor() {
        // Elementy UI
        this.startPointPosition = document.getElementById('startPointPosition');
        this.startPointCoords = document.getElementById('startPointCoords');
        this.startPointChunk = document.getElementById('startPointChunk');
        
        this.endPointPosition = document.getElementById('endPointPosition');
        this.endPointCoords = document.getElementById('endPointCoords');
        this.endPointChunk = document.getElementById('endPointChunk');
        
        this.linearDistance = document.getElementById('linearDistance');
        this.pathfindingStatus = document.getElementById('pathfindingStatus');
        
        // Przyciski
        this.clearPathfindingPointsBtn = document.getElementById('clearPathfindingPoints');
        this.calculatePathBtn = document.getElementById('calculatePath');
        this.buildTransitionGraphBtn = document.getElementById('buildTransitionGraph');
        this.printDataBtn = document.getElementById('printData');
        
        // Callbacki
        this.onClearPoints = null;
        this.onCalculatePath = null;
        this.onBuildTransitionGraph = null;
        this.onPrintData = null;
    }

    /**
     * INICJALIZUJE EVENT LISTENERS
     */
    setupEventListeners() {
        this.clearPathfindingPointsBtn?.addEventListener('click', () => {
            if (this.onClearPoints) {
                this.onClearPoints();
            }
        });

        this.calculatePathBtn?.addEventListener('click', () => {
            if (this.onCalculatePath) {
                this.onCalculatePath();
            }
        });

        this.buildTransitionGraphBtn?.addEventListener('click', () => {
            if (this.onBuildTransitionGraph) {
                this.onBuildTransitionGraph();
            }
        });

        this.printDataBtn?.addEventListener('click', () => {
            if (this.onPrintData) {
                this.onPrintData();
            }
        });
    }

    /**
     * AKTUALIZUJE UI PUNKTU STARTOWEGO
     */
    updateStartPoint(point) {
        if (!point) {
            this.startPointPosition.textContent = 'Nie ustawiony';
            this.startPointCoords.textContent = '-';
            this.startPointChunk.textContent = '-';
            return;
        }

        this.startPointPosition.textContent = `Tile ${point.x}, ${point.y}`;
        this.startPointCoords.textContent = `(${Math.round(point.pixelX)}, ${Math.round(point.pixelY)})`;
        this.startPointChunk.textContent = `Chunk ${point.chunkX}, ${point.chunkY}`;
    }

    /**
     * AKTUALIZUJE UI PUNKTU KOŃCOWEGO
     */
    updateEndPoint(point) {
        if (!point) {
            this.endPointPosition.textContent = 'Nie ustawiony';
            this.endPointCoords.textContent = '-';
            this.endPointChunk.textContent = '-';
            return;
        }

        this.endPointPosition.textContent = `Tile ${point.x}, ${point.y}`;
        this.endPointCoords.textContent = `(${Math.round(point.pixelX)}, ${Math.round(point.pixelY)})`;
        this.endPointChunk.textContent = `Chunk ${point.chunkX}, ${point.chunkY}`;
    }

    /**
     * AKTUALIZUJE DYSTANS LINIOWY
     */
    updateLinearDistance(distance) {
        if (!distance) {
            this.linearDistance.textContent = '-';
            return;
        }

        this.linearDistance.textContent = `${distance.tiles} tiles (${distance.pixels}px)`;
    }

    /**
     * AKTUALIZUJE STATUS PATHFINDING
     */
    updateStatus(status) {
        this.pathfindingStatus.textContent = status;
    }

    /**
     * AKTUALIZUJE WSZYSTKIE INFORMACJE
     */
    updateAll(pathfindingPointManager) {
        const startPoint = pathfindingPointManager.getStartPoint();
        const endPoint = pathfindingPointManager.getEndPoint();
        
        this.updateStartPoint(startPoint);
        this.updateEndPoint(endPoint);
        
        const distance = pathfindingPointManager.calculateLinearDistance();
        this.updateLinearDistance(distance);
        
        // Aktualizuj status
        if (!startPoint && !endPoint) {
            this.updateStatus('Oczekuje punktów');
        } else if (!startPoint) {
            this.updateStatus('Brak punktu startowego');
        } else if (!endPoint) {
            this.updateStatus('Brak punktu końcowego');
        } else {
            this.updateStatus('Gotowy do obliczenia ścieżki');
        }
        
        // Aktualizuj stan przycisków
        this.updateButtonStates(pathfindingPointManager);
    }

    /**
     * AKTUALIZUJE STAN PRZYCISKÓW
     */
    updateButtonStates(pathfindingPointManager) {
        const hasPoints = pathfindingPointManager.hasPoints();
        const hasAnyPoint = pathfindingPointManager.getStartPoint() || pathfindingPointManager.getEndPoint();
        
        // Przycisk "Wyczyść punkty" - aktywny jeśli są jakieś punkty
        if (this.clearPathfindingPointsBtn) {
            this.clearPathfindingPointsBtn.disabled = !hasAnyPoint;
        }
        
        // Przycisk "Oblicz ścieżkę" - aktywny jeśli są oba punkty
        if (this.calculatePathBtn) {
            this.calculatePathBtn.disabled = !hasPoints;
        }
    }

    /**
     * USTAWIA CALLBACKI
     */
    setCallbacks({ onClearPoints, onCalculatePath, onBuildTransitionGraph, onPrintData }) {
        this.onClearPoints = onClearPoints;
        this.onCalculatePath = onCalculatePath;
        this.onBuildTransitionGraph = onBuildTransitionGraph;
        this.onPrintData = onPrintData;
    }

    /**
     * POKAZUJE KOMUNIKAT O PRZECIĄGANIU
     */
    showDraggingMessage(pointType) {
        const message = pointType === 'start' 
            ? 'Przeciąganie punktu startowego...' 
            : 'Przeciąganie punktu końcowego...';
        this.updateStatus(message);
    }

    /**
     * POKAZUJE KOMUNIKAT O BŁĘDZIE
     */
    showError(message) {
        this.updateStatus(`❌ ${message}`);
        
        // Przywróć normalny status po 3 sekundach
        setTimeout(() => {
            this.updateAll(window.app?.pathfindingPointManager);
        }, 3000);
    }

    /**
     * POKAZUJE KOMUNIKAT O SUKCESIE
     */
    showSuccess(message) {
        this.updateStatus(`✅ ${message}`);
        
        // Przywróć normalny status po 2 sekundach
        setTimeout(() => {
            this.updateAll(window.app?.pathfindingPointManager);
        }, 2000);
    }
} 