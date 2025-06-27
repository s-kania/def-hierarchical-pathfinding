# VS Code Tasks - Lua Testing

## 🚀 Jak uruchomić testy

### Opcja 1: Paleta komend (Command Palette)
1. Naciśnij `Cmd+Shift+P` (Mac) lub `Ctrl+Shift+P` (Windows/Linux)
2. Wpisz "Tasks: Run Task"
3. Wybierz jedno z zadań:
   - 🧪 **Run Lua Tests** - Uruchom wszystkie testy
   - 🔍 **Run Lua Tests (Verbose)** - Testy z szczegółowym wyjściem
   - 📊 **Run Lua Tests (Coverage)** - Testy z pokryciem kodu
   - 📺 **Watch Lua Tests** - Tryb obserwowania (ciągłe uruchamianie)

### Opcja 2: Menu Terminal
1. `Terminal` → `Run Task...`
2. Wybierz zadanie z listy

### Opcja 3: Skróty klawiaturowe
- `Cmd+Shift+T` - Uruchom podstawowe testy
- `Cmd+Shift+R` - Uruchom testy verbose
- `Cmd+Shift+W` - Tryb watch

### Opcja 4: Domyślne zadanie testowe
1. Naciśnij `Cmd+Shift+P` → "Test: Run All Tests"
2. Lub użyj `Ctrl+;` → `Ctrl+A`

## 🔧 Zadania pomocnicze

- 🐳 **Build Docker Test Environment** - Pobierz najnowszy obraz Docker
- 🧹 **Clean Test Output** - Usuń pliki pokrycia kodu

## ⚙️ Konfiguracja

### Zmiana skrótów klawiaturowych
Edytuj plik `.vscode/keybindings.json` aby dostosować skróty:

```json
{
    "key": "twój-skrót",
    "command": "workbench.action.tasks.runTask",
    "args": "🧪 Run Lua Tests"
}
```

### Dodanie nowego zadania
Edytuj plik `.vscode/tasks.json`:

```json
{
    "label": "Nazwa zadania",
    "type": "shell", 
    "command": "komenda",
    "args": ["arg1", "arg2"],
    "group": "test"
}
```

## 📋 Status zadań

Rezultaty zadań będą wyświetlane w:
- **Terminal panel** (na dole VS Code)
- **Problems panel** (jeśli są błędy)
- **Output panel** (szczegółowe logi)

## 🐛 Rozwiązywanie problemów

**Problem**: Zadanie nie uruchamia się
- Sprawdź czy plik `def_hierarchical_pathfinding/run_tests.sh` ma uprawnienia wykonywania
- Uruchom: `chmod +x def_hierarchical_pathfinding/run_tests.sh`

**Problem**: Docker nie działa
- Sprawdź czy Docker Desktop jest uruchomiony
- Uruchom zadanie "🐳 Build Docker Test Environment"

**Problem**: Błąd "command not found"
- Sprawdź czy jesteś w głównym katalogu projektu
- Ścieżka w `tasks.json` jest relatywna do workspace root 