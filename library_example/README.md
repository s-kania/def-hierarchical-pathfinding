# Island Map Generator - Modułowa Aplikacja JavaScript

Generator map wysp z podziałem na chunki oraz systemu hierarchicznego pathfinding. Aplikacja została zrefaktorowana z jednego monolitycznego pliku na modułową architekturę.

## 🏗️ Architektura Modułowa

Aplikacja została podzielona na następujące moduły:

### 📁 Struktura Katalogów

```
library_example/
├── js/
│   ├── config/
│   │   └── Settings.js           # Konfiguracja i presety
│   ├── core/
│   │   ├── MapGenerator.js       # Główny generator map
│   │   └── ChunkManager.js       # Zarządzanie chunkami
│   ├── algorithms/
│   │   └── CellularAutomata.js   # Algorytmy generowania
│   ├── pathfinding/
│   │   └── TransitionPointManager.js  # Punkty przejścia
│   ├── rendering/
│   │   └── CanvasRenderer.js     # Renderowanie na canvas
│   ├── ui/
│   │   ├── UIController.js       # Kontrola interfejsu
│   │   └── Inspector.js          # Panel inspektora
│   ├── utils/
│   │   └── MathUtils.js          # Funkcje pomocnicze
│   ├── data/
│   │   └── GameDataManager.js    # Zarządzanie danymi
│   └── main.js                   # Główna aplikacja
├── index.html
├── style.css
└── README.md
```

## 🚀 Uruchomienie

### Wymagania

- **HTTP Server** - Pliki muszą być serwowane przez serwer HTTP (nie file://)
- **Nowoczesna przeglądarka** z obsługą ES6 modules

### Setup

```bash
# Uruchom serwer HTTP w katalogu projektu
cd library_example && python3 -m http.server 8000

# Jedna komenda, aby zabić wszystko na porcie 8000
kill $(lsof -ti:8000)

# Otwórz w przeglądarce
# http://localhost:8000
```

## 🎮 Funkcjonalności

### 🗺️ Generowanie Map Wysp
- **Presety wysp**: Archipelago, Continent, Scattered, Dense
- **Cellular Automata**: Algorytmy smoothing z różnymi parametrami
- **Chunki**: Podział mapy na manageable fragmenty
- **Real-time preview**: Natychmiastowa aktualizacja po zmianie ustawień

### 🧭 System Pathfinding
- **Punkty przejścia**: Automatyczne wykrywanie przejść między chunkami
- **Interaktywny inspector**: Kliknij punkt przejścia aby zobaczyć szczegóły
- **Konfigurowalność**: Liczba i rozmiar punktów przejścia

### 🎨 Renderowanie
- **Canvas rendering**: Wydajne renderowanie na HTML5 Canvas
- **Responsywny design**: Skalowanie do różnych rozmiarów ekranu
- **Export PNG**: Zapisz wygenerowaną mapę jako obraz

## 🔧 Główne Komponenty

### **MapGenerator** (`js/core/MapGenerator.js`)
Główny silnik generowania map:
```javascript
// Generuje nową mapę
const finalMap = mapGenerator.generateMap();

// Aplikuje tylko smoothing (optymalizacja)
const smoothedMap = mapGenerator.applySmoothingToExistingMap();
```

### **ChunkManager** (`js/core/ChunkManager.js`)
Zarządzanie chunkami:
```javascript
// Dzieli mapę na chunki
const chunks = chunkManager.splitMapIntoChunks(unifiedMap, width, height);

// Renderuje pojedynczy chunk
chunkManager.renderChunk(ctx, chunk);
```

### **TransitionPointManager** (`js/pathfinding/TransitionPointManager.js`)
System punktów przejścia:
```javascript
// Generuje punkty przejścia
const points = transitionManager.generateTransitionPoints(chunks);

// Znajduje punkt pod kursorem myszy
const point = transitionManager.getTransitionPointAt(mouseX, mouseY);
```

## ⚙️ Konfiguracja i Ustawienia

### **Settings** (`js/config/Settings.js`)
Centralne miejsce konfiguracji:
```javascript
// Domyślne ustawienia chunków
export const DEFAULT_SETTINGS = {
    chunkCols: 5,        // Liczba chunków w poziomie
    chunkRows: 3,        // Liczba chunków w pionie  
    chunkSize: 6,        // Rozmiar chunka (6x6 tiles)
    tileSize: 16         // Rozmiar tile w pikselach
};

// Presety wysp
export const ISLAND_PRESETS = {
    archipelago: { landDensity: 0.35, iterations: 4, /* ... */ },
    continent: { landDensity: 0.55, iterations: 3, /* ... */ },
    // ...
};
```

### **Optymalizacje Wydajności**

#### **Rozróżnienie typów zmian**
Aplikacja optymalizuje regenerację na podstawie typu zmiany:

1. **Pełna regeneracja** (parametry geometryczne):
   - `chunkSize`, `chunkCols`, `chunkRows` 
   - `landDensity`, `islandSize`

2. **Tylko smoothing** (parametry CA):
   - `iterations`, `neighborThreshold`, `archipelagoMode`

3. **Tylko render** (parametry wizualne):
   - `tileSize`, `transitionPointScale`, `showTransitionPoints`

```javascript
// Przykład użycia
uiController.setCallbacks({
    onFullRegenerationNeeded: () => app.generateMap(),
    onSmoothingOnlyNeeded: () => app.applySmoothingToExistingMap(),
    onRenderOnlyNeeded: () => app.renderMap()
});
```

## 🔧 Rozwój i Rozszerzenia

### **Dodawanie Nowych Modułów**

1. **Utwórz nowy plik modułu**:
```javascript
// js/algorithms/NoiseGenerator.js
export class NoiseGenerator {
    static generatePerlinNoise(width, height, scale) {
        // implementacja
    }
}
```

2. **Zaimportuj w głównej aplikacji**:
```javascript
// js/main.js
import { NoiseGenerator } from './algorithms/NoiseGenerator.js';
```

3. **Podłącz do istniejącego flow**:
```javascript
// W MapGenerator.js
import { NoiseGenerator } from '../algorithms/NoiseGenerator.js';

generateBaseMap(width, height) {
    return NoiseGenerator.generatePerlinNoise(width, height, 0.1);
}
```

### **Debugowanie**

#### **Console dostępu do instancji**
```javascript
// W konsoli przeglądarki
window.mapGenerator.chunks           // Aktualne chunki
window.mapGenerator.settings         // Ustawienia
window.mapGenerator.generateMap()    // Regeneruj mapę
```

#### **Logi wydajności**
```javascript
// MapGenerator automatycznie loguje:
console.log(`🗺️ Generated unified map: ${width}x${height}`);
console.log(`✓ Generated ${chunks.length} chunks from unified map`);
```

## 🚀 Deployment

### **Optymalizacja Produkcyjna**

1. **Minifikacja modułów**:
```bash
# Użyj narzędzi jak Rollup lub Webpack
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

3. **Serwowanie statyczne**:
```bash
# Nginx config
location /island-generator/ {
    root /var/www/;
    try_files $uri $uri/ /index.html;
}
```

## 🔬 Testy i Walidacja

### **Testowanie Modułów**

```javascript
// Przykład testu algorytmu Cellular Automata
import { applyCellularAutomataUnified } from './js/algorithms/CellularAutomata.js';

// Test case: 3x3 mapa z pojedynczym kafelkiem lądu
const testMap = [0, 0, 0, 0, 1, 0, 0, 0, 0];
const result = applyCellularAutomataUnified(testMap, 3, 3, 4, false);

console.assert(result[4] === 0, 'Pojedynczy kafelek powinien zostać erodowany');
```

### **Walidacja Danych**

```javascript
// ChunkManager zawiera walidację
const isValid = chunkManager.validateChunk(chunk);
if (!isValid) {
    console.error('❌ Invalid chunk detected:', chunk);
}
```

## 📊 Metryki i Analityka

### **Monitoring Wydajności**
```javascript
// Pomiar czasu generowania map
console.time('Map Generation');
mapGenerator.generateMap();
console.timeEnd('Map Generation');

// Śledzenie użycia pamięci
console.log(`Memory usage: ${performance.memory?.usedJSHeapSize / 1024 / 1024} MB`);
```

### **Statystyki Generacji**
```javascript
// Dostępne z UI
const stats = {
    totalChunks: settings.chunkCols * settings.chunkRows,
    totalTiles: totalChunks * settings.chunkSize ** 2,
    islandPercentage: Math.round((islandTiles / totalTiles) * 100),
    transitionPoints: transitionPoints.length
};
```

## 🛠️ Techniczne Szczegóły

### **ES6 Modules**
- **Import/Export syntax**: Wszystkie moduły używają standardowej składni ES6
- **Tree-shaking**: Możliwość optymalizacji bundlerów
- **Static analysis**: Lepsze wsparcie IDE i narzędzi

### **Separation of Concerns**
- **Config**: Wszystkie stałe w `Settings.js`
- **Algorithms**: Logika biznesowa oddzielona od UI
- **Rendering**: Canvas operations w dedykowanym module
- **UI**: Event handling i DOM manipulation

### **Performance Optimizations**
- **Differential updates**: Różne typy regeneracji
- **Canvas optimizations**: Minimalizacja redraw operations
- **Memory management**: Proper cleanup i garbage collection

## 📈 Przyszłe Rozszerzenia

### **Planowane Funkcjonalności**
- **Save/Load maps**: Serialize/deserialize stanu aplikacji
- **Custom brushes**: Edycja ręczna map
- **Multi-layer rendering**: Różne rodzaje terrain
- **Advanced pathfinding**: A* i hierarchiczne pathfinding
- **WebWorkers**: Background processing dla dużych map

### **Potencjalne Integracje**
- **Three.js**: 3D rendering map
- **WebGL**: Hardware-accelerated rendering
- **Service Workers**: Offline functionality
- **IndexedDB**: Persystencja danych lokalnie

---

## 🔧 Integracja z Lua (Fengari)

Projekt zawiera również wsparcie dla integracji z Lua używając biblioteki Fengari, pozwalając na uruchamianie algorytmów Lua w przeglądarce.

### **Setup Lua Integration**

```html
<!-- Dodaj Fengari do HTML -->
<script src="fengari-web.js"></script>

<!-- Załaduj skrypt Lua -->
<script src="island_generator.lua" type="application/lua"></script>
```

### **Przykład Modułu Lua**

```lua
-- island_generator.lua
local js = require "js"

local IslandGenerator = {}

function IslandGenerator.generateIslandMap(width, height, density)
    -- Konwertuj argumenty JavaScript na typy Lua
    local luaWidth = tonumber(width) or 30
    local luaHeight = tonumber(height) or 18
    local luaDensity = tonumber(density) or 0.35
    
    -- Stwórz prawdziwą tablicę JavaScript
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
    
    -- Konwertuj JavaScript array na Lua table
    local luaMap = {}
    for i = 0, mapData.length - 1 do
        luaMap[i + 1] = mapData[i]
    end
    
    -- Aplikuj cellular automata
    for iter = 1, luaIterations do
        local newMap = {}
        for i = 1, #luaMap do
            local neighbors = countNeighbors(luaMap, i, luaWidth, luaHeight)
            newMap[i] = neighbors >= 4 and 1 or 0
        end
        luaMap = newMap
    end
    
    -- Konwertuj z powrotem na JavaScript array
    local result = js.new(js.global.Array)
    for i = 1, #luaMap do
        result:push(luaMap[i])
    end
    
    return result
end

function countNeighbors(map, index, width, height)
    -- Implementacja liczenia sąsiadów
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

-- Eksportuj do JavaScript
js.global.LuaIslandGenerator = js.new(js.global.Object)
js.global.LuaIslandGenerator.generateIslandMap = IslandGenerator.generateIslandMap
js.global.LuaIslandGenerator.applyCellularAutomata = IslandGenerator.applyCellularAutomata
js.global.LuaIslandGenerator.ready = true

print("Lua Island Generator loaded successfully!")
```

### **Integracja JavaScript-Lua**

```javascript
// Użycie generatora Lua jako alternatywy
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
    
    // Fallback do JavaScript implementation
    console.log('⚙️ Using JavaScript fallback...');
    return mapGenerator.generateBaseMap(width, height);
}

// Rozszerzenie MapGenerator o obsługę Lua
class HybridMapGenerator extends MapGenerator {
    generateBaseMap(width, height) {
        // Spróbuj użyć Lua jeśli dostępne
        const luaResult = generateMapWithLua(width, height, this.islandSettings.landDensity / 100);
        
        if (luaResult) {
            console.log('✓ Generated base map using Lua');
            return luaResult;
        }
        
        // Fallback do standardowej implementacji
        return super.generateBaseMap(width, height);
    }
}
```

### **Najlepsze Praktyki Lua-JavaScript**

#### **Konwersja Typów**
```lua
-- ❌ BŁĄD: JavaScript argumenty nie są liczbami Lua
function badFunction(size)
    for i = 0, size - 1 do  -- ERROR!
    end
end

-- ✅ POPRAWNIE: Zawsze konwertuj argumenty
function goodFunction(size)
    local luaSize = tonumber(size) or 0
    for i = 0, luaSize - 1 do  -- OK!
    end
end
```

#### **Tworzenie JavaScript Arrays**
```lua
-- ❌ BŁĄD: Lua table nie jest JavaScript array
function badFunction()
    local result = {}
    result[0] = 1
    return result  -- JavaScript dostaje wrapped object
end

-- ✅ POPRAWNIE: Utwórz prawdziwą JavaScript array
function goodFunction()
    local jsArray = js.new(js.global.Array)
    jsArray:push(1)
    return jsArray  -- JavaScript dostaje prawdziwą array
end
```

#### **Eksport Funkcji**
```lua
-- ❌ BŁĄD: Eksport całej tabeli może nie działać
js.global.MyModule = MyModule

-- ✅ POPRAWNIE: Eksportuj funkcje indywidualnie
js.global.MyModule = js.new(js.global.Object)
js.global.MyModule.myFunction = MyModule.myFunction
js.global.MyModule.ready = true
```

### **Debugowanie Lua-JavaScript**

#### **Strona Lua (użyj `print()`)**
```lua
function MyModule.debugFunction(arg)
    print("Function called with:", arg)
    print("Argument type:", type(arg))
    local converted = tonumber(arg)
    print("Converted to number:", converted)
    -- ... reszta funkcji
end
```

#### **Strona JavaScript (użyj `console.log()`)**
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

### **Tabela Konwersji Typów**

| JavaScript → Lua | Funkcja Lua | Przykład |
|------------------|-------------|----------|
| Number | `tonumber(jsValue)` | `tonumber(5) → 5` |
| String | `tostring(jsValue)` | `tostring("hello") → "hello"` |
| Boolean | `jsValue and true or false` | `true and true or false → true` |

| Lua → JavaScript | Kod Lua | Rezultat |
|------------------|---------|----------|
| Array | `js.new(js.global.Array)` + `push()` | Prawdziwa JS Array |
| Object | `js.new(js.global.Object)` + properties | Prawdziwy JS Object |
| String | Direct return | JS String |
| Number | Direct return | JS Number |

---

## 📄 Licencja

Ten projekt jest dostępny na licencji MIT. Zobacz plik LICENSE.md dla szczegółów.

## 🤝 Wkład w Projekt

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request 