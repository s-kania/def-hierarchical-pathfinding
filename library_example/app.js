class ChunkMapGenerator {
    constructor() {
        this.settings = {
            chunkCols: 5,
            chunkRows: 3,
            chunkSize: 6,
            tileSize: 16
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
        this.luaModuleLogged = false;  // Flag to log Lua module only once
        
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
        // Sliders
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
        
        // Buttons
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
        
        // Use Lua island generator if available
        if (window.LuaIslandGenerator && window.LuaIslandGenerator.ready) {
            // Log success message only once
            if (!this.luaModuleLogged) {
                console.log('✓ Lua Island Generator ready and active');
                this.luaModuleLogged = true;
            }
            
            try {
                const result = window.LuaIslandGenerator.generateChunkTilesForJS(size);
                
                // Check if result is valid
                if (result && Array.isArray(result) && result.length === size * size) {
                    return result;
                } else if (result && result.length === size * size) {
                    // Convert to proper array if it's array-like
                    return Array.from(result);
                }
            } catch (error) {
                console.warn('Lua generator failed, using JavaScript fallback');
            }
        }
        
        // Fallback to JavaScript implementation
        let tiles = [];
        
        // Initial random generation - 45% chance for island
        for (let i = 0; i < size * size; i++) {
            tiles[i] = Math.random() < 0.45 ? 1 : 0;
        }
        
        // Apply cellular automata for 4 iterations
        for (let iteration = 0; iteration < 4; iteration++) {
            tiles = this.applyCellularAutomata(tiles, size);
        }
        
        return tiles;
    }
    
    applyCellularAutomata(tiles, size) {
        const newTiles = [...tiles];
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const index = y * size + x;
                const neighbors = this.countNeighbors(tiles, x, y, size);
                
                if (neighbors >= 4) {
                    newTiles[index] = 1; // Island
                } else if (neighbors <= 3) {
                    newTiles[index] = 0; // Ocean
                }
                // If neighbors == 3, keep current state
            }
        }
        
        return newTiles;
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
        
        // Update sliders
        document.getElementById('chunkSize').value = 6;
        document.getElementById('chunkCols').value = 5;
        document.getElementById('chunkRows').value = 3;
        document.getElementById('tileSize').value = 16;
        
        // Update labels
        document.getElementById('chunkSizeValue').textContent = '6x6';
        document.getElementById('chunkColsValue').textContent = '5';
        document.getElementById('chunkRowsValue').textContent = '3';
        document.getElementById('tileSizeValue').textContent = '16px';
        
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
    
    exportToPNG() {
        const link = document.createElement('a');
        link.download = `chunk-map-${this.settings.chunkCols}x${this.settings.chunkRows}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Lua to load, then initialize
    setTimeout(() => {
        new ChunkMapGenerator();
    }, 100);
});