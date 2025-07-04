/**
 * TRANSITION POINTS INSPECTOR - DETAILS PANEL
 */

export class Inspector {
    constructor(inspectorPanelElement, gameDataManager = null) {
        this.inspectorPanel = inspectorPanelElement;
        this.gameDataManager = gameDataManager;
        this.selectedPoint = null;
        this.hoveredPoint = null;
        
        // Configure button listeners
        this.setupDebugButton();
    }

    /**
     * SHOWS INSPECTOR WITH TRANSITION POINT DATA
     */
    showInspector(point, currentGameDataManager = null) {
        if (!this.inspectorPanel) return;
        
        // Use current gameDataManager if passed, otherwise use saved one
        const gameDataManager = currentGameDataManager || this.gameDataManager;
        
        // Generate unique ID for point using current GameDataManager if available
        let pointId;
        let chunksDisplay;
        
        if (gameDataManager) {
            // Use better ID system from current GameDataManager
            const gdPoint = this.findGameDataPoint(point, gameDataManager);
            if (gdPoint) {
                pointId = gdPoint.id;
                chunksDisplay = `${gdPoint.chunks[0]} ↔ ${gdPoint.chunks[1]}`;
            } else {
                // Fallback to old format
                pointId = `${point.chunkA}-${point.chunkB}-${point.direction}`;
                chunksDisplay = `${point.chunkA} ↔ ${point.chunkB}`;
            }
        } else {
            // Old format as fallback
            pointId = `${point.chunkA}-${point.chunkB}-${point.direction}`;
            chunksDisplay = `${point.chunkA} ↔ ${point.chunkB}`;
        }
        
        // Update inspector content
        this.updateInspectorContent(pointId, point, chunksDisplay, gameDataManager);
        
        // Show point info, hide placeholder
        this.showPointInfo();
        
        // Update styles when showing active point
        const isShowingSelectedPoint = this.selectedPoint && 
            this.selectedPoint.chunkA === point.chunkA && 
            this.selectedPoint.chunkB === point.chunkB && 
            this.selectedPoint.x === point.x && 
            this.selectedPoint.y === point.y;
        
        this.updateInspectorStyles(isShowingSelectedPoint);
    }

    /**
     * FINDS CORRESPONDING POINT IN GAMEDATA MANAGER
     */
    findGameDataPoint(point, gameDataManager = null) {
        const gdm = gameDataManager || this.gameDataManager;
        if (!gdm || !gdm.transitionPoints) {
            return null;
        }
        
        // Search for transition point in GameDataManager that corresponds to our point
        return gdm.transitionPoints.find(gdPoint => {
            // Check if chunks match (in any order)
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            const pointMatches = (gdChunkA === point.chunkA && gdChunkB === point.chunkB) ||
                                (gdChunkA === point.chunkB && gdChunkB === point.chunkA);
            
            if (!pointMatches) return false;
            
            // Check position based on direction
            if (point.direction === 'horizontal') {
                // For horizontal points, position is Y relative to chunk
                const localY = point.y % gdm.chunkHeight;
                return gdPoint.position === localY;
            } else if (point.direction === 'vertical') {
                // For vertical points, position is X relative to chunk  
                const localX = point.x % gdm.chunkWidth;
                return gdPoint.position === localX;
            }
            
            return false;
        });
    }

    /**
     * HIDES INSPECTOR (SHOWS PLACEHOLDER)
     */
    hideInspector() {
        if (!this.inspectorPanel) return;
        
        // If there's a selected point, show its data instead of hiding inspector
        if (this.selectedPoint) {
            this.showInspector(this.selectedPoint);
            return;
        }
        
        // Hide point info, show placeholder
        this.showPlaceholder();
        this.updateInspectorStyles(false);
    }

    /**
     * UPDATES INSPECTOR CONTENT
     */
    updateInspectorContent(pointId, point, chunksDisplay, gameDataManager = null) {
        const elements = this.getInspectorElements();
        
        if (elements.detailId) elements.detailId.textContent = pointId;
        if (elements.detailChunks) elements.detailChunks.textContent = chunksDisplay;
        if (elements.detailPosition) elements.detailPosition.textContent = `(${point.x}, ${point.y})`;
        if (elements.detailDirection) elements.detailDirection.textContent = point.direction === 'horizontal' ? 'Horizontal' : 'Vertical';
        if (elements.detailSegmentLength) elements.detailSegmentLength.textContent = `${point.segmentLength} tiles`;
        
        // Add information from GameDataManager if available
        if (gameDataManager) {
            const gdPoint = this.findGameDataPoint(point, gameDataManager);
            if (gdPoint && elements.detailConnections) {
                elements.detailConnections.textContent = `${gdPoint.connections.length} connections`;
            } else if (elements.detailConnections) {
                elements.detailConnections.textContent = 'No data';
            }
            
            // Set debug button state
            if (elements.debugConnectionsBtn) {
                elements.debugConnectionsBtn.disabled = !gdPoint;
                elements.debugConnectionsBtn.title = gdPoint ? 
                    'Display connection details in console' : 
                    'Point not found in GameDataManager';
            }
        } else {
            if (elements.detailConnections) {
                elements.detailConnections.textContent = 'GameDataManager unavailable';
            }
            
            // Disable debug button if GameDataManager unavailable
            if (elements.debugConnectionsBtn) {
                elements.debugConnectionsBtn.disabled = true;
                elements.debugConnectionsBtn.title = 'GameDataManager unavailable';
            }
        }
    }

    /**
     * GETS INSPECTOR DOM ELEMENTS
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
     * SHOWS POINT INFO
     */
    showPointInfo() {
        const elements = this.getInspectorElements();
        
        if (elements.noSelection) elements.noSelection.style.display = 'none';
        if (elements.pointInfo) elements.pointInfo.classList.remove('hidden');
    }

    /**
     * SHOWS PLACEHOLDER
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
     * UPDATES INSPECTOR STYLES
     */
    updateInspectorStyles(isShowingSelectedPoint) {
        const elements = this.getInspectorElements();
        
        // Styles for point data elements
        if (elements.pointInfo) {
            if (isShowingSelectedPoint) {
                elements.pointInfo.classList.add('has-selection');
            } else {
                elements.pointInfo.classList.remove('has-selection');
            }
        }
        
        // Styles for inspector header (only text)
        if (elements.inspectorCard) {
            if (isShowingSelectedPoint) {
                elements.inspectorCard.classList.add('has-selection');
            } else {
                elements.inspectorCard.classList.remove('has-selection');
            }
        }
    }

    /**
     * SETS SELECTED POINT
     */
    setSelectedPoint(point) {
        this.selectedPoint = point;
        if (point) {
            this.showInspector(point);
        }
    }

    /**
     * SETS HOVERED POINT
     */
    setHoveredPoint(point) {
        this.hoveredPoint = point;
    }

    /**
     * CLEARS SELECTION
     */
    clearSelection() {
        this.selectedPoint = null;
        this.hoveredPoint = null;
        this.hideInspector();
    }

    /**
     * GETTERS
     */
    getSelectedPoint() {
        return this.selectedPoint;
    }

    getHoveredPoint() {
        return this.hoveredPoint;
    }

    /**
     * CHECKS IF POINT IS SELECTED
     */
    isPointSelected(point) {
        return this.selectedPoint && 
               this.selectedPoint.chunkA === point.chunkA && 
               this.selectedPoint.chunkB === point.chunkB && 
               this.selectedPoint.x === point.x && 
               this.selectedPoint.y === point.y;
    }

    /**
     * SETS REFERENCE TO GAMEDATA MANAGER
     */
    setGameDataManager(gameDataManager) {
        this.gameDataManager = gameDataManager;
    }

    /**
     * CONFIGURES DEBUG CONNECTION BUTTON
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
     * HANDLES DEBUG CONNECTION BUTTON CLICK
     */
    onDebugConnections() {
        if (!this.selectedPoint) {
            console.warn('🔍 Debug Connections: No selected transition point');
            return;
        }

        if (!this.gameDataManager) {
            console.warn('🔍 Debug Connections: GameDataManager unavailable');
            return;
        }

        // Find corresponding point in GameDataManager
        const gdPoint = this.findGameDataPoint(this.selectedPoint, this.gameDataManager);
        if (gdPoint) {
    
            this.gameDataManager.printPointConnections(gdPoint.id);
        } else {
            console.warn('🔍 Debug Connections: Point not found in GameDataManager');
    
        }
    }
} 