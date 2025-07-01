/**
 * KONTROLER INTERFEJSU UŻYTKOWNIKA
 */

import { ISLAND_PRESETS, capitalizeFirst, RENDER_CONSTANTS } from '../config/Settings.js';
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

        // Skala krzyżyków pathfinding
        const pathfindingPointScaleSlider = document.getElementById('pathfindingPointScale');
        pathfindingPointScaleSlider?.addEventListener('input', (e) => {
            this.pathfindingSettings.pathfindingPointScale = parseFloat(e.target.value);
            document.getElementById('pathfindingPointScaleValue').textContent = e.target.value + 'x';
            this.triggerRenderOnly();
        });

        // Pokazuj/ukryj punkty przejścia
        const showTransitionPointsCheckbox = document.getElementById('showTransitionPoints');
        showTransitionPointsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showTransitionPoints = e.target.checked;
            this.triggerRenderOnly();
        });

        // Pokazuj/ukryj wagi połączeń
        const showConnectionWeightsCheckbox = document.getElementById('showConnectionWeights');
        showConnectionWeightsCheckbox?.addEventListener('change', (e) => {
            this.pathfindingSettings.showConnectionWeights = e.target.checked;
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
            const { mouseX, mouseY } = getCanvasCoordinates(e, canvas);
            
            // Aktualizuj pozycję myszy w UI
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

        // Ukryj inspector gdy mysz opuści canvas
        canvas.addEventListener('mouseleave', () => {
            inspector.setHoveredPoint(null);
            canvas.classList.remove('pointer-cursor');
            if (!inspector.getSelectedPoint()) {
                inspector.hideInspector();
            }
            
            // Wyczyść pozycję myszy
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = '-';
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
        this.pathfindingSettings.showConnectionWeights = true;
        this.pathfindingSettings.transitionPointScale = 1.0;
        this.pathfindingSettings.pathfindingPointScale = 2.0;

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
        document.getElementById('pathfindingPointScale').value = 2.0;
        document.getElementById('showTransitionPoints').checked = true;
        document.getElementById('showConnectionWeights').checked = true;

        // Reset labelek pathfinding
        document.getElementById('maxTransitionPointsValue').textContent = '3';
        document.getElementById('transitionPointScaleValue').textContent = '1.0x';
        document.getElementById('pathfindingPointScaleValue').textContent = '2.0x';
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

    /**
     * AKTUALIZUJE POZYCJĘ MYSZY W UI
     */
    updateMousePosition(mouseX, mouseY) {
        // Uwzględnij CANVAS_PADDING - odejmij padding od pozycji myszy
        const adjustedMouseX = mouseX - RENDER_CONSTANTS.CANVAS_PADDING;
        const adjustedMouseY = mouseY - RENDER_CONSTANTS.CANVAS_PADDING;
        
        // Sprawdź czy mysz jest w obszarze paddingu (poza chunkami)
        if (adjustedMouseX < 0 || adjustedMouseY < 0) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Poza obszarem mapy';
            }
            return;
        }
        
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const chunkWithGapSize = chunkPixelSize + RENDER_CONSTANTS.GAP_SIZE;
        
        // Znajdź chunk na podstawie pozycji (uwzględniając gaps)
        const chunkX = Math.floor(adjustedMouseX / chunkWithGapSize);
        const chunkY = Math.floor(adjustedMouseY / chunkWithGapSize);
        
        // Sprawdź czy nie wykraczamy poza mapę
        if (chunkX >= this.settings.chunkCols || chunkY >= this.settings.chunkRows) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Poza obszarem mapy';
            }
            return;
        }
        
        // Oblicz pozycję lokalną w chunku
        const localPixelX = adjustedMouseX - (chunkX * chunkWithGapSize);
        const localPixelY = adjustedMouseY - (chunkY * chunkWithGapSize);
        
        // Sprawdź czy nie jesteśmy w gap między chunkami
        if (localPixelX >= chunkPixelSize || localPixelY >= chunkPixelSize) {
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = 'Między chunkami';
            }
            return;
        }
        
        // Oblicz pozycję tile lokalną w chunku
        const localX = Math.floor(localPixelX / this.settings.tileSize);
        const localY = Math.floor(localPixelY / this.settings.tileSize);
        
        // Oblicz globalną pozycję tile
        const tileX = chunkX * this.settings.chunkSize + localX;
        const tileY = chunkY * this.settings.chunkSize + localY;
        
        // Oblicz środek tile'a w pikselach (względem oryginalnego canvas z paddingiem)
        const globalX = tileX * this.settings.tileSize + this.settings.tileSize / 2 + RENDER_CONSTANTS.CANVAS_PADDING + chunkX * RENDER_CONSTANTS.GAP_SIZE;
        const globalY = tileY * this.settings.tileSize + this.settings.tileSize / 2 + RENDER_CONSTANTS.CANVAS_PADDING + chunkY * RENDER_CONSTANTS.GAP_SIZE;
        
        const positionText = `(${globalX.toFixed(0)}, ${globalY.toFixed(0)}) | Tile: (${tileX}, ${tileY}) | Chunk: ${chunkX},${chunkY} [${localX},${localY}]`;
        
        const mousePositionElement = document.getElementById('mousePosition');
        if (mousePositionElement) {
            mousePositionElement.textContent = positionText;
        } else {
            console.warn('Element mousePosition nie został znaleziony!');
        }
    }
} 