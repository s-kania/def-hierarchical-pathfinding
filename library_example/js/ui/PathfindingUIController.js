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
        
        // Przyciski (tylko te które zostały)
        this.printDataBtn = document.getElementById('printData');
        
        // Callbacki
        this.onPrintData = null;
    }

    /**
     * INICJALIZUJE EVENT LISTENERS
     */
    setupEventListeners() {
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
    }

    /**
     * USTAWIA CALLBACKI
     */
    setCallbacks({ onPrintData }) {
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