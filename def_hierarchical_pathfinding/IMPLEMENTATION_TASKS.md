# Zadania Implementacji - Biblioteka Hierarchicznego Pathfindingu

## 📋 Przegląd Zadań

Implementacja biblioteki hierarchicznego pathfindingu dla Defold podzielona na konkretne zadania z priorytetami i zależnościami.

## 🔢 Kolejność Implementacji

### Faza 1: Podstawowe Struktury i Narzędzia

#### ✅ Task 1.1: Struktura Projektu
**Priorytet**: Krytyczny  
**Czas**: 30 min

- [ ] Utworzyć strukturę katalogów:
  ```
  def_hierarchical_pathfinding/
  ├── hierarchical_pathfinding.lua
  ├── run_tests.sh
  ├── src/
  │   ├── utils/
  │   │   ├── coord_utils.lua
  │   │   └── data_structures.lua
  │   ├── local_pathfinder.lua
  │   ├── chunk_navigator.lua
  │   ├── transition_resolver.lua
  │   └── path_segment_builder.lua
  └── spec/
      ├── README.md
      ├── coord_utils_spec.lua
      ├── example_spec.lua
      └── integration_spec.lua
  ```
- [ ] Utworzyć podstawowe pliki z nagłówkami modułów
- [ ] Dodać komentarze dokumentujące w każdym pliku

#### ✅ Task 1.2: Moduł Narzędzi Współrzędnych
**Plik**: `src/utils/coord_utils.lua`  
**Priorytet**: Krytyczny  
**Czas**: 1-2h

```lua
-- Funkcje do implementacji:
-- coord_utils.chunk_id_to_coords(chunk_id) -> {x, y}
-- coord_utils.coords_to_chunk_id(x, y) -> "x,y"
-- coord_utils.global_to_chunk_id(global_pos, chunk_size, tile_size) -> chunk_id
-- coord_utils.global_to_local(global_pos, chunk_id, chunk_size, tile_size) -> {x, y}
-- coord_utils.local_to_global(local_pos, chunk_id, chunk_size, tile_size) -> vector3
-- coord_utils.tile_center_to_global(tile_x, tile_y, chunk_id, chunk_size, tile_size) -> vector3
```

- [ ] Parsowanie chunk ID ("2,3" -> {x=2, y=3})
- [ ] Konwersja globalnych pozycji na chunk ID
- [ ] Konwersja między współrzędnymi lokalnymi i globalnymi
- [ ] Obsługa pozycji granicznych (edge cases)
- [ ] Testy jednostkowe konwersji

#### ✅ Task 1.3: Struktury Danych
**Plik**: `src/utils/data_structures.lua`  
**Priorytet**: Wysoki  
**Czas**: 1h

```lua
-- Struktury do implementacji:
-- PriorityQueue - dla algorytmu A*
-- Path - reprezentacja ścieżki
```

- [ ] Implementacja kolejki priorytetowej (binary heap)
- [ ] Metody: push, pop, empty, contains
- [ ] Struktura dla węzła A* (pozycja, g_score, f_score, parent)

### Faza 2: Pathfinding Lokalny

#### ✅ Task 2.1: Algorytm A* dla Pojedynczego Chunka
**Plik**: `src/local_pathfinder.lua`  
**Priorytet**: Krytyczny  
**Czas**: 3-4h

```lua
-- Główna funkcja:
-- local_pathfinder.find_path(chunk_data, start_pos, end_pos) -> path lub nil
```

- [ ] Implementacja podstawowego A*
- [ ] Heurystyka Manhattan distance
- [ ] Sprawdzanie tylko wody (tile = 0)
- [ ] Obsługa 4-kierunkowego ruchu
- [ ] Rekonstrukcja ścieżki
- [ ] Optymalizacja: early exit gdy cel osiągnięty

#### ✅ Task 2.2: Optymalizacje Ścieżki
**Plik**: `src/local_pathfinder.lua`  
**Priorytet**: Średni  
**Czas**: 2h

- [ ] Line-of-sight smoothing
- [ ] Usuwanie zbędnych węzłów
- [ ] Cache sąsiadów dla wydajności

### Faza 3: Nawigacja Wysokopoziomowa

#### ✅ Task 3.1: Graf Chunków
**Plik**: `src/chunk_navigator.lua`  
**Priorytet**: Krytyczny  
**Czas**: 2-3h

```lua
-- Funkcje:
-- chunk_navigator.build_chunk_graph(transition_points) -> graph
-- chunk_navigator.find_chunk_path(graph, start_chunk, end_chunk) -> chunk_path
```

- [ ] Budowanie grafu z punktów przejścia
- [ ] Struktura grafu (adjacency list)
- [ ] A* na poziomie chunków
- [ ] Wagi krawędzi z transition points

#### ✅ Task 3.2: Wybór Punktów Przejścia
**Plik**: `src/transition_resolver.lua`  
**Priorytet**: Wysoki  
**Czas**: 2h

```lua
-- Funkcje:
-- transition_resolver.get_transition_point(from_chunk, to_chunk, transition_points) -> point
-- transition_resolver.get_optimal_transition(from_pos, to_pos, available_points) -> point
```

- [ ] Znajdowanie punktów między chunkami
- [ ] Wybór optymalnego punktu (najbliższy do celu)
- [ ] Obsługa wielu punktów przejścia

### Faza 4: Budowanie Segmentów

#### ✅ Task 4.1: Konstruktor Segmentów
**Plik**: `src/path_segment_builder.lua`  
**Priorytet**: Krytyczny  
**Czas**: 3h

```lua
-- Główna funkcja:
-- path_segment_builder.build_segments(chunk_path, start_pos, end_pos, config) -> segments
```

- [ ] Iteracja przez chunk path
- [ ] Dla każdego przejścia: lokalny pathfinding
- [ ] Konwersja na globalne pozycje
- [ ] Budowanie tablicy segmentów
- [ ] Obsługa pojedynczego chunka

#### ✅ Task 4.2: Walidacja i Edge Cases
**Plik**: `src/path_segment_builder.lua`  
**Priorytet**: Wysoki  
**Czas**: 2h

- [ ] Sprawdzanie czy punkty przejścia są dostępne
- [ ] Fallback gdy punkt zablokowany
- [ ] Walidacja kompletności ścieżki

### Faza 5: Główny Moduł

#### ✅ Task 5.1: API Głównego Modułu
**Plik**: `hierarchical_pathfinding.lua`  
**Priorytet**: Krytyczny  
**Czas**: 2-3h

```lua
-- API:
-- HierarchicalPathfinder.init(config)
-- HierarchicalPathfinder.find_path(start_pos, end_pos) -> segments lub nil
```

- [ ] Funkcja init z walidacją konfiguracji
- [ ] Przechowywanie config i transition_points
- [ ] Orkiestracja wszystkich modułów
- [ ] Obsługa błędów i zwracanie nil

#### ✅ Task 5.2: Cache i Optymalizacje
**Plik**: `hierarchical_pathfinding.lua`  
**Priorytet**: Średni  
**Czas**: 2h

- [ ] Cache wyników pathfindingu
- [ ] LRU eviction
- [ ] Invalidacja cache (opcjonalna)

### Faza 6: Testowanie

#### ✅ Task 6.0: Konfiguracja Busted z Docker
**Priorytet**: Wysoki  
**Czas**: 30 min

- [x] Skonfigurować Busted framework z obrazem Docker `imega/busted:latest`
- [x] Utworzyć skrypt `run_tests.sh` z opcjami:
  - Normalne uruchomienie: `./run_tests.sh`
  - Tryb obserwowania: `./run_tests.sh watch`
  - Pokrycie kodu: `./run_tests.sh coverage`
  - Tryb szczegółowy: `./run_tests.sh verbose`
- [x] Struktura katalogów testów w `spec/` (nie `tests/`)

#### ✅ Task 6.1: Testy Jednostkowe
**Pliki**: `spec/*_spec.lua`  
**Priorytet**: Wysoki  
**Czas**: 3-4h

```lua
-- Przykład struktury testów z Busted
describe("Coordinate Utils", function()
    local coord_utils = require "src.utils.coord_utils"
    
    describe("chunk_id_to_coords", function()
        it("should parse chunk ID correctly", function()
            local result = coord_utils.chunk_id_to_coords("2,3")
            assert.are.same({x=2, y=3}, result)
        end)
    end)
    
    describe("global_to_chunk_id", function()
        it("should convert global position to chunk ID", function()
            local pos = {x=48, y=32, z=0}
            local result = coord_utils.global_to_chunk_id(pos, 6, 16)
            assert.are.equal("3,2", result)
        end)
    end)
end)

describe("Local Pathfinder", function()
    local local_pathfinder = require "src.local_pathfinder"
    
    describe("find_path", function()
        it("should find simple path", function()
            local chunk_data = {{0,0,0}, {0,0,0}, {0,0,0}}
            local path = local_pathfinder.find_path(chunk_data, {x=0,y=0}, {x=2,y=2})
            assert.is_not_nil(path)
        end)
    end)
end)
```

- [ ] Testy konwersji współrzędnych
- [ ] Testy A* (proste przypadki)
- [ ] Testy budowania grafu
- [ ] Testy segmentów
- [ ] Testy edge cases

**Uruchamianie testów:**
```bash
# Wszystkie testy
./run_tests.sh

# Tryb obserwowania (uruchamia testy przy każdej zmianie)
./run_tests.sh watch

# Z pokryciem kodu
./run_tests.sh coverage

# Tryb szczegółowy (verbose)
./run_tests.sh verbose
```

#### ✅ Task 6.2: Testy Integracyjne
**Plik**: `spec/integration_spec.lua`  
**Priorytet**: Wysoki  
**Czas**: 2h

- [ ] Test pełnej ścieżki (3+ chunki)
- [ ] Test braku ścieżki (nil)
- [ ] Test pojedynczego chunka
- [ ] Test z przykładową mapą
- [ ] Uruchamianie przez: `./run_tests.sh` lub `busted spec/`

### Faza 7: Integracja z Defold

#### ✅ Task 7.1: Przykład Użycia
**Plik**: `example/pathfinding_example.script`  
**Priorytet**: Średni  
**Czas**: 2h

- [ ] Skrypt Defold pokazujący użycie
- [ ] Wizualizacja ścieżki
- [ ] Obsługa kliknięć myszy
- [ ] Animacja ruchu agenta

#### ✅ Task 7.2: Dokumentacja
**Plik**: `README.md`  
**Priorytet**: Średni  
**Czas**: 1h

- [ ] Instrukcja instalacji
- [ ] Przykłady użycia
- [ ] Opis API
- [ ] Wymagania i ograniczenia
- [ ] Instrukcje uruchamiania testów z [Busted](https://lunarmodules.github.io/busted/) przez Docker:
  - `./def_hierarchical_pathfinding/run_tests.sh`
  - `./def_hierarchical_pathfinding/run_tests.sh watch`
  - `./def_hierarchical_pathfinding/run_tests.sh coverage`

## 📊 Podsumowanie Czasu

| Faza | Czas | Priorytet |
|------|------|-----------|
| Faza 1: Struktury | 4-5h | Krytyczny |
| Faza 2: Local Path | 5-6h | Krytyczny |
| Faza 3: Chunk Nav | 4-5h | Krytyczny |
| Faza 4: Segmenty | 5h | Krytyczny |
| Faza 5: Główny | 4-5h | Krytyczny |
| Faza 6: Testy | 5.5-6.5h | Wysoki |
| Faza 7: Integracja | 3h | Średni |
| **TOTAL** | **30-35h** | - |

## 🔀 Zależności między Zadaniami

```
1.1 ──┬─> 1.2 ──┬─> 2.1 ──> 2.2
      └─> 1.3 ──┤
                └─> 3.1 ──> 3.2 ──┬─> 4.1 ──> 4.2 ──> 5.1 ──> 5.2
                                  │                    │
                                  └────────────────────┴─> 6.1 ──> 6.2 ──> 7.1 ──> 7.2
```

## 🧪 Kryteria Akceptacji

### Dla każdego modułu:
- [ ] Kod jest czytelny i udokumentowany
- [ ] Brak błędów składni Lua
- [ ] Obsłużone edge cases
- [ ] Testy jednostkowe przechodzą
- [ ] Wydajność akceptowalna dla map 30x18 chunków

### Dla całej biblioteki:
- [ ] API jest intuicyjne
- [ ] Zwraca poprawne segmenty
- [ ] Obsługuje brak ścieżki (nil)
- [ ] Działa w Defold bez modyfikacji
- [ ] Dokumentacja kompletna

## 🚀 Wskazówki Implementacyjne

1. **Zacznij od testów** - napisz testy przed implementacją używając [Busted](https://lunarmodules.github.io/busted/)
2. **Małe kroki** - commituj często z jasnymi opisami
3. **Debugowanie** - dodaj print() statements podczas rozwoju lub użyj `./run_tests.sh verbose`
4. **Profiling** - mierz czas wykonania krytycznych funkcji
5. **Code review** - sprawdzaj swój kod przed merge
6. **CI/CD** - obraz Docker `imega/busted:latest` jest idealny do pipeline'ów CI/CD
7. **Obserwowanie zmian** - użyj `./run_tests.sh watch` podczas rozwoju
8. **Pokrycie kodu** - sprawdzaj pokrycie testami przez `./run_tests.sh coverage`

## 📝 Szablon Commita

```
feat(module): add function description
fix(module): fix issue description  
test(module): add tests for feature
docs: update documentation
refactor(module): improve performance
``` 