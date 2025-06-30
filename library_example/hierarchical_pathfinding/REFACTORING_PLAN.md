# Plan Radykalnej Refaktoryzacji HierarchicalPathfinding

## 📋 Podsumowanie Problemu

Obecna biblioteka jest zbyt skomplikowana i nie wykorzystuje pre-computed grafu połączeń między punktami przejścia. Zamiast tego buduje ścieżki "na żądanie", co jest nieefektywne.

## 🎯 Cele Refaktoryzacji

1. **Wykorzystać graf connections** - używać pre-computed grafu z wagami zamiast budować połączenia na żądanie
2. **Uprościć architekturę** - zgodnie z zasadą KISS
3. **Poprawić wydajność** - mniej obliczeń podczas pathfinding
4. **Łatwiejsza integracja** - prostsza struktura danych

## 📐 Nowa Architektura

### 1. **Uproszczona Struktura Modułów**

```
HierarchicalPathfinding.js (główny moduł)
├── TransitionGraph.js     (A* na grafie punktów przejścia)
├── LocalPathfinder.js     (A* w obrębie chunka - bez zmian)
└── CoordUtils.js          (narzędzia - uproszczone)
```

**Usunąć:**
- ChunkNavigator.js (zastąpiony przez TransitionGraph.js)
- PathSegmentBuilder.js (logika przeniesiona do głównego modułu)
- TransitionResolver.js (niepotrzebny)
- DataStructures.js (użyć prostej implementacji)

### 2. **Format Danych Wejściowych**

```javascript
transitionPoints: [
  {
    id: string,              // "0,0-1,0-15"
    chunks: [string],        // ["0,0", "1,0"]
    position: number,        // 15
    connections: [           // KLUCZOWE: graf połączeń z wagami
      {
        id: string,          // ID połączonego punktu
        weight: number       // waga/koszt przejścia
      }
    ]
  }
]
```

### 3. **Algorytm Pathfinding (Nowy Flow)**

```
1. START: Znajdź najbliższy punkt przejścia do pozycji startowej
   - Sprawdź wszystkie punkty w chunku startowym
   - Użyj LocalPathfinder do weryfikacji dostępności
   - Wybierz najbliższy dostępny

2. END: Znajdź najbliższy punkt przejścia do pozycji końcowej
   - Analogicznie jak dla startu

3. SPECIAL CASE: Jeśli start i koniec w tym samym chunku
   - Użyj tylko LocalPathfinder
   - Zwróć pojedynczy segment

4. GRAPH PATH: Znajdź ścieżkę między punktami przejścia
   - Użyj A* na grafie connections
   - Input: startTransitionPoint.id, endTransitionPoint.id
   - Output: [pointId1, pointId2, ..., pointIdN]

5. BUILD SEGMENTS: Dla każdego segmentu ścieżki
   - LocalPathfinder od aktualnej pozycji do punktu przejścia
   - Przejście do następnego chunka
   - Powtórz aż do końca
```

## 🔧 Szczegółowa Implementacja

### **HierarchicalPathfinding.js** (główny moduł)
```javascript
class HierarchicalPathfinding {
  constructor() {
    this.transitionGraph = null;
    this.config = null;
  }

  init(config) {
    // Walidacja
    validateConfig(config);
    
    // Zbuduj graf przejść
    this.transitionGraph = new TransitionGraph(config.transitionPoints);
    this.config = config;
  }

  findPath(startPos, endPos) {
    // 1. Konwertuj pozycje na chunki
    const startChunk = this.getChunkId(startPos);
    const endChunk = this.getChunkId(endPos);
    
    // 2. Specjalny przypadek - ten sam chunk
    if (startChunk === endChunk) {
      return this.findLocalPath(startChunk, startPos, endPos);
    }
    
    // 3. Znajdź najbliższe punkty przejścia
    const startPoint = this.findNearestTransition(startPos, startChunk);
    const endPoint = this.findNearestTransition(endPos, endChunk);
    
    if (!startPoint || !endPoint) {
      return null; // Brak dostępnych punktów przejścia
    }
    
    // 4. Znajdź ścieżkę między punktami przejścia
    const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);
    
    if (!transitionPath) {
      return null; // Brak ścieżki
    }
    
    // 5. Zbuduj segmenty
    return this.buildPathSegments(startPos, endPos, transitionPath);
  }
  
  findNearestTransition(pos, chunkId) {
    // Znajdź wszystkie punkty przejścia w chunku
    const points = this.transitionGraph.getPointsInChunk(chunkId);
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const point of points) {
      // Sprawdź czy można dojść do punktu
      const pointPos = this.getTransitionPosition(point, chunkId);
      const path = this.findLocalPath(chunkId, pos, pointPos);
      
      if (path) {
        const distance = path.length;
        if (distance < minDistance) {
          minDistance = distance;
          nearest = point;
        }
      }
    }
    
    return nearest;
  }
}
```

### **TransitionGraph.js** (A* na grafie punktów)
```javascript
class TransitionGraph {
  constructor(transitionPoints) {
    this.points = new Map(); // id -> point
    this.graph = new Map();  // id -> connections
    
    // Buduj struktury danych
    for (const point of transitionPoints) {
      this.points.set(point.id, point);
      this.graph.set(point.id, point.connections || []);
    }
  }
  
  findPath(startId, endId) {
    // Prosty A* na grafie
    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, endId));
    openSet.push({ id: startId, f: fScore.get(startId) });
    
    while (!openSet.empty()) {
      const current = openSet.pop();
      
      if (current.id === endId) {
        return this.reconstructPath(cameFrom, endId);
      }
      
      const connections = this.graph.get(current.id) || [];
      
      for (const conn of connections) {
        const tentativeG = gScore.get(current.id) + conn.weight;
        
        if (!gScore.has(conn.id) || tentativeG < gScore.get(conn.id)) {
          cameFrom.set(conn.id, current.id);
          gScore.set(conn.id, tentativeG);
          fScore.set(conn.id, tentativeG + this.heuristic(conn.id, endId));
          openSet.push({ id: conn.id, f: fScore.get(conn.id) });
        }
      }
    }
    
    return null;
  }
  
  getPointsInChunk(chunkId) {
    const result = [];
    for (const [id, point] of this.points) {
      if (point.chunks.includes(chunkId)) {
        result.push(point);
      }
    }
    return result;
  }
}
```

## 📊 Porównanie Przed/Po

| Aspekt | Przed | Po |
|--------|-------|-----|
| **Liczba modułów** | 6 | 3 |
| **Linie kodu** | ~1200 | ~400 (szacowane) |
| **Złożoność** | Wysoka | Niska |
| **Wydajność** | O(n²) dla każdego pathfinding | O(n) z pre-computed grafem |
| **Pamięć** | Niska | Średnia (graf connections) |

## 🚀 Kroki Implementacji

1. **Faza 1: Przygotowanie**
   - [ ] Backup obecnego kodu
   - [ ] Utworzenie nowej struktury katalogów
   - [ ] Napisanie testów dla nowego API

2. **Faza 2: Implementacja Core**
   - [ ] TransitionGraph.js z A* na grafie
   - [ ] Uproszczony HierarchicalPathfinding.js
   - [ ] Zachowanie LocalPathfinder.js (działa dobrze)
   - [ ] Minimalny CoordUtils.js

3. **Faza 3: Integracja**
   - [ ] Adapter dla obecnego formatu danych
   - [ ] Aktualizacja przykładów
   - [ ] Testy integracyjne

4. **Faza 4: Optymalizacja**
   - [ ] Cache dla najczęściej używanych ścieżek
   - [ ] Optymalizacja PriorityQueue
   - [ ] Profiling wydajności

## ✅ Korzyści

1. **Prostota** - łatwiejsze zrozumienie i debugowanie
2. **Wydajność** - wykorzystanie pre-computed grafu
3. **Mniej kodu** - łatwiejsze utrzymanie
4. **Elastyczność** - łatwe dodawanie nowych features

## ⚠️ Ryzyka i Mitygacja

1. **Breaking changes** → Zapewnić adapter dla starego API
2. **Brak niektórych features** → Dodać tylko jeśli naprawdę potrzebne
3. **Różnice w wynikach** → Dokładne testy porównawcze

## 📝 Przykład Użycia (Nowe API)

```javascript
const pathfinder = new HierarchicalPathfinding();

pathfinder.init({
  chunkSize: 32,
  tileSize: 10,
  getChunkData: (chunkId) => chunks[chunkId],
  transitionPoints: [
    {
      id: "0,0-1,0-15",
      chunks: ["0,0", "1,0"],
      position: 15,
      connections: [
        { id: "0,0-0,1-20", weight: 25 },
        { id: "1,0-1,1-15", weight: 1 }
      ]
    }
    // ...więcej punktów
  ]
});

const path = pathfinder.findPath(
  { x: 10, y: 10 },
  { x: 500, y: 500 }
);
```

## 🎯 Podsumowanie

Ta refaktoryzacja radykalnie uprości bibliotekę, zwiększy wydajność i ułatwi integrację. Kluczem jest wykorzystanie pre-computed grafu connections zamiast budowania połączeń na żądanie. 