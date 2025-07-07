# Hierarchical Pathfinding - Simplified Architecture (KISS)

## Przegląd

Uproszczona architektura hierarchicznego pathfinding została zaprojektowana zgodnie z zasadą **KISS (Keep It Simple, Stupid)**:
- **Minimalna złożoność** - tylko to, co naprawdę potrzebne
- **Bezpośrednie zależności** - brak niepotrzebnych abstrakcji
- **Prosta konfiguracja** - plain object zamiast builder pattern
- **Jasna struktura** - łatwa do zrozumienia i utrzymania

## Struktura katalogów

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

## Wzorce projektowe (tylko niezbędne)

### 1. Strategy Pattern
- **Algorytmy**: `PathfindingAlgorithm` - interfejs, `AStarAlgorithm`, `JPSAlgorithm` - implementacje
- **Heurystyki**: `Heuristic` - interfejs, konkretne heurystyki - implementacje

### 2. Dependency Injection (uproszczona)
- `LocalPathfinder` otrzymuje parametry przez konstruktor
- `HierarchicalPathfinder` tworzy komponenty na podstawie konfiguracji

## Klasy główne

### HierarchicalPathfinder
Główna klasa orchestrating cały proces pathfinding:
- Inicjalizuje komponenty na podstawie prostego obiektu konfiguracyjnego
- Koordynuje pathfinding lokalny i hierarchiczny
- Waliduje dane wejściowe

### LocalPathfinder
Pathfinding w obrębie pojedynczego chunka:
- Prosty konstruktor z parametrami algorytmu
- Konwertuje współrzędne globalne na lokalne
- Zwraca segmenty ścieżki

### TransitionPathfinder
Pathfinding na poziomie hierarchicznym:
- Znajduje ścieżki między punktami przejścia
- Używa A* z konfigurowalną heurystyką
- Implementuje własną kolejkę priorytetową

## Konfiguracja (uproszczona)

### Prosty obiekt konfiguracyjny
```javascript
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
    getChunkData: (chunkId) => { /* ... */ },
    transitionPoints: [ /* ... */ ]
};
```

### Walidacja
Walidacja jest wbudowana w `HierarchicalPathfinder.init()`:
- Sprawdza wymagane pola
- Waliduje typy danych
- Sprawdza wartości dodatnie

## Rozszerzanie systemu

### Dodawanie nowego algorytmu
1. Implementuj `PathfindingAlgorithm`
2. Dodaj do `LocalPathfinder.createAlgorithm()`
3. Dodaj do `index.js`

### Dodawanie nowej heurystyki
1. Implementuj `Heuristic`
2. Dodaj do `TransitionPathfinder.getHeuristic()`
3. Dodaj do `index.js`

## Korzyści uproszczonej architektury

1. **Prostota**: Mniej plików, mniej abstrakcji
2. **Czytelność**: Jasna struktura bez nadmiarowych wzorców
3. **Łatwość utrzymania**: Mniej zależności do zarządzania
4. **Wydajność**: Mniej warstw abstrakcji
5. **Rozszerzalność**: Nadal łatwe dodawanie nowych funkcji
6. **Testowalność**: Proste komponenty łatwiej testować

## Przykład użycia

### Podstawowe użycie
```javascript
import { HierarchicalPathfinder } from './src/index.js';

const config = {
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    heuristicWeight: 1.0,
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: (chunkId) => { /* ... */ },
    transitionPoints: [ /* ... */ ]
};

const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);

const path = pathfinder.findPath({ x: 50, y: 50 }, { x: 200, y: 100 });
```

### Użycie z JPS
```javascript
const config = {
    localAlgorithm: 'jps',
    localHeuristic: 'euclidean',
    heuristicWeight: 1.2,
    // ... reszta konfiguracji
};
```

## Metryki uproszczonej architektury

### Przed uproszczeniem:
- 20+ plików
- 4 wzorce projektowe
- ~2000 linii kodu
- Złożona konfiguracja z builder pattern

### Po uproszczeniu:
- 10 plików
- 2 wzorce projektowe
- ~1000 linii kodu
- Prosta konfiguracja z plain object

## Zasady KISS w praktyce

1. **Nie implementuj abstrakcji** dopóki nie masz 3+ implementacji
2. **Nie dodawaj wzorców** dopóki nie są naprawdę potrzebne
3. **Używaj prostych struktur** zamiast złożonych
4. **Minimalizuj zależności** między komponentami
5. **Pisz kod, który jest łatwy do zrozumienia**

## Kompatybilność wsteczna

- Stary import `HierarchicalPathfinding` nadal działa
- Stara konfiguracja jest obsługiwana
- Wszystkie istniejące funkcje działają bez zmian
- Nowe funkcjonalności są opcjonalne

## Podsumowanie

Uproszczona architektura zachowuje wszystkie funkcjonalności, ale jest znacznie łatwiejsza do zrozumienia i utrzymania. Zasada KISS została zastosowana konsekwentnie, usuwając niepotrzebne abstrakcje i wzorce projektowe. 