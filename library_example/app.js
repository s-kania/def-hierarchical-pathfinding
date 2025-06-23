class ChunkMapGenerator {
    constructor() {
        this.settings = {
            chunkCols: 5,
            chunkRows: 3,
            chunkSize: 6,
            tileSize: 16
        };
        
        // New island generation settings
        this.islandSettings = {
            preset: 'archipelago',
            landDensity: 35,
            iterations: 4,
            neighborThreshold: 4,
            archipelagoMode: true,
            islandSize: 'medium'
        };
        
        // Island generation presets
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
        
        this.chunks = [];
        this.canvas = null;
        this.ctx = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
    
    setupEventListeners() {
        // Original sliders
        const chunkSizeSlider = document.getElementById('chunkSize');
        const chunkColsSlider = document.getElementById('chunkCols');
        const chunkRowsSlider = document.getElementById('chunkRows');
        const tileSizeSlider = document.getElementById('tileSize');
        
        chunkSizeSlider.addEventListener('input', (e) => {
            this.settings.chunkSize = parseInt(e.target.value);
            document.getElementById('chunkSizeValue').textContent = `${e.target.value}x${e.target.value}`;
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        chunkColsSlider.addEventListener('input', (e) => {
            this.settings.chunkCols = parseInt(e.target.value);
            document.getElementById('chunkColsValue').textContent = e.target.value;
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        chunkRowsSlider.addEventListener('input', (e) => {
            this.settings.chunkRows = parseInt(e.target.value);
            document.getElementById('chunkRowsValue').textContent = e.target.value;
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        tileSizeSlider.addEventListener('input', (e) => {
            this.settings.tileSize = parseInt(e.target.value);
            document.getElementById('tileSizeValue').textContent = `${e.target.value}px`;
            this.renderMap();
        });
        
        // New island generation controls
        const islandPresetSelect = document.getElementById('islandPreset');
        const landDensitySlider = document.getElementById('landDensity');
        const iterationsSlider = document.getElementById('iterations');
        const neighborThresholdSlider = document.getElementById('neighborThreshold');
        const archipelagoModeCheckbox = document.getElementById('archipelagoMode');
        const islandSizeSelect = document.getElementById('islandSize');
        
        islandPresetSelect.addEventListener('change', (e) => {
            this.islandSettings.preset = e.target.value;
            this.updatePresetValues();
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        landDensitySlider.addEventListener('input', (e) => {
            this.islandSettings.landDensity = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('landDensityValue').textContent = `${e.target.value}%`;
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        iterationsSlider.addEventListener('input', (e) => {
            this.islandSettings.iterations = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('iterationsValue').textContent = e.target.value;
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        neighborThresholdSlider.addEventListener('input', (e) => {
            this.islandSettings.neighborThreshold = parseInt(e.target.value);
            this.islandSettings.preset = 'custom';
            document.getElementById('neighborThresholdValue').textContent = e.target.value;
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        archipelagoModeCheckbox.addEventListener('change', (e) => {
            this.islandSettings.archipelagoMode = e.target.checked;
            this.islandSettings.preset = 'custom';
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        islandSizeSelect.addEventListener('change', (e) => {
            this.islandSettings.islandSize = e.target.value;
            this.islandSettings.preset = 'custom';
            document.getElementById('islandSizeValue').textContent = this.capitalizeFirst(e.target.value);
            document.getElementById('islandPreset').value = 'custom';
            this.generateMap();
            this.renderMap();
            this.updateStats();
        });
        
        // Original buttons
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.generateMap();
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
    
    generateMap() {
        this.chunks = [];
        
        for (let y = 0; y < this.settings.chunkRows; y++) {
            for (let x = 0; x < this.settings.chunkCols; x++) {
                const chunk = {
                    id: `${x},${y}`,
                    x: x,
                    y: y,
                    tiles: this.generateChunkTiles()
                };
                this.chunks.push(chunk);
            }
        }
    }
    
    generateChunkTiles() {
        const size = this.settings.chunkSize;
        console.log('✓ JavaScript Island Generator active with advanced parameters');
        
        if (this.islandSettings.preset !== 'custom') {
            // Use preset
            return this.generateChunkTilesWithPreset(size, this.islandSettings.preset);
        } else {
            // Use custom parameters
            return this.generateChunkTilesAdvanced(
                size,
                this.islandSettings.landDensity / 100, // Convert percentage to decimal
                this.islandSettings.iterations,
                this.islandSettings.neighborThreshold,
                this.islandSettings.archipelagoMode,
                this.islandSettings.islandSize
            );
        }
    }
    
    generateChunkTilesWithPreset(size, presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`Unknown preset: ${presetName}, using default`);
            return this.generateChunkTilesAdvanced(size, 0.35, 4, 4, true, 'medium');
        }
        
        return this.generateChunkTilesAdvanced(
            size,
            preset.landDensity,
            preset.iterations,
            preset.neighborThreshold,
            preset.archipelagoMode,
            preset.islandSize
        );
    }
    
    generateChunkTilesAdvanced(size, landDensity, iterations, neighborThreshold, archipelagoMode, islandSize) {
        let tiles = [];
        
        // Adjust land density based on island size
        const sizeMultiplier = this.getIslandSizeMultiplier(islandSize);
        const adjustedLandDensity = Math.min(1.0, landDensity * sizeMultiplier);
        
        // Initial random generation based on adjusted land density
        for (let i = 0; i < size * size; i++) {
            tiles[i] = Math.random() < adjustedLandDensity ? 1 : 0;
        }
        
        // Apply cellular automata for specified iterations
        for (let iteration = 0; iteration < iterations; iteration++) {
            tiles = this.applyCellularAutomata(tiles, size, neighborThreshold, archipelagoMode);
        }
        
        // Post-processing based on island size and archipelago mode
        if (archipelagoMode) {
            tiles = this.applyArchipelagoEffect(tiles, size, islandSize);
        } else {
            tiles = this.applyContinentEffect(tiles, size, islandSize);
        }
        
        return tiles;
    }
    
    getIslandSizeMultiplier(islandSize) {
        switch (islandSize) {
            case 'small': return 0.7;
            case 'medium': return 1.0;
            case 'large': return 1.3;
            default: return 1.0;
        }
    }
    
    applyCellularAutomata(tiles, size, threshold, archipelagoMode) {
        const newTiles = [...tiles];
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = y * size + x;
                const neighbors = this.countNeighbors(tiles, x, y, size);
                
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
    
    applyArchipelagoEffect(tiles, size, islandSize) {
        // For archipelago mode, apply some erosion to create more separate islands
        if (islandSize === 'small') {
            // More aggressive erosion for small islands
            return this.applyErosion(tiles, size, 2);
        } else if (islandSize === 'medium') {
            return this.applyErosion(tiles, size, 1);
        }
        return tiles; // Large islands don't need erosion in archipelago mode
    }
    
    applyContinentEffect(tiles, size, islandSize) {
        // For continent mode, apply dilation to create larger connected landmasses
        if (islandSize === 'large') {
            return this.applyDilation(tiles, size, 2);
        } else if (islandSize === 'medium') {
            return this.applyDilation(tiles, size, 1);
        }
        return tiles; // Small islands don't need dilation in continent mode
    }
    
    applyErosion(tiles, size, intensity) {
        let result = [...tiles];
        
        for (let i = 0; i < intensity; i++) {
            const newTiles = [...result];
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = y * size + x;
                    if (result[index] === 1) {
                        const oceanNeighbors = this.countOceanNeighbors(result, x, y, size);
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
    
    applyDilation(tiles, size, intensity) {
        let result = [...tiles];
        
        for (let i = 0; i < intensity; i++) {
            const newTiles = [...result];
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = y * size + x;
                    if (result[index] === 0) {
                        const landNeighbors = this.countLandNeighbors(result, x, y, size);
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
    
    countNeighbors(tiles, x, y, size) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
                    continue;
                }
                
                const index = ny * size + nx;
                if (tiles[index] === 1) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    countOceanNeighbors(tiles, x, y, size) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
                    count++;
                    continue;
                }
                
                const index = ny * size + nx;
                if (tiles[index] === 0) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    countLandNeighbors(tiles, x, y, size) {
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Treat out-of-bounds as ocean
                if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
                    continue;
                }
                
                const index = ny * size + nx;
                if (tiles[index] === 1) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    renderMap() {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;
        const gapSize = 4; // Gap between chunks
        
        const totalWidth = this.settings.chunkCols * chunkPixelSize + (this.settings.chunkCols - 1) * gapSize;
        const totalHeight = this.settings.chunkRows * chunkPixelSize + (this.settings.chunkRows - 1) * gapSize;
        
        // Set canvas size
        this.canvas.width = totalWidth + 40; // Extra padding
        this.canvas.height = totalHeight + 40;
        
        // Clear canvas
        this.ctx.fillStyle = this.colors.chunkBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render each chunk
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
    
    updateStats() {
        const totalChunks = this.settings.chunkCols * this.settings.chunkRows;
        const totalTiles = totalChunks * this.settings.chunkSize * this.settings.chunkSize;
        
        let islandTiles = 0;
        this.chunks.forEach(chunk => {
            chunk.tiles.forEach(tile => {
                if (tile === 1) islandTiles++;
            });
        });
        
        const islandPercentage = Math.round((islandTiles / totalTiles) * 100);
        
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