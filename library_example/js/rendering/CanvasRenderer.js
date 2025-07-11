/**
 * CANVAS RENDERER - MAP AND TRANSITION POINTS RENDERING
 */

import { COLORS, RENDER_CONSTANTS } from '../config/Settings.js';

export class CanvasRenderer {
    constructor(canvas, settings, pathfindingSettings) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = settings;
        this.pathfindingSettings = pathfindingSettings;
        
        // Zoom properties
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomStep = 0.2;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseWheelZoomEnabled = false; // Disabled by default on Mac
    }

    /**
     * RENDERS ENTIRE MAP
     */
    renderMap(chunks, chunkManager, transitionPoints, activePoint = null, pathfindingPoints = null, gameDataManager = null, pathSegments = null, calculatedSegments = null) {
        const canvasSize = chunkManager.calculateCanvasSize();
        
        // Set canvas size
        this.canvas.width = canvasSize.width;
        this.canvas.height = canvasSize.height;
        
        // Clear canvas (background)
        this.ctx.fillStyle = COLORS.chunkBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Render each chunk
        chunks.forEach(chunk => {
            chunkManager.renderChunk(this.ctx, chunk);
        });

        // Render connection lines BEFORE transition points (so they're underneath)
        if (this.pathfindingSettings.showTransitionPoints && gameDataManager) {
            this.renderAllConnectionLines(transitionPoints, gameDataManager);
        }

        // Render calculated pathfinding path (green dashed lines)
        if (pathSegments && pathSegments.length > 0) {
            this.renderPathSegments(pathSegments, calculatedSegments);
        }

        // ETAP 4: Render local paths for calculated segments
        if (calculatedSegments && calculatedSegments.length > 0) {
            this.renderLocalPaths(calculatedSegments);
        }

        // Render transition points if enabled
        if (this.pathfindingSettings.showTransitionPoints && transitionPoints.length > 0) {
            this.renderTransitionPoints(transitionPoints, activePoint);
        }
        
        // Render pathfinding points if they exist
        if (pathfindingPoints) {
            this.renderPathfindingPoints(pathfindingPoints);
        }
        
        // Restore context
        this.ctx.restore();
    }

    /**
     * RENDERS TRANSITION POINTS
     */
    renderTransitionPoints(transitionPoints, activePoint = null) {
        const baseBorderSize = Math.max(this.settings.tileSize * 0.5, 10);
        const borderSize = baseBorderSize * this.pathfindingSettings.transitionPointScale;
        
        transitionPoints.forEach(point => {
            // Use pre-calculated coordinates if they exist
            if (!point.pixelX || !point.pixelY) return;

            const pixelX = point.pixelX;
            const pixelY = point.pixelY;
            
            // Check if point is active (selected or hovered)
            const isActive = activePoint && 
                           activePoint.chunkA === point.chunkA && 
                           activePoint.chunkB === point.chunkB && 
                           activePoint.x === point.x && 
                           activePoint.y === point.y;
            
            // Adjust size for active point
            const currentBorderSize = isActive ? borderSize * 1.3 : borderSize;
            const halfSize = currentBorderSize / 2;

            // Calculate square position - square should overlap both chunks
            // For horizontal: extend in X direction (left-right)
            // For vertical: extend in Y direction (up-down)
            let rectX, rectY, rectWidth, rectHeight;
            
            if (point.direction === 'horizontal') {
                // Point on vertical border - square stretched horizontally
                rectWidth = currentBorderSize * 1.5; // Wider to overlap both chunks
                rectHeight = currentBorderSize;
                rectX = pixelX - rectWidth / 2;
                rectY = pixelY - rectHeight / 2;
            } else {
                // Point on horizontal border - square stretched vertically
                rectWidth = currentBorderSize;
                rectHeight = currentBorderSize * 1.5; // Taller to overlap both chunks
                rectX = pixelX - rectWidth / 2;
                rectY = pixelY - rectHeight / 2;
            }

            // Draw transition point as transparent square with border
            
            // Square shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(rectX + 2, rectY + 2, rectWidth, rectHeight);
            
            // Transparent fill
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
            
            // Square border - red for normal, green for active
            this.ctx.strokeStyle = isActive ? '#00ff00' : '#ff4444';
            this.ctx.lineWidth = Math.max(2, currentBorderSize / 10);
            this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
            
            // Inner border for better visibility
            if (currentBorderSize >= 16) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(rectX + 2, rectY + 2, rectWidth - 4, rectHeight - 4);
            }
            
            // Optionally: small circle in center for position identification
            this.ctx.fillStyle = isActive ? '#00ff00' : '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(pixelX, pixelY, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /**
     * RENDERS PATHFINDING POINTS (START AND END)
     */
    renderPathfindingPoints(pathfindingPointManager) {
        const startPoint = pathfindingPointManager.getStartPoint();
        const endPoint = pathfindingPointManager.getEndPoint();
        const draggedPoint = pathfindingPointManager.getDraggedPoint();
        
        // Render start point (green cross)
        if (startPoint) {
            this.renderSinglePathfindingPoint(startPoint, '#00ff00', '', startPoint === draggedPoint);
        }
        
        // Render end point (red cross)
        if (endPoint) {
            this.renderSinglePathfindingPoint(endPoint, '#ff4444', '', endPoint === draggedPoint);
        }
    }

    /**
     * RENDERS SINGLE PATHFINDING POINT AS PIRATE CROSS ROTATED 45°
     */
    renderSinglePathfindingPoint(point, color, emoji, isDragged = false) {
        const baseSize = Math.max(12, this.settings.tileSize / 1.5);
        const scaledSize = baseSize * this.pathfindingSettings.pathfindingPointScale;
        const currentSize = isDragged ? scaledSize * 1.3 : scaledSize;
        const halfSize = currentSize / 2;
        
        const x = point.pixelX;
        const y = point.pixelY;
        
        // Save context state and rotate by 45 degrees
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Math.PI / 4); // 45 degrees in radians
        
        // Cross shadow (offset by shadow offset after rotation)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = Math.max(4, currentSize / 4) + 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Horizontal shadow line (offset by shadow in local coordinates)
        this.ctx.moveTo(-halfSize + 1.5, 1.5);
        this.ctx.lineTo(halfSize + 1.5, 1.5);
        // Vertical shadow line  
        this.ctx.moveTo(1.5, -halfSize + 1.5);
        this.ctx.lineTo(1.5, halfSize + 1.5);
        this.ctx.stroke();
        
        // Main cross
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Math.max(4, currentSize / 4);
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Horizontal line
        this.ctx.moveTo(-halfSize, 0);
        this.ctx.lineTo(halfSize, 0);
        // Vertical line
        this.ctx.moveTo(0, -halfSize);
        this.ctx.lineTo(0, halfSize);
        this.ctx.stroke();
        
        // White cross border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = Math.max(2, currentSize / 6);
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        // Horizontal line
        this.ctx.moveTo(-halfSize, 0);
        this.ctx.lineTo(halfSize, 0);
        // Vertical line
        this.ctx.moveTo(0, -halfSize);
        this.ctx.lineTo(0, halfSize);
        this.ctx.stroke();
        
        // Middle circle for better visibility
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.max(3, currentSize / 8), 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Restore context state
        this.ctx.restore();
        
        // Pulsing border if dragged (without rotation)
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
     * RENDERS ALL ACTIVE CONNECTION LINES (SELECTED + HOVER)
     */
    renderAllConnectionLines(allTransitionPoints, gameDataManager) {
        // Render connections for selected point (green lines)
        if (this.selectedPoint) {
            this.renderConnectionLines(this.selectedPoint, allTransitionPoints, gameDataManager, {
                color: '#00ff00',  // Green for selected
                lineWidth: 2.7,    // Reduced by 10% (3 * 0.9)
                dashPattern: [10, 5],
                showArrows: false  // Removed arrows
            });
        }
        
        // Render connections for hovered point (orange lines)
        if (this.hoveredPoint && (!this.selectedPoint || this.hoveredPoint !== this.selectedPoint)) {
            const hoveredId = `${this.hoveredPoint.chunkA}-${this.hoveredPoint.chunkB}`;
            const selectedId = this.selectedPoint ? `${this.selectedPoint.chunkA}-${this.selectedPoint.chunkB}` : null;
            
            if (hoveredId !== selectedId) {
                this.renderConnectionLines(this.hoveredPoint, allTransitionPoints, gameDataManager, {
                    color: '#ff8800',  // Orange for hover
                    lineWidth: 1.8,    // Reduced by 10% (2 * 0.9)
                    dashPattern: [8, 4],
                    showArrows: false  // Already removed, but for consistency
                });
            }
        }
    }

    /**
     * RENDERS CONNECTION LINES BETWEEN TRANSITION POINTS
     */
    renderConnectionLines(selectedPoint, allTransitionPoints, gameDataManager, style = null) {
        // Default style if not provided
        const defaultStyle = {
            color: '#00ff00',
            lineWidth: 3,
            dashPattern: [10, 5],
            showArrows: true
        };
        const currentStyle = style || defaultStyle;

        // Find ID of selected point in GameDataManager
        const selectedPointId = this.findPointIdInGameData(selectedPoint, gameDataManager);
        if (!selectedPointId) {
            return;
        }

        // Get connections for selected point
        const connections = gameDataManager.getConnections(selectedPointId);
        if (!connections || connections.length === 0) {
            return;
        }

        // Set style for lines
        this.ctx.strokeStyle = currentStyle.color;
        this.ctx.lineWidth = currentStyle.lineWidth;
        this.ctx.setLineDash(currentStyle.dashPattern);
        this.ctx.lineCap = 'round';

        // Draw line for each connection
        connections.forEach(connection => {
            // Handle new format with weights and old format
            const connectedPointId = typeof connection === 'string' ? connection : connection.id;
            const weight = typeof connection === 'object' && connection.weight ? connection.weight : 1;
            
            const connectedPoint = this.findTransitionPointById(connectedPointId, allTransitionPoints, gameDataManager);
            if (connectedPoint && connectedPoint.pixelX && connectedPoint.pixelY) {
                // Draw line from selected point to connected point
                this.ctx.beginPath();
                this.ctx.moveTo(selectedPoint.pixelX, selectedPoint.pixelY);
                this.ctx.lineTo(connectedPoint.pixelX, connectedPoint.pixelY);
                this.ctx.stroke();

                // Add arrow at end of line (optional)
                if (currentStyle.showArrows) {
                    this.drawArrowHead(selectedPoint.pixelX, selectedPoint.pixelY, 
                                     connectedPoint.pixelX, connectedPoint.pixelY);
                }
                
                // Draw connection weight in middle of line
                if (typeof connection === 'object' && connection.weight && this.pathfindingSettings.showConnectionWeights) {
                    this.drawConnectionWeight(selectedPoint.pixelX, selectedPoint.pixelY,
                                            connectedPoint.pixelX, connectedPoint.pixelY, weight);
                }
            }
        });

        // Restore default styles
        this.ctx.setLineDash([]);
    }

    /**
     * FIND POINT ID IN GAMEDATA MANAGER
     */
    findPointIdInGameData(point, gameDataManager) {
        // Convert point from TransitionPointManager to GameDataManager format
        const chunkA = point.chunkA.replace('_', ',');
        const chunkB = point.chunkB.replace('_', ',');
        
        // Determine position based on direction
        let position;
        if (point.direction === 'vertical') {
            position = point.x % this.settings.chunkSize;
        } else {
            position = point.y % this.settings.chunkSize;
        }
        
        // Find point in GameDataManager
        const gameDataPoint = gameDataManager.transitionPoints.find(gdPoint => {
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            return (gdChunkA === chunkA && gdChunkB === chunkB && gdPoint.position === position) ||
                   (gdChunkA === chunkB && gdChunkB === chunkA && gdPoint.position === position);
        });
        
        return gameDataPoint ? gameDataPoint.id : null;
    }

    /**
     * FIND TRANSITION POINT BY ID IN RENDERING DATA
     */
    findTransitionPointById(pointId, allTransitionPoints, gameDataManager) {
        // Get point data from GameDataManager
        const gameDataPoint = gameDataManager.getTransitionPointById(pointId);
        if (!gameDataPoint) {
            return null;
        }

        // Find corresponding point in allTransitionPoints (has pixelX/pixelY)
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
     * DRAWS ARROW AT END OF LINE
     */
    drawArrowHead(fromX, fromY, toX, toY) {
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6; // 30 degrees

        // Calculate line angle
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Calculate arrow points
        const arrowX1 = toX - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = toY - arrowLength * Math.sin(angle - arrowAngle);
        
        const arrowX2 = toX - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = toY - arrowLength * Math.sin(angle + arrowAngle);
        
        // Draw arrow
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(arrowX1, arrowY1);
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(arrowX2, arrowY2);
        this.ctx.stroke();
    }

    /**
     * DRAWS CONNECTION WEIGHT ON LINE
     */
    drawConnectionWeight(fromX, fromY, toX, toY, weight) {
        // Calculate line midpoint
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        
        // Save current context state
        this.ctx.save();
        
        // Set style for text
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Text background (to be visible)
        const text = weight.toString();
        const textMetrics = this.ctx.measureText(text);
        const padding = 4;
        const bgWidth = textMetrics.width + padding * 2;
        const bgHeight = 16;
        
        // Draw background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
        
        // Draw border
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        this.ctx.strokeRect(midX - bgWidth/2, midY - bgHeight/2, bgWidth, bgHeight);
        
        // Draw text
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(text, midX, midY);
        
        // Restore context state
        this.ctx.restore();
    }

    /**
     * EXPORTS CANVAS TO PNG
     */
    exportToPNG(presetName, chunkCols, chunkRows) {
        const link = document.createElement('a');
        link.download = `island-map-${presetName}-${chunkCols}x${chunkRows}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    /**
     * UPDATES RENDERER SETTINGS
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    updatePathfindingSettings(newPathfindingSettings) {
        this.pathfindingSettings = { ...this.pathfindingSettings, ...newPathfindingSettings };
    }

    /**
     * GETTER FOR CANVAS
     */
    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    /**
     * RENDERS PATHFINDING PATH BASED ON SEGMENTS
     * @param {Array} pathSegments - Array of segments [{chunk, position}, ...]
     * @param {Array} calculatedSegments - Array of calculated segments to skip lines
     */
    renderPathSegments(pathSegments, calculatedSegments = null) {
        if (!pathSegments || pathSegments.length < 2) {
            return; // Need at least 2 points to draw line
        }

        // Create set of calculated chunk IDs for quick lookup
        const calculatedChunkIds = new Set();
        if (calculatedSegments) {
            calculatedSegments.forEach(segment => {
                calculatedChunkIds.add(segment.chunkId);
            });
        }

        // Set style for path - green dashed lines
        this.ctx.save();
        this.ctx.strokeStyle = '#00ff00'; // Green color
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]); // Dashed line
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw lines between consecutive segments, but skip calculated ones
        this.ctx.beginPath();
        
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            
            // Convert world position to pixel position on canvas
            const pixelPos = this.worldToPixel(segment.position);
            
            if (i === 0) {
                // First point - start path
                this.ctx.moveTo(pixelPos.x, pixelPos.y);
            } else {
                // Check if current segment is calculated - if so, don't draw line TO it
                if (calculatedChunkIds.has(segment.chunk)) {
                    // Don't draw line to this segment, but start new path from it
                    this.ctx.moveTo(pixelPos.x, pixelPos.y);
                } else {
                    // Draw line to this segment
                    this.ctx.lineTo(pixelPos.x, pixelPos.y);
                }
            }
        }
        
        this.ctx.stroke();
        
        // Add squares at path nodes for better visibility
        pathSegments.forEach((segment, index) => {
            const pixelPos = this.worldToPixel(segment.position);
            
            // Square size - smaller than tile
            const squareSize = Math.max(8, this.settings.tileSize * 0.6);
            const halfSize = squareSize / 2;
            
            // Set different colors for start/end vs intermediate points
            let fillColor, strokeColor;
            if (index === 0) {
                // Start point - blue (to distinguish from transition points)
                fillColor = '#4499ff';
                strokeColor = '#ffffff';
            } else if (index === pathSegments.length - 1) {
                // End point - dark green
                fillColor = '#00aa00';
                strokeColor = '#ffffff';
            } else {
                // Intermediate points (transition points) - green
                fillColor = '#00ff00';
                strokeColor = '#ffffff';
            }
            
            // Draw square
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(pixelPos.x - halfSize, pixelPos.y - halfSize, squareSize, squareSize);
            
            // White border for better visibility
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([]);
            this.ctx.strokeRect(pixelPos.x - halfSize, pixelPos.y - halfSize, squareSize, squareSize);
            
            // Restore line style
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([10, 5]);
        });

        this.ctx.restore();
    }

    /**
     * CONVERTS WORLD POSITION TO PIXEL POSITION ON CANVAS
     * @param {Object} worldPos - World position {x, y}
     * @returns {Object} - Pixel position {x, y}
     */
    worldToPixel(worldPos) {
        // Calculate in which chunk position is
        const chunkSize = this.settings.chunkSize * this.settings.tileSize;
        const chunkX = Math.floor(worldPos.x / chunkSize);
        const chunkY = Math.floor(worldPos.y / chunkSize);
        
        // Calculate local position in chunk
        const localX = worldPos.x % chunkSize;
        const localY = worldPos.y % chunkSize;
        
        // Calculate pixel position on canvas
        const pixelX = RENDER_CONSTANTS.CANVAS_PADDING + 
                      chunkX * (chunkSize + RENDER_CONSTANTS.GAP_SIZE) + 
                      localX;
        const pixelY = RENDER_CONSTANTS.CANVAS_PADDING + 
                      chunkY * (chunkSize + RENDER_CONSTANTS.GAP_SIZE) + 
                      localY;
        
        return { x: pixelX, y: pixelY };
    }

    /**
     * RENDERS LOCAL PATHS FOR CALCULATED SEGMENTS
     * @param {Array} calculatedSegments - Array of calculated segments with local paths
     */
    renderLocalPaths(calculatedSegments) {
        calculatedSegments.forEach(segment => {
            if (!segment.localPath || segment.localPath.length === 0) {
                return; // Skip segments without local path
            }

            // Set style for local path - green squares on tiles
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.5)'; // Light green with 50% transparency
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;

            // Draw green squares on each tile of the local path
            segment.localPath.forEach(localPos => {
                // Convert local position to world position
                const worldPos = this.localToWorld(localPos, segment.chunkId);
                
                // Convert world position to pixel position
                const pixelPos = this.worldToPixel(worldPos);
                
                // Draw square on tile (smaller than tile size)
                const squareSize = Math.max(4, this.settings.tileSize * 0.6);
                const halfSize = squareSize / 2;
                
                // Draw filled square
                this.ctx.fillRect(
                    pixelPos.x - halfSize, 
                    pixelPos.y - halfSize, 
                    squareSize, 
                    squareSize
                );
                
                // Draw white border
                this.ctx.strokeRect(
                    pixelPos.x - halfSize, 
                    pixelPos.y - halfSize, 
                    squareSize, 
                    squareSize
                );
            });

            this.ctx.restore();
        });
    }

    /**
     * CONVERTS LOCAL POSITION TO WORLD POSITION
     * @param {Object} localPos - Local position {x, y} in chunk
     * @param {string} chunkId - Chunk ID "x,y"
     * @returns {Object} - World position {x, y}
     */
    localToWorld(localPos, chunkId) {
        // Parse chunk coordinates
        const [chunkX, chunkY] = chunkId.split(',').map(Number);
        
        // Calculate chunk world size
        const chunkWorldSize = this.settings.chunkSize * this.settings.tileSize;
        
        // Calculate world position
        const worldX = chunkX * chunkWorldSize + localPos.x * this.settings.tileSize + this.settings.tileSize / 2;
        const worldY = chunkY * chunkWorldSize + localPos.y * this.settings.tileSize + this.settings.tileSize / 2;
        
        return { x: worldX, y: worldY };
    }

    /**
     * ZOOM METHODS
     */
    
    /**
     * ZOOMS IN
     */
    zoomIn() {
        const newZoom = Math.min(this.zoom + this.zoomStep, this.maxZoom);
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            this.updateZoomButtons();
            return true;
        }
        return false;
    }

    /**
     * ZOOMS OUT
     */
    zoomOut() {
        const newZoom = Math.max(this.zoom - this.zoomStep, this.minZoom);
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            this.updateZoomButtons();
            return true;
        }
        return false;
    }

    /**
     * RESETS ZOOM AND PAN
     */
    resetZoom() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomButtons();
        return true;
    }

    /**
     * ZOOMS TO SPECIFIC LEVEL
     */
    setZoom(zoomLevel) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoomLevel));
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            this.updateZoomButtons();
            return true;
        }
        return false;
    }

    /**
     * UPDATES ZOOM BUTTON STATES
     */
    updateZoomButtons() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomResetBtn = document.getElementById('zoomResetBtn');
        const zoomLevelElement = document.getElementById('zoomLevel');
        const toggleMouseZoomBtn = document.getElementById('toggleMouseZoomBtn');
        const mouseZoomIcon = document.getElementById('mouseZoomIcon');

        if (zoomInBtn) {
            zoomInBtn.disabled = this.zoom >= this.maxZoom;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.zoom <= this.minZoom;
        }
        if (zoomResetBtn) {
            zoomResetBtn.disabled = this.zoom === 1.0 && this.panX === 0 && this.panY === 0;
        }
        if (zoomLevelElement) {
            zoomLevelElement.textContent = `${Math.round(this.zoom * 100)}%`;
        }
        if (toggleMouseZoomBtn && mouseZoomIcon) {
            if (this.mouseWheelZoomEnabled) {
                toggleMouseZoomBtn.classList.add('active');
                mouseZoomIcon.textContent = '✅';
                toggleMouseZoomBtn.title = 'Mouse wheel zoom: ON (click to disable)';
            } else {
                toggleMouseZoomBtn.classList.remove('active');
                mouseZoomIcon.textContent = '🚫';
                toggleMouseZoomBtn.title = 'Mouse wheel zoom: OFF (click to enable)';
            }
        }
    }

    /**
     * CONVERTS SCREEN COORDINATES TO CANVAS COORDINATES WITH ZOOM
     */
    screenToCanvas(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.zoom,
            y: (screenY - this.panY) / this.zoom
        };
    }

    /**
     * CONVERTS CANVAS COORDINATES TO SCREEN COORDINATES WITH ZOOM
     */
    canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * this.zoom + this.panX,
            y: canvasY * this.zoom + this.panY
        };
    }

    /**
     * STARTS PAN DRAGGING
     */
    startPan(mouseX, mouseY) {
        if (this.zoom <= 1.0) {
            return; // Nie zezwalaj na panowanie przy domyślnym zoomie
        }
        this.isDragging = true;
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * UPDATES PAN DRAGGING
     */
    updatePan(mouseX, mouseY) {
        if (this.isDragging) {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
            
            this.updateZoomButtons();
            return true;
        }
        return false;
    }

    /**
     * STOPS PAN DRAGGING
     */
    stopPan() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    /**
     * GETS CURRENT ZOOM LEVEL
     */
    getZoom() {
        return this.zoom;
    }

    /**
     * GETS CURRENT PAN POSITION
     */
    getPan() {
        return { x: this.panX, y: this.panY };
    }

    /**
     * TOGGLES MOUSE WHEEL ZOOM
     */
    toggleMouseWheelZoom() {
        this.mouseWheelZoomEnabled = !this.mouseWheelZoomEnabled;
        this.updateZoomButtons();
        return this.mouseWheelZoomEnabled;
    }

    /**
     * GETS MOUSE WHEEL ZOOM STATE
     */
    isMouseWheelZoomEnabled() {
        return this.mouseWheelZoomEnabled;
    }
} 