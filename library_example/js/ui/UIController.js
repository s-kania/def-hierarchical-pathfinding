/**
 * KONTROLER INTERFEJSU UŻYTKOWNIKA
 */

import { ISLAND_PRESETS, capitalizeFirst } from '../config/Settings.js';
import { getCanvasCoordinates } from '../utils/MathUtils.js';

export class UIController {
    constructor(settings, islandSettings, pathfindingSettings) {
        this.settings = settings;
        this.islandSettings = islandSettings;
        this.pathfindingSettings = pathfindingSettings;
        
        // Callbacki dla zmian ustawień
        this.onFullRegenerationNeeded = null;
        this.onSmoothingOnlyNeeded = null;
        this.onRenderOnlyNeeded = null;
        this.onPathfindingUpdate = null;
        this.onExportPNG = null;
        this.onReset = null;
    }

    /**
     * KONFIGURUJE EVENT LISTENERS
     */
    setupEventListeners() {
        this.setupChunkSettingsListeners();
        this.setupIslandSettingsListeners();
        this.setupPathfindingListeners();
        this.setupButtonListeners();
    }

    /**
     * USTAWIENIA CHUNKÓW (WYMAGAJĄ PEŁNEJ REGENERACJI)
     */
    setupChunkSettingsListeners() {
        // Rozmiar chunków
        const chunkSizeSlider = document.getElementById('chunkSize');
        chunkSizeSlider?.addEventListener('input', (e) => {
            this.settings.chunkSize = parseInt(e.target.value);
            document.getElementById('chunkSizeValue').textContent = `${e.target.value}x${e.target.value}`;
            this.triggerFullRegeneration();
        });

        // Liczba chunków w poziomie
        const chunkColsSlider = document.getElementById('chunkCols');
        chunkColsSlider?.addEventListener('input', (e) => {
            this.settings.chunkCols = parseInt(e.target.value);
            document.getElementById('chunkColsValue').textContent = e.target.value;
            this.triggerFullRegeneration();
        });

        // Liczba chunków w pionie
        const chunkRowsSlider = document.getElementById('chunkRows');
        chunkRowsSlider?.addEventListener('input', (e) => {
            this.settings.chunkRows = parseInt(e.target.value);
            document.getElementById('chunkRowsValue').textContent = e.target.value;
            this.triggerFullRegeneration();
        });

        // Rozmiar tile - tylko aktualizacja renderowania
        const tileSizeSlider = document.getElementById('tileSize');
        tileSizeSlider?.addEventListener('input', (e) => {
            this.settings.tileSize = parseInt(e.target.value);
            document.getElementById('tileSizeValue').textContent = `${e.target.value}px`;
            this.triggerRenderOnly();
        });
    }

    /**
     * USTAWIENIA WYSP
     */
    setupIslandSettingsListeners() {
        // Preset
        const islandPresetSelect = document.getElementById('islandPreset');
        islandPresetSelect?.addEventListener('change', (e) => {
            this.islandSettings.preset = e.target.value;
            this.updatePresetValues();
            this.triggerFullRegeneration();
        });

        // Gęstość lądu (wymaga pełnej regeneracji)
        const landDensitySlider = document.getElementById('landDensity');
        landDensitySlider?.addEventListener('input', (e) => {
            this.islandSettings.landDensity = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('landDensityValue').textContent = `${e.target.value}%`;
            this.triggerFullRegeneration();
        });

        // Iteracje (tylko smoothing)
        const iterationsSlider = document.getElementById('iterations');
        iterationsSlider?.addEventListener('input', (e) => {
            this.islandSettings.iterations = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('iterationsValue').textContent = e.target.value;
            this.triggerSmoothingOnly();
        });

        // Próg sąsiadów (tylko smoothing)
        const neighborThresholdSlider = document.getElementById('neighborThreshold');
        neighborThresholdSlider?.addEventListener('input', (e) => {
            this.islandSettings.neighborThreshold = parseInt(e.target.value);
            this.markAsCustomPreset();
            document.getElementById('neighborThresholdValue').textContent = e.target.value;
            this.triggerSmoothingOnly();
        });

        // Tryb archipelagu (tylko smoothing)
        const archipelagoModeCheckbox = document.getElementById('archipelagoMode');
        archipelagoModeCheckbox?.addEventListener('change', (e) => {
            this.islandSettings.archipelagoMode = e.target.checked;
            this.markAsCustomPreset();
            this.triggerSmoothingOnly();
        });

        // Rozmiar wysp (wymaga pełnej regeneracji)
        const islandSizeSelect = document.getElementById('islandSize');
        islandSizeSelect?.addEventListener('change', (e) => {
            this.islandSettings.islandSize = e.target.value;
            this.markAsCustomPreset();
            document.getElementById('islandSizeValue').textContent = capitalizeFirst(e.target.value);
            this.triggerFullRegeneration();
        });
    }

    /**
     * USTAWIENIA PATHFINDING
     */
    setupPathfindingListeners() {
        // Maksymalna liczba punktów przejścia
        const maxTransitionPointsSlider = document.getElementById('maxTransitionPoints');
        maxTransitionPointsSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.maxTransitionPoints = parseInt(e.target.value);
            document.getElementById('maxTransitionPointsValue').textContent = e.target.value;
            this.triggerPathfindingUpdate();
        });

        // Skala punktów przejścia
        const transitionPointScaleSlider = document.getElementById('transitionPointScale');
        transitionPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.transitionPointScale = parseFloat(e.target.value);
            document.getElementById('transitionPointScaleValue').textContent = e.target.value + 'x';
            this.triggerRenderOnly();
        });

        // Pokazuj/ukryj punkty przejścia
        const showTransitionPointsCheckbox = document.getElementById('showTransitionPoints');
        showTransitionPointsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showTransitionPoints = e.target.checked;
            this.triggerRenderOnly();
        });
    }

    /**
     * PRZYCISKI
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
     * KONFIGURUJE INTERAKTYWNOŚĆ CANVAS
     */
    setupCanvasInteractivity(canvas, inspector, transitionPointManager) {
        // Obsługa ruchu myszy
        canvas.addEventListener('mousemove', (e) => {
            if (!this.pathfindingSettings.showTransitionPoints) {
                inspector.hideInspector();
                return;
            }

            const { mouseX, mouseY } = getCanvasCoordinates(e, canvas);
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

        // Ukryj inspector gdy mysz opuści canvas
        canvas.addEventListener('mouseleave', () => {
            inspector.setHoveredPoint(null);
            canvas.classList.remove('pointer-cursor');
            if (!inspector.getSelectedPoint()) {
                inspector.hideInspector();
            }
        });

        // Obsługa kliknięcia
        canvas.addEventListener('click', (e) => {
            if (!this.pathfindingSettings.showTransitionPoints) return;

            const { mouseX, mouseY } = getCanvasCoordinates(e, canvas);
            const clickedPoint = transitionPointManager.getTransitionPointAt(mouseX, mouseY);

            if (clickedPoint) {
                inspector.setSelectedPoint(clickedPoint);
                console.log('🧭 Kliknięto punkt przejścia:', clickedPoint);
                this.triggerRenderOnly(); // Odśwież render aby pokazać aktywny punkt
            } else {
                inspector.clearSelection();
                this.triggerRenderOnly();
            }
        });
    }

    /**
     * AKTUALIZUJE WARTOŚCI PRESETU
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
     * AKTUALIZUJE UI NA PODSTAWIE AKTUALNYCH USTAWIEŃ
     */
    updateUIFromSettings() {
        // Aktualizuj suwaki
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
     * OZNACZA PRESET JAKO CUSTOM
     */
    markAsCustomPreset() {
        this.islandSettings.preset = 'custom';
        document.getElementById('islandPreset').value = 'custom';
    }

    /**
     * AKTUALIZUJE STATYSTYKI
     */
    updateStats(chunks, transitionPoints) {
        const totalChunks = this.settings.chunkCols * this.settings.chunkRows;
        const totalTiles = totalChunks * this.settings.chunkSize * this.settings.chunkSize;
        
        // Policz tiles z wyspami
        let islandTiles = 0;
        chunks.forEach(chunk => {
            chunk.tiles.forEach(tile => {
                if (tile === 1) islandTiles++;
            });
        });
        
        const islandPercentage = Math.round((islandTiles / totalTiles) * 100);
        
        // Aktualizuj elementy DOM
        document.getElementById('totalChunks').textContent = totalChunks;
        document.getElementById('totalTiles').textContent = totalTiles;
        document.getElementById('islandPercentage').textContent = `${islandPercentage}%`;
        document.getElementById('totalTransitionPoints').textContent = transitionPoints.length;
    }

    /**
     * RESETUJE USTAWIENIA
     */
    resetToDefaults() {
        // Reset podstawowych ustawień
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
        this.pathfindingSettings.transitionPointScale = 1.0;

        this.resetUI();
    }

    /**
     * RESETUJE UI DO WARTOŚCI DOMYŚLNYCH
     */
    resetUI() {
        // Reset sliderów podstawowych
        document.getElementById('chunkSize').value = 11;
        document.getElementById('chunkCols').value = 8;
        document.getElementById('chunkRows').value = 6;
        document.getElementById('tileSize').value = 16;

        // Reset labelek podstawowych
        document.getElementById('chunkSizeValue').textContent = '11x11';
        document.getElementById('chunkColsValue').textContent = '8';
        document.getElementById('chunkRowsValue').textContent = '6';
        document.getElementById('tileSizeValue').textContent = '16px';

        // Reset kontrolek wysp
        document.getElementById('islandPreset').value = 'archipelago';
        this.updatePresetValues();

        // Reset kontrolek pathfinding
        document.getElementById('maxTransitionPoints').value = 3;
        document.getElementById('transitionPointScale').value = 1.0;
        document.getElementById('showTransitionPoints').checked = true;

        // Reset labelek pathfinding
        document.getElementById('maxTransitionPointsValue').textContent = '3';
        document.getElementById('transitionPointScaleValue').textContent = '1.0x';
    }

    /**
     * TRIGGERY DLA CALLBACKÓW
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
     * SETTERY DLA CALLBACKÓW
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
} 