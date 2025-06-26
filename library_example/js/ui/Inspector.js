/**
 * INSPECTOR PUNKTÓW PRZEJŚCIA - PANEL SZCZEGÓŁÓW
 */

export class Inspector {
    constructor(inspectorPanelElement) {
        this.inspectorPanel = inspectorPanelElement;
        this.selectedPoint = null;
        this.hoveredPoint = null;
    }

    /**
     * POKAZUJE INSPECTOR Z DANYMI PUNKTU PRZEJŚCIA
     */
    showInspector(point) {
        if (!this.inspectorPanel) return;
        
        // Wygeneruj unikalne ID dla punktu
        const pointId = `${point.chunkA}-${point.chunkB}-${point.direction}`;
        
        // Zaktualizuj zawartość inspectora
        this.updateInspectorContent(pointId, point);
        
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
    updateInspectorContent(pointId, point) {
        const elements = this.getInspectorElements();
        
        if (elements.detailId) elements.detailId.textContent = pointId;
        if (elements.detailChunks) elements.detailChunks.textContent = `${point.chunkA} ↔ ${point.chunkB}`;
        if (elements.detailPosition) elements.detailPosition.textContent = `(${point.x}, ${point.y})`;
        if (elements.detailDirection) elements.detailDirection.textContent = point.direction === 'horizontal' ? 'Poziomo' : 'Pionowo';
        if (elements.detailSegmentLength) elements.detailSegmentLength.textContent = `${point.segmentLength} kafelków`;
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
} 