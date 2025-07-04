/**
 * USER INTERFACE CONTROLLER
 */

import { ISLAND_PRESETS, capitalizeFirst, RENDER_CONSTANTS } from '../config/Settings.js';
import { getCanvasCoordinates } from '../utils/MathUtils.js';

export class UIController {
    constructor(settings, islandSettings, pathfindingSettings) {
        this.settings = settings;
        this.islandSettings = islandSettings;
        this.pathfindingSettings = pathfindingSettings;
        
        // Callbacks for setting changes
        this.onFullRegenerationNeeded = null;
        this.onSmoothingOnlyNeeded = null;
        this.onRenderOnlyNeeded = null;
        this.onPathfindingUpdate = null;
        this.onExportPNG = null;
        this.onReset = null;
    }

    /**
     * CONFIGURES EVENT LISTENERS
     */
    setupEventListeners() {
        this.setupChunkSettingsListeners();
        this.setupIslandSettingsListeners();
        this.setupPathfindingListeners();
        this.setupButtonListeners();
    }

    /**
     * CHUNK SETTINGS (REQUIRE FULL REGENERATION)
     */
    setupChunkSettingsListeners() {
        // Chunk size
        const chunkSizeSlider = document.getElementById('chunkSize');
        chunkSizeSlider?.addEventListener('input', (e) => {
            this.settings.chunkSize = parseInt(e.target.value);
            document.getElementById('chunkSizeValue').textContent = `${e.target.value}x${e.target.value}`;
            this.triggerFullRegeneration();
        });

        // Number of chunks horizontally
        const chunkColsSlider = document.getElementById('chunkCols');
        chunkColsSlider?.addEventListener('input', (e) => {
            this.settings.chunkCols = parseInt(e.target.value);
            document.getElementById('chunkColsValue').textContent = e.target.value;
            this.triggerFullRegeneration();
        });

        // Number of chunks vertically
        const chunkRowsSlider = document.getElementById('chunkRows');
        chunkRowsSlider?.addEventListener('input', (e) => {
            this.settings.chunkRows = parseInt(e.target.value);
            document.getElementById('chunkRowsValue').textContent = e.target.value;
            this.triggerFullRegeneration();
        });

        // Tile size - only render update
        const tileSizeSlider = document.getElementById('tileSize');
        tileSizeSlider?.addEventListener('input', (e) => {
            this.settings.tileSize = parseInt(e.target.value);
            document.getElementById('tileSizeValue').textContent = `${e.target.value}px`;
            this.triggerRenderOnly();
        });
    }

    /**
     * ISLAND SETTINGS
     */
    setupIslandSettingsListeners() {
        // Preset
        const islandPresetSelect = document.getElementById('islandPreset');
        islandPresetSelect?.addEventListener('change', (e) => {
            this.islandSettings.preset = e.target.value;
            this.updatePresetValues();
            this.triggerFullRegeneration();
        });

        // Land density (requires full regeneration)
        const landDensitySlider = document.getElementById('landDensity');
        landDensitySlider?.addEventListener('input', (e) => {
            this.islandSettings.landDensity = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('landDensityValue').textContent = `${e.target.value}%`;
            this.triggerFullRegeneration();
        });

        // Iterations (smoothing only)
        const iterationsSlider = document.getElementById('iterations');
        iterationsSlider?.addEventListener('input', (e) => {
            this.islandSettings.iterations = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('iterationsValue').textContent = e.target.value;
            this.triggerSmoothingOnly();
        });

        // Neighbor threshold (smoothing only)
        const neighborThresholdSlider = document.getElementById('neighborThreshold');
        neighborThresholdSlider?.addEventListener('input', (e) => {
            this.islandSettings.neighborThreshold = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('neighborThresholdValue').textContent = e.target.value;
            this.triggerSmoothingOnly();
        });

        // Archipelago mode (smoothing only)
        const archipelagoModeCheckbox = document.getElementById('archipelagoMode');
        archipelagoModeCheckbox?.addEventListener('change', (e) => {
            this.islandSettings.archipelagoMode = e.target.checked;
            this.markAsCustomPreset();
            this.triggerSmoothingOnly();
        });

        // Island size (requires full regeneration)
        const islandSizeSelect = document.getElementById('islandSize');
        islandSizeSelect?.addEventListener('change', (e) => {
            this.islandSettings.islandSize = e.target.value;
            this.markAsCustomPreset();
            document.getElementById('islandSizeValue').textContent = capitalizeFirst(e.target.value);
            this.triggerFullRegeneration();
        });
    }

    /**
     * PATHFINDING SETTINGS
     */
    setupPathfindingListeners() {
        // Maximum number of transition points
        const maxTransitionPointsSlider = document.getElementById('maxTransitionPoints');
        maxTransitionPointsSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.maxTransitionPoints = parseInt(e.target.value);
            document.getElementById('maxTransitionPointsValue').textContent = e.target.value;
            this.triggerPathfindingUpdate();
        });

        // Transition point scale
        const transitionPointScaleSlider = document.getElementById('transitionPointScale');
        transitionPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.transitionPointScale = parseFloat(e.target.value);
            document.getElementById('transitionPointScaleValue').textContent = e.target.value + 'x';
            this.triggerRenderOnly();
        });

        // Pathfinding cross scale
        const pathfindingPointScaleSlider = document.getElementById('pathfindingPointScale');
        pathfindingPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.pathfindingPointScale = parseFloat(e.target.value);
            document.getElementById('pathfindingPointScaleValue').textContent = e.target.value + 'x';
            this.triggerRenderOnly();
        });

        // Show/hide transition points
        const showTransitionPointsCheckbox = document.getElementById('showTransitionPoints');
        showTransitionPointsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showTransitionPoints = e.target.checked;
            this.triggerRenderOnly();
        });

        // Show/hide connection weights
        const showConnectionWeightsCheckbox = document.getElementById('showConnectionWeights');
        showConnectionWeightsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showConnectionWeights = e.target.checked;
            this.triggerRenderOnly();
        });
    }

    /**
     * BUTTONS
     */
    setupButtonListeners() {
        document.getElementById('regenerateBtn')?.addEventListener('click', () => {
            this.triggerFullRegeneration();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.triggerReset();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.triggerExportPNG();
        });
    }

    /**
     * CONFIGURES CANVAS INTERACTIVITY
     */
    setupCanvasInteractivity(canvas, inspector, transitionPointManager) {
        // Mouse movement handling
        canvas.addEventListener('mousemove', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, canvas);
            
            // Update mouse position in UI
            this.updateMousePosition(mouseX, mouseY);
            
            if (!this.pathfindingSettings.showTransitionPoints) {
                inspector.hideInspector();
                return;
            }

            const hoveredPoint = transitionPointManager.getTransitionPointAt(mouseX, mouseY);

            if (hoveredPoint) {
                inspector.setHoveredPoint(hoveredPoint);
                canvas.classList.add('pointer-cursor');
                inspector.showInspector(hoveredPoint);
            } else {
                inspector.setHoveredPoint(null);
                canvas.classList.remove('pointer-cursor');
                
                if (inspector.getSelectedPoint()) {
                    inspector.showInspector(inspector.getSelectedPoint());
                } else {
                    inspector.hideInspector();
                }
            }
        });

        // Hide inspector when mouse leaves canvas
        canvas.addEventListener('mouseleave', () => {
            inspector.setHoveredPoint(null);
            canvas.classList.remove('pointer-cursor');
            if (!inspector.getSelectedPoint()) {
                inspector.hideInspector();
            }
            
            // Clear mouse position
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = '-';
            }
        });

        // Click handling
        canvas.addEventListener('click', (e) => {
            if (!this.pathfindingSettings.showTransitionPoints) return;

            const { mouseX, mouseY } = getCanvasCoordinates(e, canvas);
            const clickedPoint = transitionPointManager.getTransitionPointAt(mouseX, mouseY);

            if (clickedPoint) {
                inspector.setSelectedPoint(clickedPoint);
        
                this.triggerRenderOnly(); // Refresh render to show active point
            } else {
                inspector.clearSelection();
                this.triggerRenderOnly();
            }
        });
    }

    /**
     * UPDATES PRESET VALUES
     */
    updatePresetValues() {
        if (this.islandSettings.preset === 'custom') return;

        const preset = ISLAND_PRESETS[this.islandSettings.preset];
        if (preset) {
            this.islandSettings.landDensity = Math.round(preset.landDensity * 100);
            this.islandSettings.iterations = preset.iterations;
            this.islandSettings.neighborThreshold = preset.neighborThreshold;
            this.islandSettings.archipelagoMode = preset.archipelagoMode;
            this.islandSettings.islandSize = preset.islandSize;

            this.updateUIFromSettings();
        }
    }

    /**
     * UPDATES UI BASED ON CURRENT SETTINGS
     */
    updateUIFromSettings() {
        // Update sliders
        document.getElementById('landDensity').value = this.islandSettings.landDensity;
        document.getElementById('landDensityValue').textContent = `${this.islandSettings.landDensity}%`;
        document.getElementById('iterations').value = this.islandSettings.iterations;
        document.getElementById('iterationsValue').textContent = this.islandSettings.iterations;
        document.getElementById('neighborThreshold').value = this.islandSettings.neighborThreshold;
        document.getElementById('neighborThresholdValue').textContent = this.islandSettings.neighborThreshold;
        document.getElementById('archipelagoMode').checked = this.islandSettings.archipelagoMode;
        document.getElementById('islandSize').value = this.islandSettings.islandSize;
        document.getElementById('islandSizeValue').textContent = capitalizeFirst(this.islandSettings.islandSize);
    }

    /**
     * MARKS PRESET AS CUSTOM
     */
    markAsCustomPreset() {
        this.islandSettings.preset = 'custom';
        document.getElementById('islandPreset').value = 'custom';
    }

    /**
     * UPDATES STATISTICS
     */
    updateStats(chunks, transitionPoints) {
        const totalChunks = this.settings.chunkCols * this.settings.chunkRows;
        const totalTiles = totalChunks * this.settings.chunkSize * this.settings.chunkSize;
        
        // Count island tiles
        let islandTiles = 0;
        chunks.forEach(chunk => {
            chunk.tiles.forEach(tile => {
                if (tile === 1) islandTiles++;
            });
        });
        
        const islandPercentage = Math.round((islandTiles / totalTiles) * 100);
        
        // Update DOM elements
        document.getElementById('totalChunks').textContent = totalChunks;
        document.getElementById('totalTiles').textContent = totalTiles;
        document.getElementById('islandPercentage').textContent = `${islandPercentage}%`;
        document.getElementById('totalTransitionPoints').textContent = transitionPoints.length;
    }

    /**
     * RESETS SETTINGS
     */
    resetToDefaults() {
        // Reset basic settings
        this.settings.chunkCols = 8;
        this.settings.chunkRows = 6;
        this.settings.chunkSize = 11;
        this.settings.tileSize = 16;

        this.islandSettings.preset = 'archipelago';
        this.islandSettings.landDensity = 27;
        this.islandSettings.iterations = 4;
        this.islandSettings.neighborThreshold = 4;
        this.islandSettings.archipelagoMode = true;
        this.islandSettings.islandSize = 'medium';

        this.pathfindingSettings.maxTransitionPoints = 3;
        this.pathfindingSettings.showTransitionPoints = true;
        this.pathfindingSettings.showConnectionWeights = true;
        this.pathfindingSettings.transitionPointScale = 1.0;
        this.pathfindingSettings.pathfindingPointScale = 2.0;

        this.resetUI();
    }

    /**
     * RESETS UI TO DEFAULT VALUES
     */
    resetUI() {
        // Reset basic sliders
        document.getElementById('chunkSize').value = 11;
        document.getElementById('chunkCols').value = 8;
        document.getElementById('chunkRows').value = 6;
        document.getElementById('tileSize').value = 16;

        // Reset basic labels
        document.getElementById('chunkSizeValue').textContent = '11x11';
        document.getElementById('chunkColsValue').textContent = '8';
        document.getElementById('chunkRowsValue').textContent = '6';
        document.getElementById('tileSizeValue').textContent = '16px';

        // Reset island controls
        document.getElementById('islandPreset').value = 'archipelago';
        this.updatePresetValues();

        // Reset pathfinding controls
        document.getElementById('maxTransitionPoints').value = 3;
        document.getElementById('transitionPointScale').value = 1.0;
        document.getElementById('pathfindingPointScale').value = 2.0;
        document.getElementById('showTransitionPoints').checked = true;
        document.getElementById('showConnectionWeights').checked = true;

        // Reset pathfinding labels
        document.getElementById('maxTransitionPointsValue').textContent = '3';
        document.getElementById('transitionPointScaleValue').textContent = '1.0x';
        document.getElementById('pathfindingPointScaleValue').textContent = '2.0x';

        // Reset seed display
        const seedElement = document.getElementById('mapSeed');
        if (seedElement) {
            seedElement.textContent = '-';
        }
    }

    /**
     * TRIGGERS FOR CALLBACKS
     */
    triggerFullRegeneration() {
        if (this.onFullRegenerationNeeded) {
            this.onFullRegenerationNeeded();
        }
    }

    triggerSmoothingOnly() {
        if (this.onSmoothingOnlyNeeded) {
            this.onSmoothingOnlyNeeded();
        }
    }

    triggerRenderOnly() {
        if (this.onRenderOnlyNeeded) {
            this.onRenderOnlyNeeded();
        }
    }

    triggerPathfindingUpdate() {
        if (this.onPathfindingUpdate) {
            this.onPathfindingUpdate();
        }
    }

    triggerExportPNG() {
        if (this.onExportPNG) {
            this.onExportPNG();
        }
    }

    triggerReset() {
        if (this.onReset) {
            this.onReset();
        }
    }

    /**
     * SETTERS FOR CALLBACKS
     */
    setCallbacks({
        onFullRegenerationNeeded,
        onSmoothingOnlyNeeded,
        onRenderOnlyNeeded,
        onPathfindingUpdate,
        onExportPNG,
        onReset
    }) {
        this.onFullRegenerationNeeded = onFullRegenerationNeeded;
        this.onSmoothingOnlyNeeded = onSmoothingOnlyNeeded;
        this.onRenderOnlyNeeded = onRenderOnlyNeeded;
        this.onPathfindingUpdate = onPathfindingUpdate;
        this.onExportPNG = onExportPNG;
        this.onReset = onReset;
    }

    /**
     * UPDATES MOUSE POSITION IN UI
     */
    updateMousePosition(mouseX, mouseY) {
        // Account for CANVAS_PADDING - subtract padding from mouse position
        const adjustedMouseX = mouseX - RENDER_CONSTANTS.CANVAS_PADDING;
        const adjustedMouseY = mouseY - RENDER_CONSTANTS.CANVAS_PADDING;
        
        // Check if mouse is in padding area (outside chunks)
        if (adjustedMouseX < 0 || adjustedMouseY < 0) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Outside map area';
            }
            return;
        }
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const chunkWithGapSize = chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE;
        
        // Find chunk based on position (accounting for gaps)
        const chunkX = Math.floor(adjustedMouseX / chunkWithGapSize);
        const chunkY = Math.floor(adjustedMouseY / chunkWithGapSize);
        
        // Check if we're not going beyond the map
        if (chunkX >= this.settings.chunkCols || chunkY >= this.settings.chunkRows) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Outside map area';
            }
            return;
        }
        
        // Calculate local position in chunk
        const localPixelX = adjustedMouseX - (chunkX * chunkWithGapSize);
        const localPixelY = adjustedMouseY - (chunkY * chunkWithGapSize);
        
        // Check if we're not in gap between chunks
        if (localPixelX >= chunkPixelSize || localPixelY >= chunkPixelSize) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Between chunks';
            }
            return;
        }
        
        // Calculate local tile position in chunk
        const localX = Math.floor(localPixelX / this.settings.tileSize);
        const localY = Math.floor(localPixelY / this.settings.tileSize);
        
        // Calculate global tile position
        const tileX = chunkX * this.settings.chunkSize + localX;
        const tileY = chunkY * this.settings.chunkSize + localY;
        
        // Calculate tile center in pixels (relative to original canvas with padding)
        const globalX = tileX * this.settings.tileSize + this.settings.tileSize / 2 + RENDER_CONSTANTS.CANVAS_PADDING + chunkX * RENDER_CONSTANTS.GAP_SIZE;
        const globalY = tileY * this.settings.tileSize + this.settings.tileSize / 2 + RENDER_CONSTANTS.CANVAS_PADDING + chunkY * RENDER_CONSTANTS.GAP_SIZE;
        
        const positionText = `(${globalX.toFixed(0)}, ${globalY.toFixed(0)}) | Tile: (${tileX}, ${tileY}) | Chunk: ${chunkX},${chunkY} [${localX},${localY}]`;
        
        const mousePositionElement = document.getElementById('mousePosition');
        if (mousePositionElement) {
            mousePositionElement.textContent = positionText;
        } else {
            console.warn('mousePosition element not found!');
        }
    }

    /**
     * UPDATES SEED DISPLAY
     */
    updateSeed(seed) {
        const seedElement = document.getElementById('mapSeed');
        if (seedElement) {
            seedElement.textContent = seed != null ? seed : '-';
        }
    }
} 