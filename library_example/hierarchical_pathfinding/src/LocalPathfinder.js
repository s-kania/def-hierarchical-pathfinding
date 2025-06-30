/**
 * Lokalny pathfinding w obrębie pojedynczego chunka używając A*
 * Znajduje ścieżki na kafelkach wody (0) omijając ląd (1)
 */

export class LocalPathfinder {
    /**
     * Sprawdź czy pozycja jest dostępna (woda)
     * @param {Array} chunkData - 2D tablica kafelków
     * @param {Object} pos - Pozycja {x, y}
     * @returns {boolean}
     */
    static isWalkable(chunkData, pos) {
        // Sprawdzamy granice
        if (pos.x < 0 || pos.y < 0 || 
            pos.y >= chunkData.length || 
            pos.x >= chunkData[0].length) {
            return false;
        }
        
        // 0 = woda (dostępne), 1 = ląd (niedostępne)
        return chunkData[pos.y][pos.x] === 0;
    }

    /**
     * Znajdź ścieżkę używając A*
     * @param {Array} chunkData - 2D tablica kafelków (0=woda, 1=ląd)
     * @param {Object} startPos - Start {x, y}
     * @param {Object} endPos - Koniec {x, y}
     * @returns {Array|null} - Tablica pozycji lub null
     */
    static findPath(chunkData, startPos, endPos) {
        // Sprawdzamy czy start i koniec są dostępne
        if (!this.isWalkable(chunkData, startPos) || 
            !this.isWalkable(chunkData, endPos)) {
            return null;
        }

        // Ta sama pozycja
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            return [startPos];
        }

        // Struktury dla A*
        const openList = [];
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        // Helper do kluczy
        const key = (pos) => `${pos.x},${pos.y}`;

        // Inicjalizacja startu
        const startKey = key(startPos);
        gScore[startKey] = 0;
        fScore[startKey] = this.heuristic(startPos, endPos);
        openList.push({ pos: startPos, f: fScore[startKey] });

        // Główna pętla A*
        while (openList.length > 0) {
            // Znajdź węzeł z najniższym f-score
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();
            const currentKey = key(current.pos);

            // Znaleźliśmy cel!
            if (current.pos.x === endPos.x && current.pos.y === endPos.y) {
                return this.reconstructPath(cameFrom, endPos);
            }

            closedSet.add(currentKey);

            // Sprawdzamy sąsiadów (4 kierunki)
            const neighbors = [
                { x: current.pos.x, y: current.pos.y - 1 }, // Góra
                { x: current.pos.x, y: current.pos.y + 1 }, // Dół
                { x: current.pos.x - 1, y: current.pos.y }, // Lewo
                { x: current.pos.x + 1, y: current.pos.y }   // Prawo
            ];

            for (const neighbor of neighbors) {
                // Pomijamy niedostępne
                if (!this.isWalkable(chunkData, neighbor)) continue;

                const neighborKey = key(neighbor);
                
                // Pomijamy już odwiedzone
                if (closedSet.has(neighborKey)) continue;

                // Obliczamy koszt
                const tentativeG = gScore[currentKey] + 1;

                // Sprawdzamy czy to lepsza ścieżka
                if (!(neighborKey in gScore) || tentativeG < gScore[neighborKey]) {
                    // Zapisujemy ścieżkę
                    cameFrom[neighborKey] = current.pos;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this.heuristic(neighbor, endPos);

                    // Dodajemy do open list jeśli nie ma
                    if (!openList.some(n => n.pos.x === neighbor.x && n.pos.y === neighbor.y)) {
                        openList.push({ pos: neighbor, f: fScore[neighborKey] });
                    }
                }
            }
        }

        // Nie znaleziono ścieżki
        return null;
    }

    /**
     * Heurystyka - odległość Manhattan
     * @param {Object} a - Pozycja {x, y}
     * @param {Object} b - Pozycja {x, y}
     * @returns {number} - Odległość
     */
    static heuristic(a, b) {
        return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    }

    /**
     * Odtwórz ścieżkę z mapy poprzedników
     * @param {Object} cameFrom - Mapa poprzedników
     * @param {Object} endPos - Pozycja końcowa
     * @returns {Array} - Ścieżka pozycji
     */
    static reconstructPath(cameFrom, endPos) {
        const path = [];
        let current = endPos;
        
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            const key = `${current.x},${current.y}`;
            current = cameFrom[key];
        }
        
        return path;
    }
} 