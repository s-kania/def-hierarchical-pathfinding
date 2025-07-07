# Hierarchical Pathfinding - New Architecture

## Przegląd

Nowa architektura hierarchicznego pathfinding została zaprojektowana z myślą o:
- **Modularności** - każdy komponent ma jasno określoną odpowiedzialność
- **Rozszerzalności** - łatwe dodawanie nowych algorytmów i heurystyk
- **Testowalności** - dependency injection i interfejsy
- **Czytelności** - wzorce projektowe i jasna struktura

## Struktura katalogów

```
src/
├── algorithms/           # Algorytmy pathfinding
│   ├── PathfindingAlgorithm.js    # Interfejs bazowy
│   ├── AStarAlgorithm.js          # Implementacja A*
│   ├── JPSAlgorithm.js            # Implementacja JPS
│   └── AlgorithmFactory.js        # Factory dla algorytmów
├── heuristics/          # Heurystyki
│   ├── Heuristic.js               # Interfejs bazowy
│   ├── ManhattanHeuristic.js      # Manhattan distance
│   ├── EuclideanHeuristic.js      # Euclidean distance
│   ├── DiagonalHeuristic.js       # Diagonal distance
│   ├── OctileHeuristic.js         # Octile distance
│   └── HeuristicRegistry.js       # Registry dla heurystyk
├── config/              # Konfiguracja
│   ├── PathfindingConfig.js       # Klasa konfiguracji
│   └── ConfigBuilder.js           # Builder pattern
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

## Wzorce projektowe

### 1. Strategy Pattern
- **Algorytmy**: `PathfindingAlgorithm` - interfejs, `AStarAlgorithm`, `JPSAlgorithm` - implementacje
- **Heurystyki**: `Heuristic` - interfejs, konkretne heurystyki - implementacje

### 2. Factory Pattern
- **AlgorithmFactory**: Tworzy instancje algorytmów na podstawie nazwy
- **HeuristicRegistry**: Centralny rejestr dostępnych heurystyk

### 3. Builder Pattern
- **ConfigBuilder**: Fluent interface dla konfiguracji
- **PathSegmentBuilder**: Buduje segmenty ścieżki z optymalizacją

### 4. Dependency Injection
- `LocalPathfinder` otrzymuje algorytm przez konstruktor
- `HierarchicalPathfinder` otrzymuje konfigurację i tworzy komponenty

## Klasy główne

### HierarchicalPathfinder
Główna klasa orchestrating cały proces pathfinding:
- Inicjalizuje komponenty na podstawie konfiguracji
- Koordynuje pathfinding lokalny i hierarchiczny
- Waliduje dane wejściowe

### LocalPathfinder
Pathfinding w obrębie pojedynczego chunka:
- Używa dependency injection dla algorytmu
- Konwertuje współrzędne globalne na lokalne
- Zwraca segmenty ścieżki

### TransitionPathfinder
Pathfinding na poziomie hierarchicznym:
- Znajduje ścieżki między punktami przejścia
- Używa A* z konfigurowalną heurystyką
- Implementuje własną kolejkę priorytetową

## Konfiguracja

### PathfindingConfig
Centralizuje wszystkie parametry:
```javascript
const config = new PathfindingConfig({
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    hierarchicalHeuristic: 'manhattan',
    heuristicWeight: 1.0,
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: (chunkId) => { /* ... */ },
    transitionPoints: [ /* ... */ ]
});
```

### ConfigBuilder
Fluent interface dla konfiguracji:
```javascript
const config = ConfigBuilder.createDefault()
    .withLocalAlgorithm('jps')
    .withLocalHeuristic('euclidean')
    .withHeuristicWeight(1.2)
    .build();
```

## Rozszerzanie systemu

### Dodawanie nowego algorytmu
1. Implementuj `PathfindingAlgorithm`
2. Dodaj do `AlgorithmFactory`
3. Zarejestruj w `AlgorithmFactory.getAvailableAlgorithms()`

### Dodawanie nowej heurystyki
1. Implementuj `Heuristic`
2. Zarejestruj w `HeuristicRegistry.initialize()`

### Dodawanie nowego typu pathfindera
1. Stwórz nową klasę pathfindera
2. Dodaj do `HierarchicalPathfinder` jako opcję
3. Zaktualizuj konfigurację

## Korzyści nowej architektury

1. **Modularność**: Każdy komponent ma jedną odpowiedzialność
2. **Testowalność**: Dependency injection ułatwia testowanie
3. **Rozszerzalność**: Łatwe dodawanie nowych algorytmów i heurystyk
4. **Czytelność**: Jasna struktura i wzorce projektowe
5. **Wydajność**: Optymalizacje na każdym poziomie
6. **Konfigurowalność**: Elastyczna konfiguracja przez builder pattern

## Migracja z poprzedniej architektury

### Stary sposób:
```javascript
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    // wszystkie parametry w jednym obiekcie
});
```

### Nowy sposób:
```javascript
import { HierarchicalPathfinder, ConfigBuilder } from './src/index.js';

const config = ConfigBuilder.createDefault()
    .withLocalAlgorithm('jps')
    .withLocalHeuristic('euclidean')
    .build();

const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);
```

### Kompatybilność wsteczna
Stary import `HierarchicalPathfinding` nadal działa jako alias dla `HierarchicalPathfinder`. 