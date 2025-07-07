# Przewodnik migracji do nowej architektury

## Przegląd zmian

Nowa architektura wprowadza znaczące zmiany w strukturze kodu, ale zachowuje kompatybilność wsteczną. Oto jak migrować istniejący kod.

## Zmiany w importach

### Stary sposób:
```javascript
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';
```

### Nowy sposób (opcjonalny):
```javascript
import { HierarchicalPathfinder } from './src/index.js';
// lub dla kompatybilności wstecznej:
import { HierarchicalPathfinding } from './src/index.js';
```

## Zmiany w konfiguracji

### Stary sposób:
```javascript
const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: (chunkId) => { /* ... */ },
    transitionPoints: [ /* ... */ ],
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan',
    hierarchicalHeuristic: 'manhattan',
    heuristicWeight: 1.0
});
```

### Nowy sposób (zalecany):
```javascript
import { HierarchicalPathfinder, ConfigBuilder } from './src/index.js';

const config = ConfigBuilder.createDefault()
    .withTileSize(16)
    .withGridDimensions(8, 6)
    .withChunkDimensions(11, 11)
    .withChunkDataProvider((chunkId) => { /* ... */ })
    .withTransitionPoints([ /* ... */ ])
    .withLocalAlgorithm('astar')
    .withLocalHeuristic('manhattan')
    .withHierarchicalHeuristic('manhattan')
    .withHeuristicWeight(1.0)
    .build();

const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);
```

### Stary sposób (nadal działa):
```javascript
const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    // wszystkie parametry jak wcześniej
});
```

## Nowe możliwości

### 1. Dodawanie nowych algorytmów
```javascript
import { AlgorithmFactory } from './src/index.js';

// Sprawdź dostępne algorytmy
console.log(AlgorithmFactory.getAvailableAlgorithms()); // ['astar', 'jps']

// Sprawdź nazwy wyświetlane
console.log(AlgorithmFactory.getDisplayName('jps')); // 'JPS (Jump Point Search)'
```

### 2. Dodawanie nowych heurystyk
```javascript
import { HeuristicRegistry } from './src/index.js';

// Sprawdź dostępne heurystyki
console.log(HeuristicRegistry.getAvailableHeuristics()); 
// ['manhattan', 'euclidean', 'diagonal', 'octile']

// Sprawdź czy heurystyka jest admissible
const manhattan = HeuristicRegistry.get('manhattan');
console.log(manhattan.isAdmissible()); // true
```

### 3. Zaawansowana konfiguracja
```javascript
import { PathfindingConfig } from './src/index.js';

// Tworzenie konfiguracji z walidacją
const config = new PathfindingConfig({
    // parametry z walidacją
});

// Klonowanie z nadpisami
const newConfig = config.clone({
    localAlgorithm: 'jps',
    heuristicWeight: 1.2
});

// Pobieranie wymiarów świata
const worldDimensions = config.getWorldDimensions();
console.log(worldDimensions.width, worldDimensions.height);
```

## Migracja krok po kroku

### Krok 1: Zaktualizuj importy (opcjonalne)
```javascript
// Zmień z:
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

// Na:
import { HierarchicalPathfinder } from './src/index.js';
// lub zachowaj stary import dla kompatybilności
```

### Krok 2: Dodaj nowe importy (jeśli potrzebne)
```javascript
import { 
    HierarchicalPathfinder, 
    ConfigBuilder, 
    AlgorithmFactory,
    HeuristicRegistry 
} from './src/index.js';
```

### Krok 3: Zaktualizuj konfigurację (opcjonalne)
```javascript
// Stary sposób nadal działa, ale możesz użyć nowego:
const config = ConfigBuilder.createDefault()
    .withLocalAlgorithm('jps')  // Nowy algorytm
    .withLocalHeuristic('euclidean')  // Nowa heurystyka
    .withHeuristicWeight(1.2)  // Waga heurystyki
    .build();
```

### Krok 4: Dodaj nowe funkcjonalności
```javascript
// Sprawdź dostępne opcje
console.log('Algorithms:', AlgorithmFactory.getAvailableAlgorithms());
console.log('Heuristics:', HeuristicRegistry.getAvailableHeuristics());

// Użyj nowych algorytmów
const config = ConfigBuilder.createDefault()
    .withLocalAlgorithm('jps')
    .withLocalHeuristic('octile')
    .build();
```

## Przykłady migracji

### Przykład 1: Prosta migracja
```javascript
// PRZED:
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: getChunkData,
    transitionPoints: transitionPoints
});

// PO (zachowuje kompatybilność):
import { HierarchicalPathfinding } from './src/index.js';

const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: getChunkData,
    transitionPoints: transitionPoints
});
```

### Przykład 2: Migracja z nowymi funkcjonalnościami
```javascript
// PRZED:
import { HierarchicalPathfinding } from './HierarchicalPathfinding.js';

const pathfinder = new HierarchicalPathfinding();
pathfinder.init({
    tileSize: 16,
    gridWidth: 8,
    gridHeight: 6,
    chunkWidth: 11,
    chunkHeight: 11,
    getChunkData: getChunkData,
    transitionPoints: transitionPoints,
    localAlgorithm: 'astar',
    localHeuristic: 'manhattan'
});

// PO (z nowymi możliwościami):
import { HierarchicalPathfinder, ConfigBuilder } from './src/index.js';

const config = ConfigBuilder.createDefault()
    .withTileSize(16)
    .withGridDimensions(8, 6)
    .withChunkDimensions(11, 11)
    .withChunkDataProvider(getChunkData)
    .withTransitionPoints(transitionPoints)
    .withLocalAlgorithm('jps')  // Nowy algorytm
    .withLocalHeuristic('euclidean')  // Nowa heurystyka
    .withHeuristicWeight(1.1)  // Optymalizacja wydajności
    .build();

const pathfinder = new HierarchicalPathfinder();
pathfinder.init(config);
```

### Przykład 3: Zaawansowana migracja z UI
```javascript
// PRZED:
function updatePathfindingSettings() {
    const settings = {
        localAlgorithm: document.getElementById('localAlgorithm').value,
        localHeuristic: document.getElementById('localHeuristic').value,
        heuristicWeight: parseFloat(document.getElementById('heuristicWeight').value)
    };
    
    pathfinder.init({
        ...existingConfig,
        ...settings
    });
}

// PO:
import { ConfigBuilder, AlgorithmFactory, HeuristicRegistry } from './src/index.js';

function updatePathfindingSettings() {
    const settings = {
        localAlgorithm: document.getElementById('localAlgorithm').value,
        localHeuristic: document.getElementById('localHeuristic').value,
        heuristicWeight: parseFloat(document.getElementById('heuristicWeight').value)
    };
    
    // Walidacja
    if (!AlgorithmFactory.isSupported(settings.localAlgorithm)) {
        console.warn(`Algorithm ${settings.localAlgorithm} not supported`);
        return;
    }
    
    if (!HeuristicRegistry.has(settings.localHeuristic)) {
        console.warn(`Heuristic ${settings.localHeuristic} not supported`);
        return;
    }
    
    const config = ConfigBuilder.createDefault()
        .withLocalAlgorithm(settings.localAlgorithm)
        .withLocalHeuristic(settings.localHeuristic)
        .withHeuristicWeight(settings.heuristicWeight)
        .build();
    
    pathfinder.init(config);
}

// Dodaj opcje do UI
function populateUI() {
    const algorithmSelect = document.getElementById('localAlgorithm');
    const heuristicSelect = document.getElementById('localHeuristic');
    
    AlgorithmFactory.getAvailableAlgorithms().forEach(algorithm => {
        const option = document.createElement('option');
        option.value = algorithm;
        option.textContent = AlgorithmFactory.getDisplayName(algorithm);
        algorithmSelect.appendChild(option);
    });
    
    HeuristicRegistry.getAvailableHeuristics().forEach(heuristic => {
        const option = document.createElement('option');
        option.value = heuristic;
        option.textContent = heuristic;
        heuristicSelect.appendChild(option);
    });
}
```

## Korzyści migracji

1. **Lepsze wsparcie dla JPS**: Szybszy algorytm dla dużych map
2. **Więcej heurystyk**: Euclidean, Diagonal, Octile
3. **Lepsza walidacja**: Automatyczna walidacja konfiguracji
4. **Większa elastyczność**: Builder pattern dla konfiguracji
5. **Lepsze testowanie**: Dependency injection
6. **Rozszerzalność**: Łatwe dodawanie nowych algorytmów

## Kompatybilność wsteczna

- Stary import `HierarchicalPathfinding` nadal działa
- Stara konfiguracja nadal jest obsługiwana
- Wszystkie istniejące funkcje działają bez zmian
- Nowe funkcjonalności są opcjonalne

## Wsparcie

Jeśli napotkasz problemy podczas migracji:
1. Sprawdź konsolę pod kątem błędów
2. Użyj starych importów dla kompatybilności
3. Przejdź na nową architekturę stopniowo
4. Skonsultuj się z dokumentacją w `ARCHITECTURE.md` 