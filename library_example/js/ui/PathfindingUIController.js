/**
 * UI CONTROLLER FOR PATHFINDING SECTION
 */

import { SegmentManager } from '../pathfinding/SegmentManager.js';

export class PathfindingUIController {
    constructor() {
        // UI elements
        this.startPointPosition = document.getElementById('startPointPosition');
        this.startPointCoords = document.getElementById('startPointCoords');
        this.startPointChunk = document.getElementById('startPointChunk');
        
        this.endPointPosition = document.getElementById('endPointPosition');
        this.endPointCoords = document.getElementById('endPointCoords');
        this.endPointChunk = document.getElementById('endPointChunk');
        
        this.linearDistance = document.getElementById('linearDistance');
        this.pathfindingStatus = document.getElementById('pathfindingStatus');
        
        // Buttons
        this.printDataBtn = document.getElementById('printData');
        this.calculateNextSegmentBtn = document.getElementById('calculateNextSegmentBtn');
        
        // Segment management
        this.segmentManager = new SegmentManager();
        
        // Callbacks
        this.onPrintData = null;
        this.onCalculateNextSegment = null;
    }

    /**
     * INITIALIZES EVENT LISTENERS
     */
    setupEventListeners() {
        this.printDataBtn?.addEventListener('click', () => {
            if (this.onPrintData) {
                this.onPrintData();
            }
        });

        this.calculateNextSegmentBtn?.addEventListener('click', () => {
            if (this.onCalculateNextSegment) {
                this.onCalculateNextSegment();
            }
        });
    }

    /**
     * UPDATES START POINT UI
     */
    updateStartPoint(point) {
        if (!point) {
            this.startPointPosition.textContent = 'Not set';
            this.startPointCoords.textContent = '-';
            this.startPointChunk.textContent = '-';
            return;
        }

        this.startPointPosition.textContent = `Tile ${point.x}, ${point.y}`;
        this.startPointCoords.textContent = `(${Math.round(point.pixelX)}, ${Math.round(point.pixelY)})`;
        this.startPointChunk.textContent = `Chunk ${point.chunkX}, ${point.chunkY}`;
    }

    /**
     * UPDATES END POINT UI
     */
    updateEndPoint(point) {
        if (!point) {
            this.endPointPosition.textContent = 'Not set';
            this.endPointCoords.textContent = '-';
            this.endPointChunk.textContent = '-';
            return;
        }

        this.endPointPosition.textContent = `Tile ${point.x}, ${point.y}`;
        this.endPointCoords.textContent = `(${Math.round(point.pixelX)}, ${Math.round(point.pixelY)})`;
        this.endPointChunk.textContent = `Chunk ${point.chunkX}, ${point.chunkY}`;
    }

    /**
     * UPDATES LINEAR DISTANCE
     */
    updateLinearDistance(distance) {
        if (!distance) {
            this.linearDistance.textContent = '-';
            return;
        }

        this.linearDistance.textContent = `${distance.tiles} tiles (${distance.pixels}px)`;
    }

    /**
     * UPDATES PATHFINDING STATUS
     */
    updateStatus(status) {
        this.pathfindingStatus.textContent = status;
    }

    /**
     * UPDATES ALL INFORMATION
     */
    updateAll(pathfindingPointManager) {
        const startPoint = pathfindingPointManager.getStartPoint();
        const endPoint = pathfindingPointManager.getEndPoint();
        
        this.updateStartPoint(startPoint);
        this.updateEndPoint(endPoint);
        
        const distance = pathfindingPointManager.calculateLinearDistance();
        this.updateLinearDistance(distance);
        
        // Update status
        if (!startPoint && !endPoint) {
            this.updateStatus('Waiting for points');
        } else if (!startPoint) {
            this.updateStatus('Missing start point');
        } else if (!endPoint) {
            this.updateStatus('Missing end point');
        } else {
            this.updateStatus('Ready to calculate path');
        }
    }

    /**
     * SETS CALLBACKS
     */
    setCallbacks({ onPrintData, onCalculateNextSegment }) {
        this.onPrintData = onPrintData;
        this.onCalculateNextSegment = onCalculateNextSegment;
    }

    /**
     * SHOWS DRAGGING MESSAGE
     */
    showDraggingMessage(pointType) {
        const message = pointType === 'start' 
            ? 'Dragging start point...' 
            : 'Dragging end point...';
        this.updateStatus(message);
    }

    /**
     * SHOWS ERROR MESSAGE
     */
    showError(message) {
        this.updateStatus(`❌ ${message}`);
        
        // Restore normal status after 3 seconds
        setTimeout(() => {
            this.updateAll(window.app?.pathfindingPointManager);
        }, 3000);
    }

    /**
     * SHOWS SUCCESS MESSAGE
     */
    showSuccess(message) {
        this.updateStatus(`✅ ${message}`);
        
        // Restore normal status after 2 seconds
        setTimeout(() => {
            this.updateAll(window.app?.pathfindingPointManager);
        }, 2000);
    }

    /**
     * SEGMENT MANAGEMENT METHODS
     */

    /**
     * Sets hierarchical path in segment manager
     */
    setHierarchicalPath(pathSegments, startPoint, endPoint) {
        this.segmentManager.setPath(pathSegments, startPoint, endPoint);
        this.updateSegmentButtonState();
    }

    /**
     * Calculates next segment
     */
    calculateNextSegment(pathfinder, getChunkData) {
        const result = this.segmentManager.calculateNext(pathfinder, getChunkData);
        
        if (result) {
            this.showSuccess(`Obliczono segment ${this.segmentManager.getProgress()}`);
            this.updateSegmentButtonState();
            return result;
        } else {
            this.showError('Nie można obliczyć segmentu');
            return null;
        }
    }

    /**
     * Updates segment button state
     */
    updateSegmentButtonState() {
        if (!this.calculateNextSegmentBtn) return;

        if (this.segmentManager.isComplete()) {
            this.calculateNextSegmentBtn.disabled = true;
            this.calculateNextSegmentBtn.textContent = '✅ Wszystkie segmenty obliczone';
        } else if (this.segmentManager.canCalculateNext()) {
            this.calculateNextSegmentBtn.disabled = false;
            this.calculateNextSegmentBtn.textContent = `➡️ Calculate next segment (${this.segmentManager.getProgress()})`;
        } else {
            this.calculateNextSegmentBtn.disabled = true;
            this.calculateNextSegmentBtn.textContent = '➡️ Calculate next segment';
        }
    }

    /**
     * Gets calculated segments
     */
    getCalculatedSegments() {
        return this.segmentManager.getCalculatedSegments();
    }

    /**
     * Checks if segments are complete
     */
    isSegmentsComplete() {
        return this.segmentManager.isComplete();
    }

    /**
     * Resets segment state
     */
    resetSegments() {
        this.segmentManager.reset();
        this.updateSegmentButtonState();
    }

    /**
     * Checks if can calculate next segment
     */
    canCalculateNext() {
        return this.segmentManager.canCalculateNext();
    }
} 