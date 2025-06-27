#!/bin/bash

# Skrypt do uruchamiania testów Busted w kontenerze Docker

echo "🧪 Uruchamianie testów Busted dla Hierarchical Pathfinding..."
echo "================================================"

# Opcje dla docker run:
# --rm - usuń kontener po zakończeniu
# -it - tryb interaktywny z terminalem
# -v - mapuj bieżący katalog do /workspace w kontenerze
# -w - ustaw katalog roboczy

if [ "$1" = "watch" ]; then
    echo "📺 Tryb obserwowania zmian..."
    docker run --rm -it \
        -v "$(pwd):/workspace" \
        -w /workspace/def_hierarchical_pathfinding \
        imega/busted:latest \
        sh -c "while true; do clear; echo '🔄 Uruchamianie testów...'; busted spec/; echo; echo 'Czekam na zmiany... (Ctrl+C aby zakończyć)'; sleep 2; done"
elif [ "$1" = "coverage" ]; then
    echo "📊 Generowanie pokrycia kodu..."
    docker run --rm -it \
        -v "$(pwd):/workspace" \
        -w /workspace/def_hierarchical_pathfinding \
        imega/busted:latest \
        busted spec/ --coverage
elif [ "$1" = "verbose" ]; then
    echo "🔍 Tryb szczegółowy..."
    docker run --rm -it \
        -v "$(pwd):/workspace" \
        -w /workspace/def_hierarchical_pathfinding \
        imega/busted:latest \
        busted spec/ -v
else
    # Domyślne uruchomienie testów
    docker run --rm -it \
        -v "$(pwd):/workspace" \
        -w /workspace/def_hierarchical_pathfinding \
        imega/busted:latest \
        busted spec/
fi

echo "================================================"
echo "✅ Zakończono" 