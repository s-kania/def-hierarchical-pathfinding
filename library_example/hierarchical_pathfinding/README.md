# Hierarchical Pathfinding Library

**Radykalnie uproszczona biblioteka pathfinding wykorzystująca pre-computed graf connections**

## 🎯 Kluczowe Zmiany

✅ **Uproszczenie z 6 do 3 modułów**  
✅ **Wykorzystanie pre-computed grafu connections**  
✅ **Znacznie prostsze API**  
✅ **Lepsza wydajność (O(n) zamiast O(n²))**  
✅ **Zgodność z zasadą KISS**  

## 📁 Struktura Modułów

```
HierarchicalPathfinding.js     - Główny moduł API
├── src/
│   ├── TransitionGraph.js     - A* na grafie punktów przejścia
│   ├── LocalPathfinder.js     - A* w obrębie chunka (bez zmian)
│   └── utils/
│       └── CoordUtils.js      - Uproszczone narzędzia współrzędnych
```

**Usunięte moduły:**
- ❌ ChunkNavigator.js (zastąpiony przez TransitionGraph.js)
- ❌ PathSegmentBuilder.js (logika przeniesiona do głównego modułu)
- ❌ TransitionResolver.js (niepotrzebny)
- ❌ DataStructures.js (zastąpiony prostą implementacją)

## 🔧 Nowe API

### Inicjalizacja

```javascript
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

const pathfinder = new HierarchicalPathfinding();

pathfinder.init({
    chunkSize: 32,               // Rozmiar chunka w kafelkach
    tileSize: 10,                // Rozmiar kafelka w jednostkach świata
    getChunkData: (chunkId) => chunks[chunkId], // 2D array danych chunka
    transitionPoints: [          // KLUCZOWE: punkty z connections!
        {
            id: "0,0-1,0-15",
            chunks: ["0,0", "1,0"],
            position: 15,
            connections: [       // Pre-computed graf połączeń
                { id: "0,0-0,1-20", weight: 25 },
                { id: "1,0-1,1-15", weight: 8 }
            ]
        }
        // ...więcej punktów
    ]
});
```

### Pathfinding

```javascript
const path = pathfinder.findPath(
    { x: 10, y: 10 },    // Start
    { x: 500, y: 500 }   // Cel
);

// Zwraca: Array segmentów [{chunk: "0,0", position: {x, y, z}}] lub null
```

### Dodatkowe Metody

```javascript
// Sprawdź dostępność pozycji
pathfinder.isPositionWalkable({x: 100, y: 100});

// Sprawdź łączność
pathfinder.canReach(startPos, endPos);

// Pobierz statystyki grafu
pathfinder.getGraphStats();
```

## 🔄 Format Danych

### Transition Points (NOWY FORMAT)

```javascript
{
    id: string,              // "chunkA-chunkB-position"
    chunks: [string],        // ["chunkA_id", "chunkB_id"]
    position: number,        // pozycja na krawędzi chunka (0-chunkSize-1)
    connections: [           // KLUCZOWE: graf połączeń z wagami!
        {
            id: string,      // ID połączonego punktu
            weight: number   // waga/koszt przejścia
        }
    ]
}
```

### Chunk Data

```javascript
// 2D array (bez zmian)
[
    [0, 0, 0, 1, 1],  // 0 = woda (dostępne)
    [0, 0, 0, 1, 1],  // 1 = ląd (zablokowane)
    [0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 0, 0, 0]
]
```

## 🚀 Algorytm Pathfinding

1. **START**: Znajdź najbliższy punkt przejścia do pozycji startowej
2. **END**: Znajdź najbliższy punkt przejścia do pozycji końcowej  
3. **SPECIAL CASE**: Jeśli start i koniec w tym samym chunku → tylko LocalPathfinder
4. **GRAPH PATH**: A* na grafie connections między punktami przejścia
5. **BUILD SEGMENTS**: LocalPathfinder dla każdego segmentu + przejścia między chunkami

## 📊 Porównanie Przed/Po

| Aspekt | Przed | Po |
|--------|-------|-----|
| **Moduły** | 6 | 3 |
| **Linie kodu** | ~1200 | ~400 |
| **Złożoność** | Wysoka | Niska |
| **Wydajność** | O(n²) | O(n) |
| **API** | Skomplikowane | Proste |
| **Connections** | Budowane na żądanie | Pre-computed |

## ⚡ Korzyści

1. **Prostota** - łatwiejsze zrozumienie i debugowanie
2. **Wydajność** - wykorzystanie pre-computed grafu connections
3. **Mniej kodu** - łatwiejsze utrzymanie  
4. **KISS** - zgodne z zasadą "Keep It Simple, Stupid"
5. **Elastyczność** - łatwe dodawanie nowych features

## 🔧 Integracja

### Z GameDataManager.js

Biblioteka współpracuje z `GameDataManager.js` - wystarczy przekazać `transitionPoints` z built connections:

```javascript
// Po zbudowaniu grafu w GameDataManager
const transitionPoints = gameDataManager.transitionPoints;

pathfinder.init({
    chunkSize: chunkSize,
    tileSize: tileSize,
    getChunkData: (chunkId) => getChunkData(chunkId),
    transitionPoints: transitionPoints  // Już zawiera connections!
});
```

## 📝 Przykład Użycia

Zobacz `example.js` dla pełnej demonstracji nowego API z pre-computed grafem connections.

---

**Refaktoryzacja zakończona!** 🎉  
Biblioteka jest teraz znacznie prostsza, szybsza i łatwiejsza w użyciu. 