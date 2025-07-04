# Island Map Generator - Modular JavaScript Application

Island map generator with chunk division and hierarchical pathfinding system. The application has been refactored from a single monolithic file to a modular architecture.

## 🏗️ Modular Architecture

The application has been divided into the following modules:

### 📁 Directory Structure

```
library_example/
├── js/
│   ├── config/
│   │   └── Settings.js           # Configuration and presets
│   ├── core/
│   │   ├── MapGenerator.js       # Main map generator
│   │   └── ChunkManager.js       # Chunk management
│   ├── algorithms/
│   │   └── CellularAutomata.js   # Generation algorithms
│   ├── pathfinding/
│   │   └── TransitionPointManager.js  # Transition points
│   ├── rendering/
│   │   └── CanvasRenderer.js     # Canvas rendering
│   ├── ui/
│   │   ├── UIController.js       # Interface control
│   │   └── Inspector.js          # Inspector panel
│   ├── utils/
│   │   └── MathUtils.js          # Helper functions
│   ├── data/
│   │   └── GameDataManager.js    # Data management
│   └── main.js                   # Main application
├── index.html
├── style.css
└── README.md
```

## 🚀 Getting Started

### Requirements

- **HTTP Server** - Files must be served via HTTP server (not file://)
- **Modern browser** with ES6 modules support

### Setup

```bash
# Start HTTP server in project directory
cd library_example && python3 -m http.server 8000

# Single command to kill everything on port 8000
kill $(lsof -ti:8000)

# Open in browser
# http://localhost:8000
```

## 🎮 Features

### 🗺️ Island Map Generation
- **Island presets**: Archipelago, Continent, Scattered, Dense
- **Cellular Automata**: Smoothing algorithms with various parameters
- **Chunks**: Map division into manageable fragments
- **Real-time preview**: Instant update after changing settings

### 🧭 Pathfinding System
- **Transition points**: Automatic detection of passages between chunks
- **Interactive inspector**: Click transition point to see details
- **Configurability**: Number and size of transition points

### 🎨 Rendering
- **Canvas rendering**: Efficient rendering on HTML5 Canvas
- **Responsive design**: Scaling to different screen sizes
- **Export PNG**: Save generated map as image

## 🔧 Main Components

### **MapGenerator** (`js/core/MapGenerator.js`)
Main map generation engine:
```javascript
// Generate new map
const finalMap = mapGenerator.generateMap();

// Apply only smoothing (optimization)
const smoothedMap = mapGenerator.applySmoothingToExistingMap();
```

### **ChunkManager** (`js/core/ChunkManager.js`)
Chunk management:
```javascript
// Divide map into chunks
const chunks = chunkManager.splitMapIntoChunks(unifiedMap, width, height);

// Render single chunk
chunkManager.renderChunk(ctx, chunk);
```

### **TransitionPointManager** (`js/pathfinding/TransitionPointManager.js`)
Transition point system:
```javascript
// Generate transition points
const points = transitionManager.generateTransitionPoints(chunks);

// Find point under mouse cursor
const point = transitionManager.getTransitionPointAt(mouseX, mouseY);
```

## ⚙️ Configuration and Settings

### **Settings** (`js/config/Settings.js`)
Central configuration place:
```javascript
// Default chunk settings
export const DEFAULT_SETTINGS = {
    chunkCols: 5,        // Number of chunks horizontally
    chunkRows: 3,        // Number of chunks vertically  
    chunkSize: 6,        // Chunk size (6x6 tiles)
    tileSize: 16         // Tile size in pixels
};

// Island presets
export const ISLAND_PRESETS = {
    archipelago: { landDensity: 0.35, iterations: 4, /* ... */ },
    continent: { landDensity: 0.55, iterations: 3, /* ... */ },
    // ...
};
```

### **Performance Optimizations**

#### **Change type differentiation**
The application optimizes regeneration based on change type:

1. **Full regeneration** (geometric parameters):
   - `chunkSize`, `chunkCols`, `chunkRows` 
   - `landDensity`, `islandSize`

2. **Smoothing only** (CA parameters):
   - `iterations`, `neighborThreshold`, `archipelagoMode`

3. **Render only** (visual parameters):
   - `tileSize`, `transitionPointScale`, `showTransitionPoints`

```javascript
// Usage example
uiController.setCallbacks({
    onFullRegenerationNeeded: () => app.generateMap(),
    onSmoothingOnlyNeeded: () => app.applySmoothingToExistingMap(),
    onRenderOnlyNeeded: () => app.renderMap()
});
```

## 🔧 Development and Extensions

### **Adding New Modules**

1. **Create new module file**:
```javascript
// js/algorithms/NoiseGenerator.js
export class NoiseGenerator {
    static generatePerlinNoise(width, height, scale) {
        // implementation
    }
}
```

2. **Import in main application**:
```javascript
// js/main.js
import { NoiseGenerator } from './algorithms/NoiseGenerator.js';
```

3. **Connect to existing flow**:
```javascript
// In MapGenerator.js
import { NoiseGenerator } from '../algorithms/NoiseGenerator.js';

generateBaseMap(width, height) {
    return NoiseGenerator.generatePerlinNoise(width, height, 0.1);
}
```

### **Debugging**

#### **Console access to instances**
```javascript
// In browser console
window.mapGenerator.chunks           // Current chunks
window.mapGenerator.settings         // Settings
window.mapGenerator.generateMap()    // Regenerate map
```

#### **Performance logs**
```javascript
// MapGenerator automatically logs:
console.log(`🗺️ Generated unified map: ${width}x${height}`);
console.log(`✓ Generated ${chunks.length} chunks from unified map`);
```

## �� Deployment

### **Production Optimization**

1. **Minification of modules**:
```bash
# Use tools like Rollup or Webpack
npm install rollup @rollup/plugin-terser
```

2. **Bundle ES modules**:
```javascript
// rollup.config.js
export default {
  input: 'js/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife'
  }
};
```

3. **Static serving**:
```bash
# Nginx config
location /island-generator/ {
    root /var/www/;
    try_files $uri $uri/ /index.html;
}
```

## 🔬 Testing and Validation

### **Module Testing**

```javascript
// Example test of Cellular Automata algorithm
import { applyCellularAutomataUnified } from './js/algorithms/CellularAutomata.js';

// Test case: 3x3 map with single land tile
const testMap = [0, 0, 0, 0, 1, 0, 0, 0, 0];
const result = applyCellularAutomataUnified(testMap, 3, 3, 4, false);

console.assert(result[4] === 0, 'Single land tile should be eroded');
```

### **Data Validation**

```javascript
// ChunkManager contains validation
const isValid = chunkManager.validateChunk(chunk);
if (!isValid) {
    console.error('❌ Invalid chunk detected:', chunk);
}
```

## 📊 Metrics and Analytics

### **Performance Monitoring**
```javascript
// Map generation time measurement
console.time('Map Generation');
mapGenerator.generateMap();
console.timeEnd('Map Generation');

// Memory usage tracking
console.log(`Memory usage: ${performance.memory?.usedJSHeapSize / 1024 / 1024} MB`);
```

### **Generation Statistics**
```javascript
// Available from UI
const stats = {
    totalChunks: settings.chunkCols * settings.chunkRows,
    totalTiles: totalChunks * settings.chunkSize ** 2,
    islandPercentage: Math.round((islandTiles / totalTiles) * 100),
    transitionPoints: transitionPoints.length
};
```

## 🛠️ Technical Details

### **ES6 Modules**
- **Import/Export syntax**: All modules use standard ES6 syntax
- **Tree-shaking**: Ability to optimize bundlers
- **Static analysis**: Better IDE and tool support

### **Separation of Concerns**
- **Config**: All constants in `Settings.js`
- **Algorithms**: Business logic separate from UI
- **Rendering**: Canvas operations in dedicated module
- **UI**: Event handling and DOM manipulation

### **Performance Optimizations**
- **Differential updates**: Different regeneration types
- **Canvas optimizations**: Minimal redraw operations
- **Memory management**: Proper cleanup and garbage collection

## 📈 Future Extensions

### **Planned Features**
- **Save/Load maps**: Serialize/deserialize application state
- **Custom brushes**: Manual map editing
- **Multi-layer rendering**: Different terrain types
- **Advanced pathfinding**: A* and hierarchical pathfinding
- **WebWorkers**: Background processing for large maps

### **Potential Integrations**
- **Three.js**: 3D rendering map
- **WebGL**: Hardware-accelerated rendering
- **Service Workers**: Offline functionality
- **IndexedDB**: Local data persistence

---

## 🔧 Integration with Lua (Fengari)

The project also supports integration with Lua using the Fengari library, allowing Lua algorithms to be run in the browser.

### **Setup Lua Integration**

```html
<!-- Add Fengari to HTML -->
<script src="fengari-web.js"></script>

<!-- Load Lua script -->
<script src="island_generator.lua" type="application/lua"></script>
```

### **Example Lua Module**

```lua
-- island_generator.lua
local js = require "js"

local IslandGenerator = {}

function IslandGenerator.generateIslandMap(width, height, density)
    -- Convert JavaScript arguments to Lua types
    local luaWidth = tonumber(width) or 30
    local luaHeight = tonumber(height) or 18
    local luaDensity = tonumber(density) or 0.35
    
    -- Create a true JavaScript array
    local jsArray = js.new(js.global.Array)
    
    for i = 0, luaWidth * luaHeight - 1 do
        local tile = math.random() < luaDensity and 1 or 0
        jsArray:push(tile)
    end
    
    return jsArray
end

function IslandGenerator.applyCellularAutomata(mapData, width, height, iterations)
    local luaWidth = tonumber(width) or 30
    local luaHeight = tonumber(height) or 18
    local luaIterations = tonumber(iterations) or 3
    
    -- Convert JavaScript array to Lua table
    local luaMap = {}
    for i = 0, mapData.length - 1 do
        luaMap[i + 1] = mapData[i]
    end
    
    -- Apply cellular automata
    for iter = 1, luaIterations do
        local newMap = {}
        for i = 1, #luaMap do
            local neighbors = countNeighbors(luaMap, i, luaWidth, luaHeight)
            newMap[i] = neighbors >= 4 and 1 or 0
        end
        luaMap = newMap
    end
    
    -- Convert back to JavaScript array
    local result = js.new(js.global.Array)
    for i = 1, #luaMap do
        result:push(luaMap[i])
    end
    
    return result
end

function countNeighbors(map, index, width, height)
    -- Implementation of counting neighbors
    local count = 0
    local x = ((index - 1) % width)
    local y = math.floor((index - 1) / width)
    
    for dy = -1, 1 do
        for dx = -1, 1 do
            if dx ~= 0 or dy ~= 0 then
                local nx, ny = x + dx, y + dy
                if nx >= 0 and nx < width and ny >= 0 and ny < height then
                    local neighborIndex = ny * width + nx + 1
                    if map[neighborIndex] == 1 then
                        count = count + 1
                    end
                end
            end
        end
    end
    
    return count
end

-- Export to JavaScript
js.global.LuaIslandGenerator = js.new(js.global.Object)
js.global.LuaIslandGenerator.generateIslandMap = IslandGenerator.generateIslandMap
js.global.LuaIslandGenerator.applyCellularAutomata = IslandGenerator.applyCellularAutomata
js.global.LuaIslandGenerator.ready = true

print("Lua Island Generator loaded successfully!")
```

### **JavaScript-Lua Integration**

```javascript
// Use Lua generator as alternative
function generateMapWithLua(width, height, density) {
    if (window.LuaIslandGenerator && window.LuaIslandGenerator.ready) {
        try {
            console.log('🔧 Using Lua island generator...');
            const luaResult = window.LuaIslandGenerator.generateIslandMap(width, height, density);
            
            if (luaResult && luaResult.length) {
                return Array.from(luaResult);
            }
        } catch (error) {
            console.error('❌ Lua generation failed:', error);
        }
    }
    
    // Fallback to JavaScript implementation
    console.log('⚙️ Using JavaScript fallback...');
    return mapGenerator.generateBaseMap(width, height);
}

// Extend MapGenerator with Lua support
class HybridMapGenerator extends MapGenerator {
    generateBaseMap(width, height) {
        // Try using Lua if available
        const luaResult = generateMapWithLua(width, height, this.islandSettings.landDensity / 100);
        
        if (luaResult) {
            console.log('✓ Generated base map using Lua');
            return luaResult;
        }
        
        // Fallback to standard implementation
        return super.generateBaseMap(width, height);
    }
}
```

### **Best Lua-JavaScript Practices**

#### **Type Conversion**
```lua
-- ❌ ERROR: JavaScript arguments are not Lua numbers
function badFunction(size)
    for i = 0, size - 1 do  -- ERROR!
    end
end

-- ✅ CORRECT: Always convert arguments
function goodFunction(size)
    local luaSize = tonumber(size) or 0
    for i = 0, luaSize - 1 do  -- OK!
    end
end
```

#### **Creating JavaScript Arrays**
```lua
-- ❌ ERROR: Lua table is not a JavaScript array
function badFunction()
    local result = {}
    result[0] = 1
    return result  -- JavaScript receives wrapped object
end

-- ✅ CORRECT: Create a true JavaScript array
function goodFunction()
    local jsArray = js.new(js.global.Array)
    jsArray:push(1)
    return jsArray  -- JavaScript receives true array
end
```

#### **Exporting Functions**
```lua
-- ❌ ERROR: Exporting entire table may not work
js.global.MyModule = MyModule

-- ✅ CORRECT: Export functions individually
js.global.MyModule = js.new(js.global.Object)
js.global.MyModule.myFunction = MyModule.myFunction
js.global.MyModule.ready = true
```

### **Lua-JavaScript Debugging**

#### **Lua Side (use `print()`)**
```lua
function MyModule.debugFunction(arg)
    print("Function called with:", arg)
    print("Argument type:", type(arg))
    local converted = tonumber(arg)
    print("Converted to number:", converted)
    -- ... rest of function
end
```

#### **JavaScript Side (use `console.log()`)**
```javascript
try {
    console.log('Calling Lua function with:', inputValue);
    console.log('Input type:', typeof inputValue);
    
    const result = window.MyModule.debugFunction(inputValue);
    
    console.log('Result type:', typeof result);
    console.log('Result length:', result?.length);
    console.log('Is array:', Array.isArray(result));
} catch (error) {
    console.error('Lua error:', error.message);
}
```

### **Type Conversion Table**

| JavaScript → Lua | Lua Function | Example |
|------------------|-------------|---------|
| Number | `tonumber(jsValue)` | `tonumber(5) → 5` |
| String | `tostring(jsValue)` | `tostring("hello") → "hello"` |
| Boolean | `jsValue and true or false` | `true and true or false → true` |

| Lua → JavaScript | Lua Code | Result |
|------------------|---------|--------|
| Array | `js.new(js.global.Array)` + `push()` | True JS Array |
| Object | `js.new(js.global.Object)` + properties | True JS Object |
| String | Direct return | JS String |
| Number | Direct return | JS Number |

---

## 📄 License

This project is available under the MIT license. See LICENSE.md for details.

## 🤝 Contribution to Project

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request 