/**
 * Generator map wysp z podziałem na chunki
 * 
 * FLOW APLIKACJI:
 * 1. generateMap() -> generuje bazową mapę (this.baseMap) i aplikuje smoothing
 * 2. splitMapIntoChunks() -> dzieli mapę na chunki (this.chunks)
 * 3. renderMap() -> renderuje chunki na canvas
 * 
 * DOSTĘPNE DANE:
 * - this.baseMap: Array - bazowa mapa przed smoothing (width * height elementów)
 * - this.chunks: Array - chunki z mapą podzieloną ({id, x, y, tiles})
 * - this.mapDimensions: {width, height} - rozmiary całej mapy
 * - this.settings: Object - ustawienia rozmiaru chunków i renderowania
 * - this.islandSettings: Object - parametry generowania wysp
 */
class ChunkMapGenerator {
    constructor() {
        // Ustawienia siatki chunków i renderowania
        this.settings = {
            chunkCols: 5,        // Liczba chunków w poziomie
            chunkRows: 3,        // Liczba chunków w pionie  
            chunkSize: 6,        // Rozmiar chunka (6x6 tiles)
            tileSize: 16         // Rozmiar tile w pikselach
        };
        
        // Parametry generowania wysp
        this.islandSettings = {
            preset: 'archipelago',      // Preset: archipelago/continent/scattered/dense
            landDensity: 35,            // Gęstość lądu w % (wpływa na bazową mapę)
            iterations: 4,              // Iteracje smoothing (cellular automata)
            neighborThreshold: 4,       // Próg sąsiadów dla smoothing
            archipelagoMode: true,      // Tryb archipelagu vs kontynent
            islandSize: 'medium'        // Rozmiar wysp: small/medium/large
        };
        
        // Presety z predefiniowanymi wartościami
        this.presets = {
            archipelago: {
                landDensity: 0.35,
                iterations: 4,
                neighborThreshold: 4,
                archipelagoMode: true,
                islandSize: 'medium'
            },
            continent: {
                landDensity: 0.55,
                iterations: 3,
                neighborThreshold: 3,
                archipelagoMode: false,
                islandSize: 'large'
            },
            scattered: {
                landDensity: 0.25,
                iterations: 2,
                neighborThreshold: 5,
                archipelagoMode: true,
                islandSize: 'small'
            },
            dense: {
                landDensity: 0.70,
                iterations: 5,
                neighborThreshold: 2,
                archipelagoMode: false,
                islandSize: 'large'
            }
        };
        
        this.colors = {
            ocean: '#0066cc',
            island: '#228b22',
            chunkBorder: '#333333',
            chunkBackground: '#f0f0f0'
        };
        
        // GŁÓWNE DANE APLIKACJI:
        this.chunks = [];                           // Array chunków: [{id, x, y, tiles: [0,1,0,1...]}]
        this.canvas = null;                         // Canvas element
        this.ctx = null;                           // Canvas context 2D
        
        // DANE MAPY:
        this.baseMap = null;                       // Array: bazowa mapa przed smoothing [0,1,0,1...]
        this.mapDimensions = { width: 0, height: 0 }; // Rozmiary całej mapy w tiles
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        this.generateMap();  // Generuje this.baseMap i this.chunks
        this.renderMap();    // Renderuje this.chunks na canvas
        this.updateStats();
    }
    
    setupEventListeners() {
        // WAŻNE: Rozróżnienie między parametrami wymagającymi pełnej regeneracji
        // vs parametrami smoothing aplikowanymi do istniejącej mapy
        
        // === PARAMETRY WYMAGAJĄCE PEŁNEJ REGENERACJI (zmieniają this.baseMap) ===
        const chunkSizeSlider = document.getElementById('chunkSize');
        const chunkColsSlider = document.getElementById('chunkCols');
        const chunkRowsSlider = document.getElementById('chunkRows');
        const tileSizeSlider = document.getElementById('tileSize');
        
        // Rozmiar chunków - wymaga pełnej regeneracji
        chunkSizeSlider.addEventListener('input', (e) => {
            this.settings.chunkSize = parseInt(e.target.value);
            document.getElementById('chunkSizeValue').textContent = `${e.target.value}x${e.target.value}`;
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Liczba chunków w poziomie - wymaga pełnej regeneracji
        chunkColsSlider.addEventListener('input', (e) => {
            this.settings.chunkCols = parseInt(e.target.value);
            document.getElementById('chunkColsValue').textContent = e.target.value;
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Liczba chunków w pionie - wymaga pełnej regeneracji
        chunkRowsSlider.addEventListener('input', (e) => {
            this.settings.chunkRows = parseInt(e.target.value);
            document.getElementById('chunkRowsValue').textContent = e.target.value;
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Rozmiar tile - tylko aktualizacja renderowania
        tileSizeSlider.addEventListener('input', (e) => {
            this.settings.tileSize = parseInt(e.target.value);
            document.getElementById('tileSizeValue').textContent = `${e.target.value}px`;
            this.renderMap(); // Tylko re-render, this.chunks bez zmian
        });
        
        // === PARAMETRY WYSP ===
        const islandPresetSelect = document.getElementById('islandPreset');
        const landDensitySlider = document.getElementById('landDensity');
        const iterationsSlider = document.getElementById('iterations');
        const neighborThresholdSlider = document.getElementById('neighborThreshold');
        const archipelagoModeCheckbox = document.getElementById('archipelagoMode');
        const islandSizeSelect = document.getElementById('islandSize');
        
        // Preset - wymaga pełnej regeneracji
        islandPresetSelect.addEventListener('change', (e) => {
            this.islandSettings.preset = e.target.value;
            this.updatePresetValues();
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Gęstość lądu - wymaga pełnej regeneracji (wpływa na this.baseMap)
        landDensitySlider.addEventListener('input', (e) => {
            this.islandSettings.landDensity = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('landDensityValue').textContent = `${e.target.value}%`;
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // === PARAMETRY SMOOTHING (aplikowane do istniejącej this.baseMap) ===
        
        // Iteracje cellular automata - tylko smoothing
        iterationsSlider.addEventListener('input', (e) => {
            this.islandSettings.iterations = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('iterationsValue').textContent = e.target.value;
            document.getElementById('islandPreset').value = 'custom';
            this.applySmoothingToExistingMap(); // Smoothing: this.baseMap -> this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Próg sąsiadów - tylko smoothing
        neighborThresholdSlider.addEventListener('input', (e) => {
            this.islandSettings.neighborThreshold = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('neighborThresholdValue').textContent = e.target.value;
            document.getElementById('islandPreset').value = 'custom';
            this.applySmoothingToExistingMap(); // Smoothing: this.baseMap -> this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Tryb archipelagu - tylko smoothing
        archipelagoModeCheckbox.addEventListener('change', (e) => {
            this.islandSettings.archipelagoMode = e.target.checked;
            this.islandSettings.preset = 'custom';
            document.getElementById('islandPreset').value = 'custom';
            this.applySmoothingToExistingMap(); // Smoothing: this.baseMap -> this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // Rozmiar wysp - wymaga pełnej regeneracji
        islandSizeSelect.addEventListener('change', (e) => {
            this.islandSettings.islandSize = e.target.value;
            this.islandSettings.preset = 'custom';
            document.getElementById('islandSizeValue').textContent = this.capitalizeFirst(e.target.value);
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        // === PRZYCISKI ===
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.generateMap(); // Pełna regeneracja: this.baseMap + this.chunks
            this.renderMap();
            this.updateStats();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSettings();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToPNG();
        });
    }
    
    updatePresetValues() {
        if (this.islandSettings.preset === 'custom') return;
        
        const preset = this.presets[this.islandSettings.preset];
        if (preset) {
            this.islandSettings.landDensity = Math.round(preset.landDensity * 100);
            this.islandSettings.iterations = preset.iterations;
            this.islandSettings.neighborThreshold = preset.neighborThreshold;
            this.islandSettings.archipelagoMode = preset.archipelagoMode;
            this.islandSettings.islandSize = preset.islandSize;
            
            // Update UI
            document.getElementById('landDensity').value = this.islandSettings.landDensity;
            document.getElementById('landDensityValue').textContent = `${this.islandSettings.landDensity}%`;
            document.getElementById('iterations').value = this.islandSettings.iterations;
            document.getElementById('iterationsValue').textContent = this.islandSettings.iterations;
            document.getElementById('neighborThreshold').value = this.islandSettings.neighborThreshold;
            document.getElementById('neighborThresholdValue').textContent = this.islandSettings.neighborThreshold;
            document.getElementById('archipelagoMode').checked = this.islandSettings.archipelagoMode;
            document.getElementById('islandSize').value = this.islandSettings.islandSize;
            document.getElementById('islandSizeValue').textContent = this.capitalizeFirst(this.islandSettings.islandSize);
        }
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * GŁÓWNA METODA GENEROWANIA MAPY
     * 
     * FLOW: 
     * 1. Oblicza rozmiar całej mapy (chunkCols * chunkSize x chunkRows * chunkSize)
     * 2. Generuje bazową mapę -> this.baseMap (Array[width*height])
     * 3. Aplikuje smoothing -> finalMap
     * 4. Dzieli na chunki -> this.chunks (Array[{id, x, y, tiles}])
     * 
     * WYNIK: this.baseMap, this.chunks, this.mapDimensions są zaktualizowane
     */
    generateMap() {
        console.log('🗺️ Generating unified map...');
        
        // Oblicz rozmiar całej mapy w tiles
        const totalWidth = this.settings.chunkCols * this.settings.chunkSize;
        const totalHeight = this.settings.chunkRows * this.settings.chunkSize;
        this.mapDimensions = { width: totalWidth, height: totalHeight };
        
        console.log(`Map size: ${totalWidth}x${totalHeight} tiles (${this.settings.chunkCols}x${this.settings.chunkRows} chunks of ${this.settings.chunkSize}x${this.settings.chunkSize})`);
        
        // KROK 1: Generuj bazową mapę (random noise + island size adjustment)
        // REZULTAT: this.baseMap = [0,1,0,1,1,0...] (width*height elementów)
        this.baseMap = this.generateBaseMap(totalWidth, totalHeight);
        
        // KROK 2: Aplikuj smoothing (cellular automata + effects)
        // INPUT: this.baseMap, OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, totalWidth, totalHeight);
        
        // KROK 3: Podziel mapę na chunki
        // INPUT: finalMap, OUTPUT: this.chunks = [{id, x, y, tiles: [0,1,0...]}, ...]
        this.chunks = this.splitMapIntoChunks(finalMap, totalWidth, totalHeight);
        
        console.log(`✓ Generated ${this.chunks.length} chunks from unified map`);
    }
    
    /**
     * APLIKUJE SMOOTHING DO ISTNIEJĄCEJ MAPY (bez regeneracji this.baseMap)
     * 
     * Używane gdy zmieniają się tylko parametry smoothing:
     * - iterations, neighborThreshold, archipelagoMode
     * 
     * FLOW:
     * 1. Sprawdza czy this.baseMap istnieje
     * 2. Aplikuje smoothing do this.baseMap -> finalMap  
     * 3. Dzieli finalMap na chunki -> aktualizuje this.chunks
     * 
     * SZYBKIE: nie regeneruje this.baseMap, tylko przetwarza istniejące dane
     */
    applySmoothingToExistingMap() {
        if (!this.baseMap || !this.mapDimensions.width || !this.mapDimensions.height) {
            console.warn('No base map available, generating new map...');
            this.generateMap();
            return;
        }
        
        console.log('🎨 Applying smoothing to existing map...');
        
        // KROK 1: Aplikuj smoothing do istniejącej this.baseMap
        // INPUT: this.baseMap (niezmieniona), OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, this.mapDimensions.width, this.mapDimensions.height);
        
        // KROK 2: Podziel na chunki i zaktualizuj this.chunks
        // INPUT: finalMap, OUTPUT: this.chunks (nowe chunki)
        this.chunks = this.splitMapIntoChunks(finalMap, this.mapDimensions.width, this.mapDimensions.height);
        
        console.log(`✓ Applied smoothing to existing ${this.mapDimensions.width}x${this.mapDimensions.height} map`);
    }
    
    generateBaseMap(width, height) {
        console.log('✓ JavaScript Island Generator - generating base map');
        
        if (this.islandSettings.preset !== 'custom') {
            return this.generateBaseMapWithPreset(width, height, this.islandSettings.preset);
        } else {
            return this.generateBaseMapAdvanced(
                width,
                height,
                this.islandSettings.landDensity / 100,
                this.islandSettings.islandSize
            );
        }
    }
    
    generateBaseMapWithPreset(width, height, presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`Unknown preset: ${presetName}, using default`);
            return this.generateBaseMapAdvanced(width, height, 0.35, 'medium');
        }
        
        return this.generateBaseMapAdvanced(
            width,
            height,
            preset.landDensity,
            preset.islandSize
        );
    }
    
    generateBaseMapAdvanced(width, height, landDensity, islandSize) {
        // Adjust land density based on island size
        const sizeMultiplier = this.getIslandSizeMultiplier(islandSize);
        const adjustedLandDensity = Math.min(1.0, landDensity * sizeMultiplier);
        
        console.log(`Generating base map with land density: ${Math.round(adjustedLandDensity * 100)}%`);
        
        // Initial random generation based on adjusted land density
        const tiles = [];
        for (let i = 0; i < width * height; i++) {
            tiles[i] = Math.random() < adjustedLandDensity ? 1 : 0;
        }
        
        return tiles;
    }
    
    applySmoothing(baseMap, width, height) {
        let tiles = [...baseMap]; // Start with copy of base map
        
        console.log(`Applying smoothing: ${this.islandSettings.iterations} iterations, threshold: ${this.islandSettings.neighborThreshold}, archipelago: ${this.islandSettings.archipelagoMode}`);
        
        // Apply cellular automata for specified iterations
        for (let iteration = 0; iteration < this.islandSettings.iterations; iteration++) {
            console.log(`Applying cellular automata iteration ${iteration + 1}/${this.islandSettings.iterations}...`);
            tiles = this.applyCellularAutomataUnified(tiles, width, height, this.islandSettings.neighborThreshold, this.islandSettings.archipelagoMode);
        }
        
        // Post-processing based on island size and archipelago mode
        if (this.islandSettings.archipelagoMode) {
            console.log('Applying archipelago effects...');
            tiles = this.applyArchipelagoEffectUnified(tiles, width, height, this.islandSettings.islandSize);
        } else {
            console.log('Applying continent effects...');
            tiles = this.applyContinentEffectUnified(tiles, width, height, this.islandSettings.islandSize);
        }
        
        return tiles;
    }
    
    applyCellularAutomataUnified(tiles, width, height, threshold, archipelagoMode) {
        const newTiles = [...tiles];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const neighbors = this.countNeighborsUnified(tiles, x, y, width, height);
                
                if (archipelagoMode) {
                    // More aggressive for archipelago - creates more fragmented islands
                    if (neighbors >= threshold) {
                        newTiles[index] = 1; // Island
                    } else if (neighbors <= (threshold - 3)) {
                        newTiles[index] = 0; // Ocean
                    }
                } else {
                    // Standard rules for continent mode
                    if (neighbors >= threshold) {
                        newTiles[index] = 1; // Island
                    } else if (neighbors <= (threshold - 2)) {
                        newTiles[index] = 0; // Ocean
                    }
                }
            }
        }
        
        return newTiles;
    }
    
    applyArchipelagoEffectUnified(tiles, width, height, islandSize) {
        // For archipelago mode, apply some erosion to create more separate islands
        if (islandSize === 'small') {
            // More aggressive erosion for small islands
            return this.applyErosionUnified(tiles, width, height, 2);
        } else if (islandSize === 'medium') {
            return this.applyErosionUnified(tiles, width, height, 1);
        }
        return tiles; // Large islands don't need erosion in archipelago mode
    }
    
    applyContinentEffectUnified(tiles, width, height, islandSize) {
        // For continent mode, apply dilation to create larger connected landmasses
        if (islandSize === 'large') {
            return this.applyDilationUnified(tiles, width, height, 2);
        } else if (islandSize === 'medium') {
            return this.applyDilationUnified(tiles, width, height, 1);
        }
        return tiles; // Small islands don't need dilation in continent mode
    }
    
    applyErosionUnified(tiles, width, height, intensity) {
        let result = [...tiles];
        
        for (let i = 0; i < intensity; i++) {
            const newTiles = [...result];
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    if (result[index] === 1) {
                        const oceanNeighbors = this.countOceanNeighborsUnified(result, x, y, width, height);
                        if (oceanNeighbors >= 3) {
                            newTiles[index] = 0; // Erode to ocean
                        }
                    }
                }
            }
            
            result = newTiles;
        }
        
        return result;
    }
    
    applyDilationUnified(tiles, width, height, intensity) {
        let result = [...tiles];
        
        for (let i = 0; i < intensity; i++) {
            const newTiles = [...result];
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    if (result[index] === 0) {
                        const landNeighbors = this.countLandNeighborsUnified(result, x, y, width, height);
                        if (landNeighbors >= 2) {
                            newTiles[index] = 1; // Expand land
                        }
                    }
                }
            }
            
            result = newTiles;
        }
        
        return result;
    }
    
    countNeighborsUnified(tiles, x, y, width, height) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    continue;
                }
                
                const index = ny * width + nx;
                if (tiles[index] === 1) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    countOceanNeighborsUnified(tiles, x, y, width, height) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    count++;
                    continue;
                }
                
                const index = ny * width + nx;
                if (tiles[index] === 0) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    countLandNeighborsUnified(tiles, x, y, width, height) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    continue;
                }
                
                const index = ny * width + nx;
                if (tiles[index] === 1) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    /**
     * DZIELI WIELKĄ MAPĘ NA CHUNKI
     * 
     * INPUT: unifiedMap - Array[totalWidth * totalHeight] z wartościami 0/1
     * OUTPUT: Array chunków [{id, x, y, tiles}, ...] 
     * 
     * KAŻDY CHUNK:
     * - id: string "x,y" (np. "0,0", "1,2") 
     * - x,y: pozycja chunka w siatce
     * - tiles: Array[chunkSize²] z wycięciem mapy dla tego chunka
     * 
     * WYNIK: this.chunks gotowe do renderowania
     */
    splitMapIntoChunks(unifiedMap, totalWidth, totalHeight) {
        const chunks = [];
        const chunkSize = this.settings.chunkSize;
        
        // Iteruj przez siatkę chunków (chunkRows x chunkCols)
        for (let chunkY = 0; chunkY < this.settings.chunkRows; chunkY++) {
            for (let chunkX = 0; chunkX < this.settings.chunkCols; chunkX++) {
                const chunk = {
                    id: `${chunkX},${chunkY}`,     // ID chunka jako string
                    x: chunkX,                     // Pozycja X w siatce chunków 
                    y: chunkY,                     // Pozycja Y w siatce chunków
                    tiles: []                      // Array[chunkSize²] dla tego chunka
                };
                
                // Wyciągnij tiles dla tego chunka z wielkiej mapy
                for (let localY = 0; localY < chunkSize; localY++) {
                    for (let localX = 0; localX < chunkSize; localX++) {
                        // Przelicz współrzędne lokalne na globalne
                        const globalX = chunkX * chunkSize + localX;
                        const globalY = chunkY * chunkSize + localY;
                        const globalIndex = globalY * totalWidth + globalX;
                        const localIndex = localY * chunkSize + localX;
                        
                        // Skopiuj tile z wielkiej mapy do chunka
                        chunk.tiles[localIndex] = unifiedMap[globalIndex];
                    }
                }
                
                chunks.push(chunk);
            }
        }
        
        return chunks; // Array chunków gotowy do this.chunks
    }
    
    getIslandSizeMultiplier(islandSize) {
        switch (islandSize) {
            case 'small': return 0.7;
            case 'medium': return 1.0;
            case 'large': return 1.3;
            default: return 1.0;
        }
    }
    
    /**
     * RENDERUJE MAPĘ NA CANVAS
     * 
     * DANE ŹRÓDŁOWE: this.chunks[] - array chunków z tiles
     * RENDERUJE: każdy chunk jako siatkę kolorowych kwadratów na canvas
     * 
     * FLOW:
     * 1. Oblicza rozmiar canvas na podstawie chunków i settings  
     * 2. Czyści canvas
     * 3. Renderuje każdy chunk z this.chunks[] za pomocą renderChunk()
     * 
     * KOLORY: ocean (0) = niebieski, wyspa (1) = zielony
     */
    renderMap() {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const gapSize = 4; // Przerwa między chunkami w pikselach
        
        // Oblicz rozmiar canvas
        const totalWidth = this.settings.chunkCols * chunkPixelSize + (this.settings.chunkCols - 1) * gapSize;
        const totalHeight = this.settings.chunkRows * chunkPixelSize + (this.settings.chunkRows - 1) * gapSize;
        
        // Ustaw rozmiar canvas
        this.canvas.width = totalWidth + 40; // Extra padding
        this.canvas.height = totalHeight + 40;
        
        // Wyczyść canvas (tło)
        this.ctx.fillStyle = this.colors.chunkBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderuj każdy chunk z this.chunks[]
        this.chunks.forEach(chunk => {
            this.renderChunk(chunk, gapSize);
        });
    }
    
    renderChunk(chunk, gapSize) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const startX = 20 + chunk.x * (chunkPixelSize + gapSize);
        const startY = 20 + chunk.y * (chunkPixelSize + gapSize);
        
        // Draw chunk border
        this.ctx.strokeStyle = this.colors.chunkBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX - 1, startY - 1, chunkPixelSize + 2, chunkPixelSize + 2);
        
        // Draw tiles
        for (let y = 0; y < this.settings.chunkSize; y++) {
            for (let x = 0; x < this.settings.chunkSize; x++) {
                const tileIndex = y * this.settings.chunkSize + x;
                const tileValue = chunk.tiles[tileIndex];
                
                const tileX = startX + x * this.settings.tileSize;
                const tileY = startY + y * this.settings.tileSize;
                
                this.ctx.fillStyle = tileValue === 1 ? this.colors.island : this.colors.ocean;
                this.ctx.fillRect(tileX, tileY, this.settings.tileSize, this.settings.tileSize);
                
                // Add subtle tile borders for larger tiles
                if (this.settings.tileSize >= 16) {
                    this.ctx.strokeStyle = tileValue === 1 ? '#1e5e1e' : '#004499';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(tileX, tileY, this.settings.tileSize, this.settings.tileSize);
                }
            }
        }
        
        // Draw chunk ID
        this.ctx.fillStyle = this.colors.chunkBorder;
        this.ctx.font = 'bold 12px var(--font-family-base)';
        this.ctx.fillText(chunk.id, startX + 2, startY + 14);
    }
    
    /**
     * AKTUALIZUJE STATYSTYKI NA PODSTAWIE this.chunks
     * 
     * OBLICZA:
     * - Liczbę chunków
     * - Liczbę tiles (chunków * chunkSize²)  
     * - Procent wysp (tiles z wartością 1)
     * 
     * DANE ŹRÓDŁOWE: this.chunks[].tiles[] (każdy chunk ma array tiles)
     * AKTUALIZUJE: elementy DOM z statystykami
     */
    updateStats() {
        const totalChunks = this.settings.chunkCols * this.settings.chunkRows;
        const totalTiles = totalChunks * this.settings.chunkSize * this.settings.chunkSize;
        
        // Policz tiles z wyspami (wartość 1) we wszystkich chunkach
        let islandTiles = 0;
        this.chunks.forEach(chunk => {
            chunk.tiles.forEach(tile => {
                if (tile === 1) islandTiles++;
            });
        });
        
        const islandPercentage = Math.round((islandTiles / totalTiles) * 100);
        
        // Aktualizuj elementy DOM
        document.getElementById('totalChunks').textContent = totalChunks;
        document.getElementById('totalTiles').textContent = totalTiles;
        document.getElementById('islandPercentage').textContent = `${islandPercentage}%`;
    }
    
    resetSettings() {
        this.settings = {
            chunkCols: 5,
            chunkRows: 3,
            chunkSize: 6,
            tileSize: 16
        };
        
        this.islandSettings = {
            preset: 'archipelago',
            landDensity: 35,
            iterations: 4,
            neighborThreshold: 4,
            archipelagoMode: true,
            islandSize: 'medium'
        };
        
        // Update original sliders
        document.getElementById('chunkSize').value = 6;
        document.getElementById('chunkCols').value = 5;
        document.getElementById('chunkRows').value = 3;
        document.getElementById('tileSize').value = 16;
        
        // Update original labels
        document.getElementById('chunkSizeValue').textContent = '6x6';
        document.getElementById('chunkColsValue').textContent = '5';
        document.getElementById('chunkRowsValue').textContent = '3';
        document.getElementById('tileSizeValue').textContent = '16px';
        
        // Update new island controls
        document.getElementById('islandPreset').value = 'archipelago';
        document.getElementById('landDensity').value = 35;
        document.getElementById('iterations').value = 4;
        document.getElementById('neighborThreshold').value = 4;
        document.getElementById('archipelagoMode').checked = true;
        document.getElementById('islandSize').value = 'medium';
        
        // Update new labels
        document.getElementById('landDensityValue').textContent = '35%';
        document.getElementById('iterationsValue').textContent = '4';
        document.getElementById('neighborThresholdValue').textContent = '4';
        document.getElementById('islandSizeValue').textContent = 'Medium';
        
        // Reset requires full regeneration since settings changed
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
    
    exportToPNG() {
        const link = document.createElement('a');
        const presetName = this.islandSettings.preset;
        link.download = `island-map-${presetName}-${this.settings.chunkCols}x${this.settings.chunkRows}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
});