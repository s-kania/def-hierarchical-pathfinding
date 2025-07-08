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
        this.onSaveSettings = null;
        this.onClearSettings = null;
        this.onExportSettings = null;
        this.onImportSettings = null;
        
        // Debouncing for settings save
        this.saveTimeout = null;
    }

    /**
     * CONFIGURES EVENT LISTENERS
     */
    setupEventListeners() {
        this.setupChunkSettingsListeners();
        this.setupIslandSettingsListeners();
        this.setupPathfindingListeners();
        this.setupButtonListeners();
        this.setupSettingsManagementListeners();
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
            this.autoSaveSettings();
            this.triggerFullRegeneration();
        });

        // Number of chunks horizontally
        const chunkColsSlider = document.getElementById('chunkCols');
        chunkColsSlider?.addEventListener('input', (e) => {
            this.settings.chunkCols = parseInt(e.target.value);
            document.getElementById('chunkColsValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerFullRegeneration();
        });

        // Number of chunks vertically
        const chunkRowsSlider = document.getElementById('chunkRows');
        chunkRowsSlider?.addEventListener('input', (e) => {
            this.settings.chunkRows = parseInt(e.target.value);
            document.getElementById('chunkRowsValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerFullRegeneration();
        });

        // Tile size - only render update
        const tileSizeSlider = document.getElementById('tileSize');
        tileSizeSlider?.addEventListener('input', (e) => {
            this.settings.tileSize = parseInt(e.target.value);
            document.getElementById('tileSizeValue').textContent = `${e.target.value}px`;
            this.autoSaveSettings();
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
            this.autoSaveSettings();
            this.triggerFullRegeneration();
        });

        // Land density (requires full regeneration)
        const landDensitySlider = document.getElementById('landDensity');
        landDensitySlider?.addEventListener('input', (e) => {
            this.islandSettings.landDensity = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('landDensityValue').textContent = `${e.target.value}%`;
            this.autoSaveSettings();
            this.triggerFullRegeneration();
        });

        // Iterations (smoothing only)
        const iterationsSlider = document.getElementById('iterations');
        iterationsSlider?.addEventListener('input', (e) => {
            this.islandSettings.iterations = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('iterationsValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerSmoothingOnly();
        });

        // Neighbor threshold (smoothing only)
        const neighborThresholdSlider = document.getElementById('neighborThreshold');
        neighborThresholdSlider?.addEventListener('input', (e) => {
            this.islandSettings.neighborThreshold = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('neighborThresholdValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerSmoothingOnly();
        });

        // Archipelago mode (smoothing only)
        const archipelagoModeCheckbox = document.getElementById('archipelagoMode');
        archipelagoModeCheckbox?.addEventListener('change', (e) => {
            this.islandSettings.archipelagoMode = e.target.checked;
            this.markAsCustomPreset();
            this.autoSaveSettings();
            this.triggerSmoothingOnly();
        });

        // Island size (requires full regeneration)
        const islandSizeSelect = document.getElementById('islandSize');
        islandSizeSelect?.addEventListener('change', (e) => {
            this.islandSettings.islandSize = e.target.value;
            this.markAsCustomPreset();
            document.getElementById('islandSizeValue').textContent = capitalizeFirst(e.target.value);
            this.autoSaveSettings();
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
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // Transition point scale
        const transitionPointScaleSlider = document.getElementById('transitionPointScale');
        transitionPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.transitionPointScale = parseFloat(e.target.value);
            document.getElementById('transitionPointScaleValue').textContent = e.target.value + 'x';
            this.autoSaveSettings();
            this.triggerRenderOnly();
        });

        // Pathfinding cross scale
        const pathfindingPointScaleSlider = document.getElementById('pathfindingPointScale');
        pathfindingPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.pathfindingPointScale = parseFloat(e.target.value);
            document.getElementById('pathfindingPointScaleValue').textContent = e.target.value + 'x';
            this.autoSaveSettings();
            this.triggerRenderOnly();
        });

        // Show/hide transition points
        const showTransitionPointsCheckbox = document.getElementById('showTransitionPoints');
        showTransitionPointsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showTransitionPoints = e.target.checked;
            this.autoSaveSettings();
            this.triggerRenderOnly();
        });

        // Show/hide connection weights
        const showConnectionWeightsCheckbox = document.getElementById('showConnectionWeights');
        showConnectionWeightsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showConnectionWeights = e.target.checked;
            this.autoSaveSettings();
            this.triggerRenderOnly();
        });

        // NEW: Algorithm and heuristic settings
        // Local algorithm
        const localAlgorithmSelect = document.getElementById('localAlgorithm');
        localAlgorithmSelect?.addEventListener('change', (e) => {
            this.pathfindingSettings.localAlgorithm = e.target.value;
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // Local heuristic
        const localHeuristicSelect = document.getElementById('localHeuristic');
        localHeuristicSelect?.addEventListener('change', (e) => {
            this.pathfindingSettings.localHeuristic = e.target.value;
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // Hierarchical heuristic
        const hierarchicalHeuristicSelect = document.getElementById('hierarchicalHeuristic');
        hierarchicalHeuristicSelect?.addEventListener('change', (e) => {
            this.pathfindingSettings.hierarchicalHeuristic = e.target.value;
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // Heuristic weight
        const heuristicWeightSlider = document.getElementById('heuristicWeight');
        heuristicWeightSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.heuristicWeight = parseFloat(e.target.value);
            document.getElementById('heuristicWeightValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // NEW: Transition point method
        const transitionPointMethodSelect = document.getElementById('transitionPointMethod');
        transitionPointMethodSelect?.addEventListener('change', (e) => {
            this.pathfindingSettings.transitionPointMethod = e.target.value;
            this.toggleMarginGroup(e.target.value === 'margin');
            this.toggleMaxPointsGroup(e.target.value !== 'margin');
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
        });

        // NEW: Transition point margin
        const transitionPointMarginSlider = document.getElementById('transitionPointMargin');
        transitionPointMarginSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.transitionPointMargin = parseInt(e.target.value);
            document.getElementById('transitionPointMarginValue').textContent = e.target.value;
            this.autoSaveSettings();
            this.triggerPathfindingUpdate();
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

        // Random Points button - generate random start and end points
        document.getElementById('randomPointsBtn')?.addEventListener('click', () => {
            if (window.app && window.app.generateRandomPathfindingPoints) {
                window.app.generateRandomPathfindingPoints();
                // Update UI after generating points
                if (window.app.pathfindingUIController) {
                    window.app.pathfindingUIController.updateAll(window.app.pathfindingPointManager);
                }
                // Re-render map to show new points
                if (window.app.renderMap) {
                    window.app.renderMap();
                }
                // Show success message
                if (window.app.pathfindingUIController) {
                    window.app.pathfindingUIController.showSuccess('Losowo wygenerowano punkty startowy i końcowy');
                }
            }
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
     * TOGGLES MARGIN GROUP VISIBILITY
     */
    toggleMarginGroup(show) {
        const marginGroup = document.getElementById('marginGroup');
        if (marginGroup) {
            marginGroup.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * TOGGLES MAX POINTS GROUP VISIBILITY
     */
    toggleMaxPointsGroup(show) {
        const maxPointsGroup = document.getElementById('maxPointsGroup');
        if (maxPointsGroup) {
            maxPointsGroup.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * UPDATES UI BASED ON CURRENT SETTINGS
     */
    updateUIFromSettings() {
        console.log('🔄 Updating UI from settings:', {
            map: this.settings,
            island: this.islandSettings,
            pathfinding: this.pathfindingSettings
        });
        console.log('🔄 DOM elements check:', {
            chunkSize: !!document.getElementById('chunkSize'),
            chunkSizeValue: !!document.getElementById('chunkSizeValue'),
            islandPreset: !!document.getElementById('islandPreset'),
            islandPresetValue: !!document.getElementById('islandPresetValue'),
            maxTransitionPoints: !!document.getElementById('maxTransitionPoints'),
            maxTransitionPointsValue: !!document.getElementById('maxTransitionPointsValue')
        });

        try {
            // Update basic map settings
            const chunkSizeEl = document.getElementById('chunkSize');
            const chunkSizeValueEl = document.getElementById('chunkSizeValue');
            if (chunkSizeEl && chunkSizeValueEl) {
                chunkSizeEl.value = this.settings.chunkSize;
                chunkSizeValueEl.textContent = `${this.settings.chunkSize}x${this.settings.chunkSize}`;
            }

            const chunkColsEl = document.getElementById('chunkCols');
            const chunkColsValueEl = document.getElementById('chunkColsValue');
            if (chunkColsEl && chunkColsValueEl) {
                chunkColsEl.value = this.settings.chunkCols;
                chunkColsValueEl.textContent = this.settings.chunkCols;
            }

            const chunkRowsEl = document.getElementById('chunkRows');
            const chunkRowsValueEl = document.getElementById('chunkRowsValue');
            if (chunkRowsEl && chunkRowsValueEl) {
                chunkRowsEl.value = this.settings.chunkRows;
                chunkRowsValueEl.textContent = this.settings.chunkRows;
            }

            const tileSizeEl = document.getElementById('tileSize');
            const tileSizeValueEl = document.getElementById('tileSizeValue');
            if (tileSizeEl && tileSizeValueEl) {
                tileSizeEl.value = this.settings.tileSize;
                tileSizeValueEl.textContent = `${this.settings.tileSize}px`;
            }

            // Update island settings
            const islandPresetEl = document.getElementById('islandPreset');
            const islandPresetValueEl = document.getElementById('islandPresetValue');
            if (islandPresetEl && islandPresetValueEl) {
                islandPresetEl.value = this.islandSettings.preset;
                islandPresetValueEl.textContent = capitalizeFirst(this.islandSettings.preset);
            }

            const landDensityEl = document.getElementById('landDensity');
            const landDensityValueEl = document.getElementById('landDensityValue');
            if (landDensityEl && landDensityValueEl) {
                landDensityEl.value = this.islandSettings.landDensity;
                landDensityValueEl.textContent = `${this.islandSettings.landDensity}%`;
            }

            const iterationsEl = document.getElementById('iterations');
            const iterationsValueEl = document.getElementById('iterationsValue');
            if (iterationsEl && iterationsValueEl) {
                iterationsEl.value = this.islandSettings.iterations;
                iterationsValueEl.textContent = this.islandSettings.iterations;
            }

            const neighborThresholdEl = document.getElementById('neighborThreshold');
            const neighborThresholdValueEl = document.getElementById('neighborThresholdValue');
            if (neighborThresholdEl && neighborThresholdValueEl) {
                neighborThresholdEl.value = this.islandSettings.neighborThreshold;
                neighborThresholdValueEl.textContent = this.islandSettings.neighborThreshold;
            }

            const archipelagoModeEl = document.getElementById('archipelagoMode');
            if (archipelagoModeEl) {
                archipelagoModeEl.checked = this.islandSettings.archipelagoMode;
            }

            const islandSizeEl = document.getElementById('islandSize');
            const islandSizeValueEl = document.getElementById('islandSizeValue');
            if (islandSizeEl && islandSizeValueEl) {
                islandSizeEl.value = this.islandSettings.islandSize;
                islandSizeValueEl.textContent = capitalizeFirst(this.islandSettings.islandSize);
            }
            
            // Update pathfinding settings
            const maxTransitionPointsEl = document.getElementById('maxTransitionPoints');
            const maxTransitionPointsValueEl = document.getElementById('maxTransitionPointsValue');
            if (maxTransitionPointsEl && maxTransitionPointsValueEl) {
                maxTransitionPointsEl.value = this.pathfindingSettings.maxTransitionPoints;
                maxTransitionPointsValueEl.textContent = this.pathfindingSettings.maxTransitionPoints;
            }

            const transitionPointScaleEl = document.getElementById('transitionPointScale');
            const transitionPointScaleValueEl = document.getElementById('transitionPointScaleValue');
            if (transitionPointScaleEl && transitionPointScaleValueEl) {
                transitionPointScaleEl.value = this.pathfindingSettings.transitionPointScale;
                transitionPointScaleValueEl.textContent = `${this.pathfindingSettings.transitionPointScale}x`;
            }

            const pathfindingPointScaleEl = document.getElementById('pathfindingPointScale');
            const pathfindingPointScaleValueEl = document.getElementById('pathfindingPointScaleValue');
            if (pathfindingPointScaleEl && pathfindingPointScaleValueEl) {
                pathfindingPointScaleEl.value = this.pathfindingSettings.pathfindingPointScale;
                pathfindingPointScaleValueEl.textContent = `${this.pathfindingSettings.pathfindingPointScale}x`;
            }

            const showTransitionPointsEl = document.getElementById('showTransitionPoints');
            if (showTransitionPointsEl) {
                showTransitionPointsEl.checked = this.pathfindingSettings.showTransitionPoints;
            }

            const showConnectionWeightsEl = document.getElementById('showConnectionWeights');
            if (showConnectionWeightsEl) {
                showConnectionWeightsEl.checked = this.pathfindingSettings.showConnectionWeights;
            }
            
            // Update algorithm and heuristic settings
            const localAlgorithmEl = document.getElementById('localAlgorithm');
            if (localAlgorithmEl) {
                localAlgorithmEl.value = this.pathfindingSettings.localAlgorithm;
            }

            const localHeuristicEl = document.getElementById('localHeuristic');
            if (localHeuristicEl) {
                localHeuristicEl.value = this.pathfindingSettings.localHeuristic;
            }

            const hierarchicalHeuristicEl = document.getElementById('hierarchicalHeuristic');
            if (hierarchicalHeuristicEl) {
                hierarchicalHeuristicEl.value = this.pathfindingSettings.hierarchicalHeuristic;
            }

            const heuristicWeightEl = document.getElementById('heuristicWeight');
            const heuristicWeightValueEl = document.getElementById('heuristicWeightValue');
            if (heuristicWeightEl && heuristicWeightValueEl) {
                heuristicWeightEl.value = this.pathfindingSettings.heuristicWeight;
                heuristicWeightValueEl.textContent = this.pathfindingSettings.heuristicWeight;
            }

            // NEW: Update transition point method settings
            const transitionPointMethodEl = document.getElementById('transitionPointMethod');
            if (transitionPointMethodEl) {
                transitionPointMethodEl.value = this.pathfindingSettings.transitionPointMethod;
                this.toggleMarginGroup(this.pathfindingSettings.transitionPointMethod === 'margin');
                this.toggleMaxPointsGroup(this.pathfindingSettings.transitionPointMethod !== 'margin');
            }

            const transitionPointMarginEl = document.getElementById('transitionPointMargin');
            const transitionPointMarginValueEl = document.getElementById('transitionPointMarginValue');
            if (transitionPointMarginEl && transitionPointMarginValueEl) {
                transitionPointMarginEl.value = this.pathfindingSettings.transitionPointMargin;
                transitionPointMarginValueEl.textContent = this.pathfindingSettings.transitionPointMargin;
            }


            
            console.log('✅ UI updated from settings successfully');
        } catch (error) {
            console.error('❌ Error updating UI from settings:', error);
        }
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

        this.pathfindingSettings.maxTransitionPoints = 1;
        this.pathfindingSettings.showTransitionPoints = true;
        this.pathfindingSettings.showConnectionWeights = true;
        this.pathfindingSettings.transitionPointScale = 1.0;
        this.pathfindingSettings.pathfindingPointScale = 2.0;
        
        // NEW: Reset algorithm and heuristic settings
        this.pathfindingSettings.localAlgorithm = 'astar';
        this.pathfindingSettings.localHeuristic = 'manhattan';
        this.pathfindingSettings.hierarchicalHeuristic = 'manhattan';
        this.pathfindingSettings.heuristicWeight = 1.0;
        
        // NEW: Reset transition point method settings
        this.pathfindingSettings.transitionPointMethod = 'center';
        this.pathfindingSettings.transitionPointMargin = 2;

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
        document.getElementById('maxTransitionPoints').value = 1;
        document.getElementById('transitionPointScale').value = 1.0;
        document.getElementById('pathfindingPointScale').value = 2.0;
        document.getElementById('showTransitionPoints').checked = true;
        document.getElementById('showConnectionWeights').checked = true;

        // Reset pathfinding labels
        document.getElementById('maxTransitionPointsValue').textContent = '1';
        document.getElementById('transitionPointScaleValue').textContent = '1.0x';
        document.getElementById('pathfindingPointScaleValue').textContent = '2.0x';
        
        // NEW: Reset transition point method controls
        document.getElementById('transitionPointMethod').value = 'center';
        document.getElementById('transitionPointMargin').value = 2;
        document.getElementById('transitionPointMarginValue').textContent = '2';
        this.toggleMarginGroup(false);
        
        // NEW: Reset algorithm and heuristic controls
        document.getElementById('localAlgorithm').value = 'astar';
        document.getElementById('localHeuristic').value = 'manhattan';
        document.getElementById('hierarchicalHeuristic').value = 'manhattan';
        document.getElementById('heuristicWeight').value = 1.0;
        document.getElementById('heuristicWeightValue').textContent = '1.0';

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
        onReset,
        onSaveSettings,
        onClearSettings,
        onExportSettings,
        onImportSettings
    }) {
        this.onFullRegenerationNeeded = onFullRegenerationNeeded;
        this.onSmoothingOnlyNeeded = onSmoothingOnlyNeeded;
        this.onRenderOnlyNeeded = onRenderOnlyNeeded;
        this.onPathfindingUpdate = onPathfindingUpdate;
        this.onExportPNG = onExportPNG;
        this.onReset = onReset;
        this.onSaveSettings = onSaveSettings;
        this.onClearSettings = onClearSettings;
        this.onExportSettings = onExportSettings;
        this.onImportSettings = onImportSettings;
    }

    /**
     * AUTOMATICALLY SAVES SETTINGS WITH DEBOUNCING
     */
    autoSaveSettings() {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set new timeout for saving (500ms debounce)
        this.saveTimeout = setTimeout(() => {
            if (this.onSaveSettings) {
                this.onSaveSettings();
            }
        }, 500);
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

    /**
     * SETS UP SETTINGS MANAGEMENT EVENT LISTENERS
     */
    setupSettingsManagementListeners() {
        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        saveSettingsBtn?.addEventListener('click', () => {
            if (this.onSaveSettings) {
                this.onSaveSettings();
            }
        });

        // Load settings button
        const loadSettingsBtn = document.getElementById('loadSettingsBtn');
        loadSettingsBtn?.addEventListener('click', () => {
            this.showLoadSettingsDialog();
        });

        // Export settings button
        const exportSettingsBtn = document.getElementById('exportSettingsBtn');
        exportSettingsBtn?.addEventListener('click', () => {
            if (this.onExportSettings) {
                this.onExportSettings();
            }
        });

        // Import settings button
        const importSettingsBtn = document.getElementById('importSettingsBtn');
        importSettingsBtn?.addEventListener('click', () => {
            this.showImportSettingsDialog();
        });

        // Clear settings button
        const clearSettingsBtn = document.getElementById('clearSettingsBtn');
        clearSettingsBtn?.addEventListener('click', () => {
            this.showClearSettingsConfirmation();
        });

        // Import/Export area buttons
        const applySettingsBtn = document.getElementById('applySettingsBtn');
        applySettingsBtn?.addEventListener('click', () => {
            this.applyImportedSettings();
        });

        const copySettingsBtn = document.getElementById('copySettingsBtn');
        copySettingsBtn?.addEventListener('click', () => {
            this.copySettingsToClipboard();
        });

        const closeImportExportBtn = document.getElementById('closeImportExportBtn');
        closeImportExportBtn?.addEventListener('click', () => {
            this.hideImportExportArea();
        });
    }

    /**
     * SHOWS LOAD SETTINGS DIALOG
     */
    showLoadSettingsDialog() {
        if (confirm('Load saved settings? This will replace current settings.')) {
            location.reload(); // Simple reload to load saved settings
        }
    }

    /**
     * SHOWS IMPORT SETTINGS DIALOG
     */
    showImportSettingsDialog() {
        const importExportArea = document.querySelector('.import-export-area');
        const settingsJson = document.getElementById('settingsJson');
        
        if (importExportArea && settingsJson) {
            importExportArea.style.display = 'block';
            settingsJson.value = '';
            settingsJson.placeholder = 'Paste settings JSON here...';
        }
    }

    /**
     * SHOWS CLEAR SETTINGS CONFIRMATION
     */
    showClearSettingsConfirmation() {
        if (confirm('Clear all saved settings? This action cannot be undone.')) {
            if (this.onClearSettings) {
                this.onClearSettings();
            }
        }
    }

    /**
     * APPLIES IMPORTED SETTINGS
     */
    applyImportedSettings() {
        const settingsJson = document.getElementById('settingsJson');
        if (!settingsJson || !settingsJson.value.trim()) {
            alert('Please paste settings JSON first.');
            return;
        }

        try {
            if (this.onImportSettings) {
                const success = this.onImportSettings(settingsJson.value);
                if (success) {
                    this.hideImportExportArea();
                    alert('Settings imported successfully! Page will reload.');
                    location.reload();
                } else {
                    alert('Failed to import settings. Please check the JSON format.');
                }
            }
        } catch (error) {
            alert('Error importing settings: ' + error.message);
        }
    }

    /**
     * COPIES SETTINGS TO CLIPBOARD
     */
    copySettingsToClipboard() {
        const settingsJson = document.getElementById('settingsJson');
        if (settingsJson && settingsJson.value) {
            navigator.clipboard.writeText(settingsJson.value).then(() => {
                alert('Settings copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy to clipboard. Please copy manually.');
            });
        } else {
            alert('No settings to copy.');
        }
    }

    /**
     * HIDES IMPORT/EXPORT AREA
     */
    hideImportExportArea() {
        const importExportArea = document.querySelector('.import-export-area');
        if (importExportArea) {
            importExportArea.style.display = 'none';
        }
    }

    /**
     * UPDATES SETTINGS STATUS DISPLAY
     */
    updateSettingsStatus() {
        const savedStatus = document.getElementById('settingsSavedStatus');
        const lastSavedTime = document.getElementById('lastSavedTime');
        
        if (savedStatus) {
            const hasSettings = localStorage.getItem('settingsVersion') !== null;
            savedStatus.textContent = hasSettings ? '✅ Yes' : '❌ No';
        }
        
        if (lastSavedTime) {
            const lastSaved = localStorage.getItem('lastSavedTime');
            lastSavedTime.textContent = lastSaved ? new Date(parseInt(lastSaved)).toLocaleString() : '-';
        }
    }

    /**
     * SHOWS SUCCESS MESSAGE
     */
    showSuccess(message) {
        // Simple alert for now, could be enhanced with toast notifications
        console.log('✅ ' + message);
    }

    /**
     * SHOWS ERROR MESSAGE
     */
    showError(message) {
        // Simple alert for now, could be enhanced with toast notifications
        console.error('❌ ' + message);
    }
} 