# Testy Jednostkowe - Hierarchical Pathfinding

Ten katalog zawiera testy jednostkowe dla biblioteki hierarchicznego pathfindingu napisane przy użyciu frameworka [Busted](https://lunarmodules.github.io/busted/).

## Struktura Testów

- `example_spec.lua` - Przykładowe testy pokazujące podstawowe użycie Busted
- `coord_utils_spec.lua` - Testy dla modułu narzędzi współrzędnych

## Uruchamianie Testów

### Opcja 1: Używając VS Code Dev Container

1. Otwórz projekt w VS Code
2. Kliknij "Reopen in Container" gdy pojawi się powiadomienie
3. W terminalu wewnątrz kontenera uruchom:
   ```bash
   cd def_hierarchical_pathfinding
   busted spec/
   ```

### Opcja 2: Używając Docker bezpośrednio

Z głównego katalogu projektu uruchom:

```bash
# Uruchom wszystkie testy
./def_hierarchical_pathfinding/run_tests.sh

# Uruchom testy w trybie obserwowania (watch mode)
./def_hierarchical_pathfinding/run_tests.sh watch

# Uruchom testy z pokryciem kodu
./def_hierarchical_pathfinding/run_tests.sh coverage

# Uruchom testy w trybie szczegółowym
./def_hierarchical_pathfinding/run_tests.sh verbose
```

### Opcja 3: Bezpośrednio przez Docker

```bash
docker run --rm -it \
  -v "$(pwd):/workspace" \
  -w /workspace/def_hierarchical_pathfinding \
  imega/busted:latest \
  busted spec/
```

## Pisanie Testów

### Podstawowa struktura testu

```lua
describe("Nazwa modułu", function()
    describe("Nazwa funkcjonalności", function()
        it("should do something specific", function()
            -- Arrange
            local input = 5
            
            -- Act
            local result = myFunction(input)
            
            -- Assert
            assert.are.equal(10, result)
        end)
    end)
end)
```

### Dostępne asercje

- `assert.are.equal(expected, actual)` - sprawdza równość wartości
- `assert.are.same(expected, actual)` - sprawdza głęboką równość tabel
- `assert.is_true(value)` / `assert.is_false(value)` - sprawdza wartości boolean
- `assert.is_nil(value)` / `assert.is_not_nil(value)` - sprawdza nil
- `assert.has_error(function() ... end)` - sprawdza czy funkcja rzuca błąd

### Mockowanie i szpiegowanie

```lua
-- Tworzenie szpiega
local spy_func = spy.on(math, "floor")

-- Wywołanie funkcji
local result = math.floor(3.7)

-- Sprawdzenie wywołań
assert.spy(spy_func).was.called()
assert.spy(spy_func).was.called_with(3.7)

-- Przywrócenie oryginalnej funkcji
spy_func:revert()
```

### Testy oczekujące (pending)

```lua
pending("should implement this feature later")
```

## Konwencje

- Pliki testowe powinny kończyć się na `_spec.lua`
- Używaj opisowych nazw w `describe` i `it`
- Grupuj powiązane testy w blokach `describe`
- Jeden test = jedna asercja (w miarę możliwości)
- Używaj setup/teardown dla wspólnej inicjalizacji

## Debugging

Jeśli testy nie przechodzą, możesz:

1. Użyć trybu verbose: `busted spec/ -v`
2. Dodać print statements w testach
3. Użyć `--output=TAP` dla formatu kompatybilnego z CI/CD

## Integracja z CI/CD

Obraz Docker `imega/busted` jest idealny do użycia w pipeline'ach CI/CD (GitHub Actions, GitLab CI, etc.). 