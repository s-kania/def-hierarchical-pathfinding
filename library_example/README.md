# Chunk Map - Island Generator

Generator map z wyspami używający Lua (Fengari) do generowania wysp i JavaScript do UI.

## Uruchomienie

**Ważne**: Aplikacja musi być uruchomiona przez serwer HTTP ze względu na politykę CORS.

### Opcja 1: Python HTTP Server (zalecane)

```bash
cd library_example && python3 -m http.server 8000
python3 -m http.server 8000
```

Następnie otwórz w przeglądarce: `http://localhost:8000`

### Opcja 2: Node.js HTTP Server (alternatywa)

```bash
cd library_example
npx http-server -p 8000
```

### Opcja 3: PHP Server (alternatywa)

```bash
cd library_example
php -S localhost:8000
```

## Funkcjonalności

- **Generowanie wysp w Lua** - algorytm cellular automata
- **UI w JavaScript** - suwaki, przyciski, renderowanie canvas
- **Eksport PNG** - zapis wygenerowanej mapy
- **Fallback mechanism** - działa nawet jeśli Lua się nie załaduje

## Struktura plików

- `index.html` - główny plik HTML
- `style.css` - stylowanie
- `app.js` - logika UI i renderowania
- `island_generator.lua` - algorytmy generowania wysp w Lua
- `fengari-web.js` - biblioteka Fengari (Lua w przeglądarce)

## Debugowanie

Otwórz konsolę deweloperską (F12) żeby zobaczyć komunikaty:
- Lua: `"✓ Lua Island Generator is ready!"`
- JavaScript: `"✓ Using Lua island generator"` lub `"⚠️ Using JavaScript fallback"` 