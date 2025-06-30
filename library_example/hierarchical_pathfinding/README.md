# Hierarchical Pathfinding Library (JavaScript)

Biblioteka JavaScript do hierarchicznego wyszukiwania ścieżek opartego na chunkach. Przepisana z języka Lua na JavaScript z pełną funkcjonalnością.

## 📖 Opis

Ta biblioteka implementuje hierarchiczny algorytm pathfinding, który dzieli mapę na chunki i używa dwupoziomowego podejścia:

1. **Poziom chunków** - nawigacja między chunkery przy użyciu punktów przejścia
2. **Poziom lokalny** - szczegółowy pathfinding A* w obrębie poszczególnych chunków

## 🚀 Funkcje

- ✅ Hierarchiczny pathfinding oparty na chunkach
- ✅ Algorytm A* dla nawigacji między chunkami i lokalnego pathfinding
- ✅ Obsługa punktów przejścia między chunkier
- ✅ Cache ścieżek z LRU eviction
- ✅ Konwersje współrzędnych (globalne ↔ lokalne ↔ chunk)
- ✅ Walidacja dostępności pozycji
- ✅ Optymalizacja ścieżek
- ✅ Obsługa heurystyk Manhattan i Euclidean

## 📁 Struktura

```
hierarchical_pathfinding/
├── HierarchicalPathfinding.js     # Główna klasa
├── src/
│   ├── ChunkNavigator.js          # Nawigacja między chunkami
│   ├── LocalPathfinder.js         # Pathfinding w obrębie chunka
│   ├── PathSegmentBuilder.js      # Budowanie segmentów ścieżki
│   ├── TransitionResolver.js      # Zarządzanie punktami przejścia
│   └── utils/
│       ├── CoordUtils.js          # Narzędzia konwersji współrzędnych
│       └── DataStructures.js      # PriorityQueue i Path
├── example.js                     # Przykład użycia
└── README.md                      # Ta dokumentacja
```

## 🛠️ Instalacja i użycie

### Podstawowe użycie

```javascript
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

// 1. Przygotuj dane chunków (0 = woda/dostępne, 1 = ląd/zablokowane)
const chunks = {
    '0,0': [
        [0, 0, 0, 1, 1],
        [0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0]
    ],
    // ... więcej chunków
};

// 2. Zdefiniuj punkty przejścia
const transitionPoints = [
    {
        id: 'tp1',
        chunks: ['0,0', '1,0'],
        position: 2, // pozycja przejścia na krawędzi
        weight: 1
    },
    // ... więcej punktów przejścia
];

// 3. Funkcja pobierania danych chunka
function getChunkData(chunkId) {
    return chunks[chunkId] || null;
}

// 4. Konfiguracja
const config = {
    chunkSize: 5,        // rozmiar chunka w kafelkach
    tileSize: 10,        // rozmiar kafelka w jednostkach świata
    mapWidth: 2,         // liczba chunków w szerokości
    mapHeight: 2,        // liczba chunków w wysokości
    getChunkData: getChunkData,
    transitionPoints: transitionPoints,
    enableCache: true,   // włącz cache ścieżek
    cacheSize: 100      // maksymalny rozmiar cache
};

// 5. Inicjalizacja
const pathfinder = new HierarchicalPathfinding();
pathfinder.init(config);

// 6. Znajdź ścieżkę
const startPos = { x: 5, y: 5, z: 0 };
const endPos = { x: 75, y: 75, z: 0 };
const path = pathfinder.findPath(startPos, endPos);

console.log(path); // Array segmentów ścieżki
```

## 📚 API

### HierarchicalPathfinding

#### `init(config)`
Inicjalizuje system pathfinding.

**Parametry:**
- `config.chunkSize` - rozmiar chunka w kafelkach
- `config.tileSize` - rozmiar kafelka w jednostkach świata
- `config.mapWidth` - szerokość mapy w chunkach
- `config.mapHeight` - wysokość mapy w chunkach
- `config.getChunkData` - funkcja pobierania danych chunka
- `config.transitionPoints` - tablica punktów przejścia
- `config.enableCache` - czy włączyć cache (opcjonalne)
- `config.cacheSize` - rozmiar cache (opcjonalne, domyślnie 100)

#### `findPath(startPos, endPos)`
Znajduje ścieżkę między dwoma pozycjami.

**Parametry:**
- `startPos` - pozycja startowa `{x, y, z}`
- `endPos` - pozycja końcowa `{x, y, z}`

**Zwraca:** Tablicę segmentów `{chunk, position}` lub `null`

#### `isPositionWalkable(globalPos)`
Sprawdza czy pozycja jest dostępna.

#### `canReach(startPos, endPos)`
Sprawdza czy można dotrzeć z jednej pozycji do drugiej.

#### `getChunkFromGlobal(globalPos)`
Pobiera ID chunka dla globalnej pozycji.

#### `globalToLocal(globalPos, chunkId)`
Konwertuje globalną pozycję na lokalną w obrębie chunka.

#### `localToGlobal(localPos, chunkId)`
Konwertuje lokalną pozycję na globalną.

#### `clearCache()`
Czyści cache ścieżek.

## 🎯 Format danych

### Chunk Data
Dwuwymiarowa tablica liczb:
- `0` = woda (dostępne dla pathfinding)
- `1` = ląd (zablokowane)

### Transition Points
```javascript
{
    id: 'unique_id',           // unikalny identyfikator
    chunks: ['0,0', '1,0'],    // para ID chunków
    position: 2,               // pozycja na krawędzi (0 do chunkSize-1)
    weight: 1                  // waga przejścia (opcjonalne)
}
```

### Path Segments
```javascript
{
    chunk: '1,0',              // ID chunka
    position: {x: 25, y: 35, z: 0}  // globalna pozycja docelowa
}
```

## ⚙️ Zaawansowana konfiguracja

### Optymalizacja ścieżek
```javascript
const config = {
    // ... podstawowa konfiguracja
    pathOptimization: {
        heuristic: 'manhattan', // lub 'euclidean'
        optimizePath: true      // usuń niepotrzebne punkty węzłowe
    }
};
```

### Wstrzykiwanie zależności (do testowania)
```javascript
const config = {
    // ... podstawowa konfiguracja
    _localPathfinder: CustomLocalPathfinder,
    _transitionResolver: CustomTransitionResolver,
    _coordUtils: CustomCoordUtils
};
```

## 🧪 Przykład

Sprawdź plik `example.js` po pełny przykład użycia z:
- Konfiguracją chunków i punktów przejścia
- Znajdowaniem ścieżek w jednym i wielu chunkach
- Sprawdzaniem dostępności pozycji
- Konwersjami współrzędnych

## 🔧 Komponenty

### ChunkNavigator
Zarządza nawigacją wysokiego poziomu między chunkery używając A* na grafie chunków.

### LocalPathfinder
Implementuje A* pathfinding w obrębie pojedynczego chunka z obsługą optymalizacji ścieżek.

### PathSegmentBuilder
Buduje segmenty ścieżki łącząc nawigację wysokiego i niskiego poziomu.

### TransitionResolver
Zarządza wyborem i walidacją punktów przejścia między chunkery.

### CoordUtils
Narzędzia do konwersji między systemami współrzędnych (globalne, chunk, lokalne).

### DataStructures
PriorityQueue (binary heap) i klasa Path do przechowywania wyników pathfinding.

## 📈 Wydajność

- Hierarchical approach redukuje złożoność obliczeniową
- Cache ścieżek z LRU eviction
- Optymalizacja ścieżek przez usuwanie niepotrzebnych waypoints
- Efficient binary heap dla A* priority queue

## 🐛 Rozwiązywanie problemów

### Nie znaleziono ścieżki
1. Upewnij się że pozycje startowa i końcowa są na kafelkach wody (0)
2. Sprawdź czy istnieją punkty przejścia między wymaganymi chunkami
3. Zweryfikuj że punkty przejścia są na dostępnych kafelkach

### Błędy współrzędnych
1. Sprawdź czy globalne pozycje mieszczą się w granicach mapy
2. Zweryfikuj format ID chunków ("x,y")
3. Upewnij się że chunkSize i tileSize są dodatnie

## 📝 Licencja

Ten projekt jest dostępny na tej samej licencji co oryginalny projekt Defold. 