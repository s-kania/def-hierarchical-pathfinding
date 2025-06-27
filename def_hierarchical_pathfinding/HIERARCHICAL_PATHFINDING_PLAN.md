# Plan Biblioteki Hierarchicznego Pathfindingu dla Defold

## 📋 Przegląd

Biblioteka Lua do obsługi hierarchicznego pathfindingu w Defold, która przyjmuje globalne koordynaty startowe i końcowe, a zwraca segmenty ruchu przez chunki mapy.

## 🎯 Cel Biblioteki

- **Input**: Globalne koordynaty startowe i końcowe (vector3)
- **Output**: Lista segmentów ruchu, gdzie każdy segment zawiera:
  - `chunk`: ID chunka (np. "8_2")
  - `position`: Pozycja globalna środka kafelka (vector3)

## 🏗️ Architektura

### Główne Komponenty

1. **HierarchicalPathfinder** - główny moduł
2. **ChunkNavigator** - nawigacja między chunkami
3. **LocalPathfinder** - pathfinding wewnątrz chunka
4. **TransitionResolver** - zarządzanie punktami przejścia
5. **PathSegmentBuilder** - budowanie segmentów ścieżki

### Struktura Plików

```
def_hierarchical_pathfinding/
├── hierarchical_pathfinding.lua    # Główny moduł
├── src/
│   ├── chunk_navigator.lua         # Nawigacja wysokopoziomowa
│   ├── local_pathfinder.lua        # A* dla pojedynczego chunka
│   ├── transition_resolver.lua     # Punkty przejścia między chunkami
│   ├── path_segment_builder.lua    # Budowanie segmentów
│   └── utils/
│       ├── coord_utils.lua         # Konwersje współrzędnych
│       └── data_structures.lua     # Kolejki priorytetowe, etc.
└── tests/
    └── test_pathfinding.lua        # Testy jednostkowe
```

## 🔧 Główne Funkcje API

### Inicjalizacja

```lua
-- Inicjalizacja pathfindera z konfiguracją mapy
HierarchicalPathfinder.init(config)
-- config = {
--     chunk_size = 6,          -- rozmiar chunka w kafelkach
--     tile_size = 16,          -- rozmiar kafelka w jednostkach
--     map_width = 30,          -- szerokość mapy w chunkach
--     map_height = 18,         -- wysokość mapy w chunkach
--     get_chunk_data = function(chunk_id) ... end,  -- funkcja zwracająca dane chunka
--     transition_points = {    -- dane punktów przejścia
--         {
--             id = "0,0-1,0-3",
--             chunks = ["0,0", "1,0"],
--             position = 3,
--             connections = {{id = "0,0-0,1-2", weight = 5}}
--         },
--         ...
--     }
-- }
```

### Funkcja Pobierania Danych Chunka

```lua
-- Przykładowa implementacja funkcji get_chunk_data
-- Ta funkcja jest dostarczana przez użytkownika biblioteki
function get_chunk_data(chunk_id)
    -- Zwraca tablicę 2D z danymi chunka
    -- 0 = woda (przechodne), 1 = ląd (nieprzechodne)
    return {
        {0, 0, 1, 1, 0, 0},
        {0, 1, 1, 1, 1, 0},
        {0, 0, 0, 0, 0, 0},
        {0, 0, 0, 0, 0, 0},
        {1, 1, 0, 0, 1, 1},
        {1, 1, 0, 0, 1, 1}
    }
end
```

> **Uwaga**: Mapa jest statyczna - nie ma potrzeby aktualizacji danych chunków w trakcie działania.

### Znajdowanie Ścieżki

```lua
-- Główna funkcja znajdowania ścieżki
local path_segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
-- start_pos = vmath.vector3(x, y, z)  -- globalna pozycja startowa
-- end_pos = vmath.vector3(x, y, z)    -- globalna pozycja końcowa
-- 
-- Zwraca tablicę segmentów, gdzie każdy segment wskazuje następny cel ruchu:
-- path_segments = {
--     {chunk = "0,0", position = vmath.vector3(48, 32, 0)},  -- punkt przejścia do chunka 1,0
--     {chunk = "1,0", position = vmath.vector3(64, 48, 0)},  -- punkt przejścia do chunka 2,0
--     {chunk = "2,0", position = vmath.vector3(128, 64, 0)} -- punkt końcowy (cel)
-- }
-- 
-- Każda pozycja odpowiada środkowi kafelka w globalnych współrzędnych.
-- Pozycja w segmencie jest pierwszym kafelkiem w następnym chunku (poza ostatnim segmentem).
```

### Funkcje Pomocnicze

```lua
-- Konwersja między współrzędnymi
local chunk_id = HierarchicalPathfinder.get_chunk_from_global(global_pos)
local local_pos = HierarchicalPathfinder.global_to_local(global_pos, chunk_id)
local global_pos = HierarchicalPathfinder.local_to_global(local_pos, chunk_id)

-- Sprawdzanie dostępności
local is_walkable = HierarchicalPathfinder.is_position_walkable(global_pos)
local has_path = HierarchicalPathfinder.can_reach(start_pos, end_pos)

-- Przykład użycia z funkcją get_chunk_data
local chunk_data = config.get_chunk_data("2,1")
-- chunk_data będzie tablicą 2D z 0 (woda) i 1 (ląd)
```

## 🔄 Algorytm Działania

### 1. Faza Wysokopoziomowa (Chunk Navigation)
1. Określ chunk startowy i końcowy
2. Znajdź ścieżkę między chunkami używając grafu połączeń
3. Dla każdej pary sąsiednich chunków, wybierz optymalny punkt przejścia

### 2. Faza Niskopoziomowa (Local Pathfinding)
1. Dla każdego chunka na ścieżce:
   - Znajdź lokalną ścieżkę od punktu wejścia do punktu wyjścia
   - Użyj A* z heurystyką Manhattan/Euclidean
   - Pathfinding tylko po wodzie (tiles = 0)
   - Zoptymalizuj ścieżkę (line-of-sight, smoothing)

### 3. Budowanie Segmentów
1. Połącz lokalne ścieżki w segmenty
2. Każdy segment kończy się na punkcie przejścia lub celu
3. Konwertuj pozycje lokalne na globalne

## 🚨 Corner Cases

### 1. **Start i koniec w tym samym chunku**
- Bezpośrednie użycie lokalnego pathfindingu
- Zwróć jeden segment z chunkiem i pozycją końcową
```lua
-- Przykład zwrotu:
{
    {chunk = "2,1", position = vmath.vector3(48, 32, 0)} -- pozycja końcowa
}
```

### 2. **Brak ścieżki między chunkami**
- Chunki oddzielone bez połączeń
- Brak punktów przejścia między wyspami
- Zwróć nil

### 3. **Punkt startowy/końcowy na lądzie**
- Pathfinding odbywa się tylko na wodzie (tile = 0)
- Jeśli start lub koniec na lądzie (tile = 1), zwróć nil
- Alternatywnie: znajdź najbliższy tile wody

### 4. **Punkt przejścia zablokowany**
- Wybór alternatywnego punktu przejścia
- Jeśli wszystkie zablokowane, ta trasa między chunkami niedostępna

### 5. **Graniczne pozycje**
- Pozycja dokładnie na granicy chunków
- Deterministyczne przypisanie do chunka (np. zawsze do lewego/górnego)
- Obsługa floating-point precision

## 📊 Struktury Danych

### Format Danych Chunka
```lua
-- Tablica 2D reprezentująca chunk
-- 0 = woda (przechodne), 1 = ląd (nieprzechodne)
chunk_data = {
    {0, 0, 1, 1, 0, 0},
    {0, 1, 1, 1, 1, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1}
}
```

### Format Punktów Przejścia
```lua
transition_point = {
    id = "0,0-1,0-3",           -- format: "chunkA-chunkB-position"
    chunks = {"0,0", "1,0"},    -- dwa chunki które łączy
    position = 3,               -- pozycja na krawędzi (0 do chunk_size-1)
    connections = {             -- połączenia z innymi punktami
        {
            id = "0,0-0,1-2",   -- ID połączonego punktu
            weight = 5          -- waga/koszt przejścia
        },
        -- więcej połączeń...
    }
}
```

### Path Cache
```lua
path_cache = {
    ["start_x,y_end_x,y"] = {
        segments = {...},
        timestamp = os.time()
    }
}
```

## 🔐 Optymalizacje

1. **Caching**
   - Cache wysokopoziomowych ścieżek między chunkami
   - Cache lokalnych ścieżek w często używanych chunkach
   - LRU eviction policy

2. **Preprocessing**
   - Precompute transition points
   - Build chunk connectivity graph
   - Calculate heuristic distances

3. **Lazy Evaluation**
   - Obliczaj tylko następny segment
   - Stream kolejne segmenty na żądanie

4. **Spatial Indexing**
   - Quadtree dla szybkiego lookup chunków
   - Hierarchical representation dla dużych map

## 🧪 Testowanie

### Unit Tests
- Test konwersji współrzędnych
- Test A* w pojedynczym chunku
- Test wyboru punktów przejścia

### Integration Tests
- Test pełnej ścieżki przez wiele chunków
- Test corner cases
- Test wydajności na dużych mapach

### Benchmarks
- Czas znajdowania ścieżki vs długość
- Zużycie pamięci vs rozmiar mapy
- Cache hit ratio

## 🔗 Integracja z Defold

### Message Passing
```lua
-- Wysyłanie żądania pathfindingu
msg.post("pathfinder", "find_path", {
    start_pos = go.get_position(),
    end_pos = target_pos
})

-- Odbieranie wyniku
function on_message(self, message_id, message)
    if message_id == hash("path_found") then
        self.path_segments = message.segments
        -- rozpocznij ruch
    end
end
```

### Coroutines dla Async
```lua
-- Asynchroniczne obliczanie ścieżki
function find_path_async(start_pos, end_pos, callback)
    local co = coroutine.create(function()
        local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
        callback(segments)
    end)
    coroutine.resume(co)
end
``` 