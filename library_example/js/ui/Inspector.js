/**
 * INSPECTOR PUNKTÓW PRZEJŚCIA - PANEL SZCZEGÓŁÓW
 */

export class Inspector {
    constructor(inspectorPanelElement, gameDataManager = null) {
        this.inspectorPanel = inspectorPanelElement;
        this.gameDataManager = gameDataManager;
        this.selectedPoint = null;
        this.hoveredPoint = null;
        
        // Konfiguruj listenery przycisków
        this.setupDebugButton();
    }

    /**
     * POKAZUJE INSPECTOR Z DANYMI PUNKTU PRZEJŚCIA
     */
    showInspector(point, currentGameDataManager = null) {
        if (!this.inspectorPanel) return;
        
        // Użyj aktualnego gameDataManager jeśli został przekazany, inaczej użyj zapisanego
        const gameDataManager = currentGameDataManager || this.gameDataManager;
        
        // Wygeneruj unikalne ID dla punktu używając aktualnego GameDataManager jeśli dostępny
        let pointId;
        let chunksDisplay;
        
        if (gameDataManager) {
            // Użyj lepszego systemu ID z aktualnego GameDataManager
            const gdPoint = this.findGameDataPoint(point, gameDataManager);
            if (gdPoint) {
                pointId = gdPoint.id;
                chunksDisplay = `${gdPoint.chunks[0]} ↔ ${gdPoint.chunks[1]}`;
            } else {
                // Fallback na stary format
                pointId = `${point.chunkA}-${point.chunkB}-${point.direction}`;
                chunksDisplay = `${point.chunkA} ↔ ${point.chunkB}`;
            }
        } else {
            // Stary format jako fallback
            pointId = `${point.chunkA}-${point.chunkB}-${point.direction}`;
            chunksDisplay = `${point.chunkA} ↔ ${point.chunkB}`;
        }
        
        // Zaktualizuj zawartość inspectora
        this.updateInspectorContent(pointId, point, chunksDisplay, gameDataManager);
        
        // Pokaż info punktu, ukryj placeholder
        this.showPointInfo();
        
        // Aktualizuj style gdy pokazujemy aktywny punkt
        const isShowingSelectedPoint = this.selectedPoint && 
            this.selectedPoint.chunkA === point.chunkA && 
            this.selectedPoint.chunkB === point.chunkB && 
            this.selectedPoint.x === point.x && 
            this.selectedPoint.y === point.y;
        
        this.updateInspectorStyles(isShowingSelectedPoint);
    }

    /**
     * ZNAJDUJE ODPOWIEDNI PUNKT W GAMEDATA MANAGER
     */
    findGameDataPoint(point, gameDataManager = null) {
        const gdm = gameDataManager || this.gameDataManager;
        if (!gdm || !gdm.transitionPoints) {
            return null;
        }
        
        // Szukaj punktu przejścia w GameDataManager który odpowiada naszemu punktowi
        return gdm.transitionPoints.find(gdPoint => {
            // Sprawdź czy chunk'i się zgadzają (w dowolnej kolejności)
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            const pointMatches = (gdChunkA === point.chunkA && gdChunkB === point.chunkB) ||
                                (gdChunkA === point.chunkB && gdChunkB === point.chunkA);
            
            if (!pointMatches) return false;
            
            // Sprawdź pozycję na podstawie kierunku
            if (point.direction === 'horizontal') {
                // Dla punktów poziomych pozycja to Y względem chunka
                const localY = point.y % gdm.chunkHeight;
                return gdPoint.position === localY;
            } else if (point.direction === 'vertical') {
                // Dla punktów pionowych pozycja to X względem chunka  
                const localX = point.x % gdm.chunkWidth;
                return gdPoint.position === localX;
            }
            
            return false;
        });
    }

    /**
     * UKRYWA INSPECTOR (POKAZUJE PLACEHOLDER)
     */
    hideInspector() {
        if (!this.inspectorPanel) return;
        
        // Jeśli jest zaznaczony punkt, pokaż jego dane zamiast ukrywać inspektor
        if (this.selectedPoint) {
            this.showInspector(this.selectedPoint);
            return;
        }
        
        // Ukryj info punktu, pokaż placeholder
        this.showPlaceholder();
        this.updateInspectorStyles(false);
    }

    /**
     * AKTUALIZUJE ZAWARTOŚĆ INSPECTORA
     */
    updateInspectorContent(pointId, point, chunksDisplay, gameDataManager = null) {
        const elements = this.getInspectorElements();
        
        if (elements.detailId) elements.detailId.textContent = pointId;
        if (elements.detailChunks) elements.detailChunks.textContent = chunksDisplay;
        if (elements.detailPosition) elements.detailPosition.textContent = `(${point.x}, ${point.y})`;
        if (elements.detailDirection) elements.detailDirection.textContent = point.direction === 'horizontal' ? 'Poziomo' : 'Pionowo';
        if (elements.detailSegmentLength) elements.detailSegmentLength.textContent = `${point.segmentLength} kafelków`;
        
        // Dodaj informacje z GameDataManager jeśli dostępne
        if (gameDataManager) {
            const gdPoint = this.findGameDataPoint(point, gameDataManager);
            if (gdPoint && elements.detailConnections) {
                elements.detailConnections.textContent = `${gdPoint.connections.length} połączeń`;
            } else if (elements.detailConnections) {
                elements.detailConnections.textContent = 'Brak danych';
            }
            
            // Ustaw stan przycisku debug
            if (elements.debugConnectionsBtn) {
                elements.debugConnectionsBtn.disabled = !gdPoint;
                elements.debugConnectionsBtn.title = gdPoint ? 
                    'Wyświetl szczegóły połączeń w konsoli' : 
                    'Punkt nie znaleziony w GameDataManager';
            }
        } else {
            if (elements.detailConnections) {
                elements.detailConnections.textContent = 'GameDataManager niedostępny';
            }
            
            // Wyłącz przycisk debug jeśli GameDataManager niedostępny
            if (elements.debugConnectionsBtn) {
                elements.debugConnectionsBtn.disabled = true;
                elements.debugConnectionsBtn.title = 'GameDataManager niedostępny';
            }
        }
    }

    /**
     * POBIERA ELEMENTY DOM INSPECTORA
     */
    getInspectorElements() {
        return {
            detailId: document.getElementById('detailId'),
            detailChunks: document.getElementById('detailChunks'),
            detailPosition: document.getElementById('detailPosition'),
            detailDirection: document.getElementById('detailDirection'),
            detailSegmentLength: document.getElementById('detailSegmentLength'),
            detailConnections: document.getElementById('detailConnections'),
            debugConnectionsBtn: document.getElementById('debugConnectionsBtn'),
            noSelection: this.inspectorPanel.querySelector('.no-selection'),
            pointInfo: document.getElementById('selectedPointInfo'),
            inspectorCard: this.inspectorPanel.closest('.transition-point-inspector')
        };
    }

    /**
     * POKAZUJE INFO PUNKTU
     */
    showPointInfo() {
        const elements = this.getInspectorElements();
        
        if (elements.noSelection) elements.noSelection.style.display = 'none';
        if (elements.pointInfo) elements.pointInfo.classList.remove('hidden');
    }

    /**
     * POKAZUJE PLACEHOLDER
     */
    showPlaceholder() {
        const elements = this.getInspectorElements();
        
        if (elements.noSelection) elements.noSelection.style.display = 'flex';
        if (elements.pointInfo) {
            elements.pointInfo.classList.add('hidden');
            elements.pointInfo.classList.remove('has-selection');
        }
    }

    /**
     * AKTUALIZUJE STYLE INSPECTORA
     */
    updateInspectorStyles(isShowingSelectedPoint) {
        const elements = this.getInspectorElements();
        
        // Style dla elementów danych punktu
        if (elements.pointInfo) {
            if (isShowingSelectedPoint) {
                elements.pointInfo.classList.add('has-selection');
            } else {
                elements.pointInfo.classList.remove('has-selection');
            }
        }
        
        // Style dla nagłówka inspektora (tylko napis)
        if (elements.inspectorCard) {
            if (isShowingSelectedPoint) {
                elements.inspectorCard.classList.add('has-selection');
            } else {
                elements.inspectorCard.classList.remove('has-selection');
            }
        }
    }

    /**
     * USTAWIA ZAZNACZONY PUNKT
     */
    setSelectedPoint(point) {
        this.selectedPoint = point;
        if (point) {
            this.showInspector(point);
        }
    }

    /**
     * USTAWIA NAJECHANY PUNKT
     */
    setHoveredPoint(point) {
        this.hoveredPoint = point;
    }

    /**
     * CZYŚCI ZAZNACZENIE
     */
    clearSelection() {
        this.selectedPoint = null;
        this.hoveredPoint = null;
        this.hideInspector();
    }

    /**
     * GETTERY
     */
    getSelectedPoint() {
        return this.selectedPoint;
    }

    getHoveredPoint() {
        return this.hoveredPoint;
    }

    /**
     * SPRAWDZA CZY PUNKT JEST ZAZNACZONY
     */
    isPointSelected(point) {
        return this.selectedPoint && 
               this.selectedPoint.chunkA === point.chunkA && 
               this.selectedPoint.chunkB === point.chunkB && 
               this.selectedPoint.x === point.x && 
               this.selectedPoint.y === point.y;
    }

    /**
     * USTAWIA REFERENCJĘ DO GAMEDATA MANAGER
     */
    setGameDataManager(gameDataManager) {
        this.gameDataManager = gameDataManager;
    }

    /**
     * KONFIGURUJE PRZYCISK DEBUG POŁĄCZEŃ
     */
    setupDebugButton() {
        const debugBtn = document.getElementById('debugConnectionsBtn');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.onDebugConnections();
            });
        }
    }

    /**
     * OBSŁUGUJE KLIKNIĘCIE PRZYCISKU DEBUG POŁĄCZEŃ
     */
    onDebugConnections() {
        if (!this.selectedPoint) {
            console.warn('🔍 Debug Połączeń: Brak zaznaczonego punktu przejścia');
            return;
        }

        if (!this.gameDataManager) {
            console.warn('🔍 Debug Połączeń: GameDataManager niedostępny');
            return;
        }

        // Znajdź odpowiedni punkt w GameDataManager
        const gdPoint = this.findGameDataPoint(this.selectedPoint, this.gameDataManager);
        if (gdPoint) {
    
            this.gameDataManager.printPointConnections(gdPoint.id);
        } else {
            console.warn('🔍 Debug Połączeń: Nie znaleziono punktu w GameDataManager');
    
        }
    }
} 