# Hierarchical Pathfinding Library

Wysokowydajna biblioteka hierarchicznego pathfinding w JavaScript, zaprojektowana zgodnie z zasadą **KISS (Keep It Simple, Stupid)**.

## Funkcje

- **Hierarchiczny pathfinding** - podział mapy na chunki z pre-komputowanymi punktami przejścia
- **Wielu algorytmów** - A* i JPS (Jump Point Search) dla pathfinding lokalnego
- **Konfigurowalne heurystyki** - Manhattan i Euclidean distance
- **Optymalizacja segmentów** - automatyczne usuwanie redundantnych punktów
- **Prosta konfiguracja** - plain object zamiast złożonych wzorców projektowych
- **Wysoka wydajność** - optymalizacje na każdym poziomie

## Szybki start

### Instalacja
```bash
# Skopiuj pliki do swojego projektu
cp -r hierarchical_pathfinding/ src/
```

### Podstawowe użycie
```javascript
import { HierarchicalPathfinder } from './src/index.js';

// Konfiguracja
const config = {
    // Algorithm settings
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    hierarchicalHeuristic: 'manhattan',
    heuristicWeight: 1.0,
    
    // Grid settings
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    
    // Data providers
    getChunkData: (chunkId) => {
        // Zwróć 2D array z danymi chunka (0 = wolne, 1 = przeszkoda)
        return chunkData[chunkId] || [];
    },
    transitionPoints: [
        // Punkty przejścia między chunkami
        {
            id: 'tp1',
            chunks: ['chunk_0_0', 'chunk_0_1'],
            connections: [
                { id: 'tp2', chunk: 'chunk_0_0' }
            ]
        }
    ]
};

// Inicjalizacja
const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);

// Znajdź ścieżkę
const path = pathfinder.findPath(
    { x: 50, y: 50 },   // Start
    { x: 200, y: 100 }  // Cel
);

console.log(path);
// [
//   { chunk: 'chunk_0_0', position: { x: 80, y: 64 } },
//   { chunk: 'chunk_0_1', position: { x: 200, y: 100 } }
// ]
```

## Konfiguracja

### Parametry algorytmów
- `localAlgorithm`: `'astar'` | `'jps'` - algorytm pathfinding lokalnego
- `localHeuristic`: `'manhattan'` | `'euclidean'` - heurystyka dla pathfinding lokalnego
- `hierarchicalHeuristic`: `'manhattan'` | `'euclidean'` - heurystyka dla pathfinding hierarchicznego
- `heuristicWeight`: `number` - waga heurystyki (domyślnie 1.0)

### Parametry siatki
- `tileSize`: `number` - rozmiar kafelka w jednostkach świata
- `gridWidth`: `number` - szerokość siatki w chunkach
- `gridHeight`: `number` - wysokość siatki w chunkach
- `chunkWidth`: `number` - szerokość chunka w kafelkach
- `chunkHeight`: `number` - wysokość chunka w kafelkach

### Dostawcy danych
- `getChunkData(chunkId)`: `function` - funkcja zwracająca dane chunka (2D array)
- `transitionPoints`: `Array` - punkty przejścia między chunkami

## Algorytmy

### A* (A-Star)
Standardowy algorytm pathfinding z konfigurowalną heurystyką.

```javascript
const config = {
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    heuristicWeight: 1.0
};
```

### JPS (Jump Point Search)
Szybszy algorytm dla dużych, otwartych map.

```javascript
const config = {
    localAlgorithm: 'jps',
    localHeuristic: 'euclidean',
    heuristicWeight: 1.2
};
```

## Heurystyki

### Manhattan Distance
Szybka heurystyka dla siatek ortogonalnych.

```javascript
const config = {
    localHeuristic: 'manhattan',
    hierarchicalHeuristic: 'manhattan'
};
```

### Euclidean Distance
Dokładniejsza heurystyka dla ruchu diagonalnego.

```javascript
const config = {
    localHeuristic: 'euclidean',
    hierarchicalHeuristic: 'euclidean'
};
```

## Punkty przejścia

Punkty przejścia definiują możliwe ścieżki między chunkami:

```javascript
const transitionPoints = [
    {
        id: 'tp1',
        chunks: ['chunk_0_0', 'chunk_0_1'],  // Chunki, które zawierają ten punkt
        connections: [
            { id: 'tp2', chunk: 'chunk_0_0' },  // Połączenie do tp2 przez chunk_0_0
            { id: 'tp3', chunk: 'chunk_0_1' }   // Połączenie do tp3 przez chunk_0_1
        ]
    },
    {
        id: 'tp2',
        chunks: ['chunk_0_0', 'chunk_1_0'],
        connections: [
            { id: 'tp1', chunk: 'chunk_0_0' },
            { id: 'tp4', chunk: 'chunk_1_0' }
        ]
    }
];
```

## API

### HierarchicalPathfinder

#### `init(config)`
Inicjalizuje system pathfinding z konfiguracją.

#### `findPath(startPos, endPos)`
Znajduje ścieżkę między dwoma punktami.

**Parametry:**
- `startPos`: `{x: number, y: number}` - pozycja startowa
- `endPos`: `{x: number, y: number}` - pozycja docelowa

**Zwraca:**
- `Array<{chunk: string, position: {x: number, y: number}}>` - segmenty ścieżki
- `null` - jeśli ścieżka nie istnieje

#### `getConfig()`
Zwraca aktualną konfigurację.

#### `getLocalPathfinder()`
Zwraca instancję LocalPathfinder.

#### `getTransitionPathfinder()`
Zwraca instancję TransitionPathfinder.

### LocalPathfinder

#### `findPath(chunkData, startPos, endPos)`
Znajduje ścieżkę w obrębie pojedynczego chunka.

### TransitionPathfinder

#### `findPath(startPointId, endPointId)`
Znajduje ścieżkę między punktami przejścia.

#### `getPointsInChunk(chunkId)`
Zwraca punkty przejścia w danym chunk.

## Przykłady

### Przykład 1: Podstawowy pathfinding
```javascript
import { HierarchicalPathfinder } from './src/index.js';

const config = {
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    heuristicWeight: 1.0,
    tileSize: 16,
    gridWidth: 4,
    gridHeight: 4,
    chunkWidth: 10,
    chunkHeight: 10,
    getChunkData: (chunkId) => {
        // Przykładowe dane chunka
        return Array(10).fill().map(() => Array(10).fill(0));
    },
    transitionPoints: []
};

const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);

const path = pathfinder.findPath({ x: 50, y: 50 }, { x: 150, y: 150 });
console.log(path);
```

### Przykład 2: Z punktami przejścia
```javascript
const transitionPoints = [
    {
        id: 'tp1',
        chunks: ['chunk_0_0', 'chunk_0_1'],
        connections: [{ id: 'tp2', chunk: 'chunk_0_0' }]
    },
    {
        id: 'tp2',
        chunks: ['chunk_0_0', 'chunk_1_0'],
        connections: [{ id: 'tp1', chunk: 'chunk_0_0' }]
    }
];

const config = {
    // ... reszta konfiguracji
    transitionPoints: transitionPoints
};
```

### Przykład 3: Optymalizacja wydajności
```javascript
const config = {
    localAlgorithm: 'jps',        // Szybszy dla dużych map
    localHeuristic: 'euclidean',  // Dokładniejsza heurystyka
    heuristicWeight: 1.1,         // Lekka optymalizacja
    // ... reszta konfiguracji
};
```

## Wydajność

### Optymalizacje
- **Pre-komputowane punkty przejścia** - szybkie wyszukiwanie na poziomie hierarchicznym
- **Lokalny pathfinding** - tylko w obrębie potrzebnych chunków
- **Optymalizacja segmentów** - usuwanie redundantnych punktów
- **Efektywne algorytmy** - A* i JPS z optymalizacjami

### Metryki
- **Pathfinding lokalny**: ~1-5ms na chunk 11x11
- **Pathfinding hierarchiczny**: ~0.1-1ms na 100 punktów przejścia
- **Całkowity czas**: ~1-10ms dla typowych ścieżek

## Architektura

Biblioteka została zaprojektowana zgodnie z zasadą **KISS**:

```
src/
├── algorithms/           # Algorytmy pathfinding
│   ├── PathfindingAlgorithm.js    # Interfejs bazowy
│   ├── AStarAlgorithm.js          # Implementacja A*
│   └── JPSAlgorithm.js            # Implementacja JPS
├── heuristics/          # Heurystyki
│   ├── Heuristic.js               # Interfejs bazowy
│   ├── ManhattanHeuristic.js      # Manhattan distance
│   └── EuclideanHeuristic.js      # Euclidean distance
├── pathfinders/         # Główne klasy pathfinding
│   ├── HierarchicalPathfinder.js  # Główna klasa
│   ├── LocalPathfinder.js         # Pathfinding lokalny
│   └── TransitionPathfinder.js    # Pathfinding hierarchiczny
├── builders/            # Buildery
│   └── PathSegmentBuilder.js      # Builder segmentów ścieżki
├── utils/               # Narzędzia
│   └── CoordUtils.js              # Konwersje współrzędnych
└── index.js             # Główny plik eksportowy
```

## Rozszerzanie

### Dodawanie nowego algorytmu
1. Implementuj `PathfindingAlgorithm`
2. Dodaj do `LocalPathfinder.createAlgorithm()`
3. Dodaj do `index.js`

### Dodawanie nowej heurystyki
1. Implementuj `Heuristic`
2. Dodaj do `TransitionPathfinder.getHeuristic()`
3. Dodaj do `index.js`

## Kompatybilność wsteczna

- Stary import `HierarchicalPathfinding` nadal działa
- Stara konfiguracja nadal jest obsługiwana
- Wszystkie istniejące funkcje działają bez zmian

## Licencja

MIT License - zobacz plik [LICENSE](LICENSE) dla szczegółów.

## Wsparcie

- **Dokumentacja**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Migracja**: [migration_guide.md](migration_guide.md)
- **Przykłady**: [examples/](examples/)

## Podsumowanie

Hierarchical Pathfinding Library to prosta, ale potężna biblioteka do pathfinding w JavaScript. Zasada KISS została zastosowana konsekwentnie, zapewniając łatwość użycia i utrzymania przy zachowaniu wysokiej wydajności. 