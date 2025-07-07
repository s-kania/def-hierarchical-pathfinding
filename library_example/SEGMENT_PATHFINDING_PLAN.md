# Plan implementacji: Krokowe obliczanie segmentów ścieżki hierarchicznej

## Opis funkcjonalności

Dodanie możliwości krokowego obliczania i wizualizacji lokalnych ścieżek w ramach hierarchicznej ścieżki. Użytkownik może przejść przez każdy segment osobno, zobaczyć rzeczywistą ścieżkę po kafelkach zamiast linii hierarchicznej.

## Funkcjonalności do implementacji

### 1. Przycisk "Calculate next segment"
- **Lokalizacja**: Obok przycisku "Print point data" w map-info-header
- **Stan**: Widoczny tylko po obliczeniu ścieżki hierarchicznej
- **Zachowanie**: Każde kliknięcie oblicza kolejny segment

### 2. Zarządzanie stanem segmentów
- Licznik aktualnego segmentu (0-based)
- Przechowywanie obliczonych lokalnych ścieżek
- Resetowanie stanu przy nowym obliczeniu ścieżki hierarchicznej
- Informacja o postępie (np. "Segment 2/5")

### 3. Logika obliczania segmentów
- Pobieranie aktualnego segmentu z hierarchicznej ścieżki
- Ignorowanie chunk 'start' w segmentach
- Uruchomienie lokalnego pathfindera dla danego chunka
- Zapisywanie wyniku lokalnej ścieżki

### 4. Wizualizacja lokalnych ścieżek
- Rysowanie rzeczywistych ścieżek po kafelkach
- Dodanie zielonych kwadracików na każdym kafelku ścieżki
- Zastąpienie linii hierarchicznej dla obliczonych segmentów
- Zachowanie wizualizacji punktów przejścia

## Plan implementacji

### Etap 1: Dodanie UI
1. **HTML**: Dodanie przycisku "Calculate next segment" w `index.html`
2. **CSS**: Stylowanie przycisku (jeśli potrzebne)
3. **Stan**: Dodanie licznika segmentów w `PathfindingUIController.js`

### Etap 2: Logika zarządzania segmentami
1. **Klasa SegmentManager**: Nowa klasa do zarządzania stanem segmentów
   - `currentSegmentIndex`
   - `calculatedSegments` - tablica obliczonych ścieżek lokalnych
   - `hierarchicalPath` - przechowywanie ścieżki hierarchicznej
   - `reset()` - resetowanie stanu
   - `getNextSegment()` - pobieranie następnego segmentu do obliczenia

### Etap 3: Integracja z istniejącym pathfindingiem
1. **Modyfikacja PathfindingUIController.js**:
   - Dodanie obsługi przycisku "Calculate next segment"
   - Integracja z SegmentManager
   - Aktualizacja stanu UI po każdym segmencie

2. **Wykorzystanie LocalPathfinder.js**:
   - Uruchomienie lokalnego pathfindera dla każdego segmentu
   - Przekazanie odpowiednich parametrów (start, end, chunk)

### Etap 4: Wizualizacja
1. **Modyfikacja CanvasRenderer.js**:
   - Dodanie metody `renderLocalPath()` do rysowania lokalnych ścieżek
   - Dodanie zielonych kwadracików na kafelkach ścieżki
   - Aktualizacja `renderPath()` aby uwzględniać lokalne ścieżki

2. **Kolory i style**:
   - Zielone kwadraciki na kafelkach lokalnej ścieżki
   - Zachowanie istniejących kolorów dla punktów przejścia

### Etap 5: Testowanie i debugowanie
1. **Testy funkcjonalności**:
   - Sprawdzenie poprawności obliczania segmentów
   - Weryfikacja wizualizacji
   - Testowanie edge cases (jeden segment, ostatni segment)

2. **Debugowanie**:
   - Dodanie logów do konsoli
   - Sprawdzenie poprawności danych segmentów

## Szczegóły techniczne

### Struktura danych segmentu
```javascript
{
  chunkId: string,
  startPoint: {x, y},
  endPoint: {x, y},
  localPath: [{x, y}, ...], // obliczona ścieżka lokalna
  calculated: boolean
}
```

### API SegmentManager
```javascript
class SegmentManager {
  constructor()
  reset()
  setHierarchicalPath(path)
  getNextSegment()
  calculateSegment(segmentIndex)
  getCalculatedSegments()
  isComplete()
  getProgress() // zwraca "2/5" format
}
```

### Modyfikacje w CanvasRenderer
```javascript
renderLocalPath(segment, tileSize)
renderPathWithSegments(hierarchicalPath, calculatedSegments)
```

## Pliki do modyfikacji

1. `library_example/index.html` - dodanie przycisku
2. `library_example/js/ui/PathfindingUIController.js` - logika UI
3. `library_example/js/rendering/CanvasRenderer.js` - wizualizacja
4. `library_example/js/pathfinding/LocalPathfinder.js` - wykorzystanie istniejącego
5. Nowy plik: `library_example/js/pathfinding/SegmentManager.js` - zarządzanie segmentami

## Kolejność implementacji

1. ✅ Utworzenie planu (ten plik)
2. ✅ Dodanie przycisku w HTML
3. 🔄 Utworzenie SegmentManager.js
4. 🔄 Modyfikacja PathfindingUIController.js
5. 🔄 Modyfikacja CanvasRenderer.js
6. 🔄 Testowanie i debugowanie
7. 🔄 Finalizacja i optymalizacja

## Uwagi i ograniczenia

- Ignorowanie chunk 'start' w segmentach
- Zachowanie istniejącej funkcjonalności pathfindingu
- Kompatybilność z różnymi algorytmami (A*, JPS)
- Obsługa przypadków gdy ścieżka hierarchiczna jest pusta lub nieprawidłowa 