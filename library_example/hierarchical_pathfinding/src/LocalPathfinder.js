/**
 * Lokalny pathfinding w obrębie pojedynczego chunka używając algorytmu A*
 * Znajduje ścieżki na kafelkach wody (wartość 0) unikając kafelków lądu (wartość 1)
 */

import { PriorityQueue } from './utils/DataStructures.js';

export class LocalPathfinder {
    /**
     * Sprawdź czy pozycja jest dostępna (kafelek wody)
     * @param {Array} chunkData - Dwuwymiarowa tablica kafelków
     * @param {Object} pos - Pozycja {x, y}
     * @returns {boolean}
     */
    static isWalkable(chunkData, pos) {
        if (pos.x < 0 || pos.y < 0) {
            return false;
        }

        const row = chunkData[pos.y];
        if (!row) {
            return false;
        }

        const tile = row[pos.x];
        return tile === 0; // 0 = woda (dostępne)
    }

    /**
     * Pobierz prawidłowych sąsiadów dla ruchu 4-kierunkowego
     * @param {Array} chunkData - Dwuwymiarowa tablica kafelków
     * @param {Object} pos - Aktualna pozycja {x, y}
     * @returns {Array} - Tablica pozycji sąsiadów
     */
    static getNeighbors(chunkData, pos) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Góra
            { x: 0, y: 1 },  // Dół
            { x: -1, y: 0 }, // Lewo
            { x: 1, y: 0 }   // Prawo
        ];

        for (const dir of directions) {
            const neighbor = { x: pos.x + dir.x, y: pos.y + dir.y };
            if (this.isWalkable(chunkData, neighbor)) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Oblicz heurystyczną odległość (Manhattan domyślnie)
     * @param {Object} a - Pozycja {x, y}
     * @param {Object} b - Pozycja {x, y}
     * @param {string} heuristic - "manhattan" lub "euclidean"
     * @returns {number} - Odległość
     */
    static calculateHeuristic(a, b, heuristic = 'manhattan') {
        if (heuristic === 'euclidean') {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            return Math.sqrt(dx * dx + dy * dy);
        } else { // manhattan (domyślny)
            return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        }
    }

    /**
     * Znajdź ścieżkę używając algorytmu A*
     * @param {Array} chunkData - Dwuwymiarowa tablica kafelków (0 = woda, 1 = ląd)
     * @param {Object} startPos - Pozycja startowa {x, y} we współrzędnych lokalnych
     * @param {Object} endPos - Pozycja końcowa {x, y} we współrzędnych lokalnych
     * @param {Object} config - Opcjonalna konfiguracja {heuristic = "manhattan"|"euclidean", optimizePath = boolean}
     * @returns {Array|null} - Tablica pozycji tworzących ścieżkę, lub null jeśli brak ścieżki
     */
    static findPath(chunkData, startPos, endPos, config = {}) {
        const heuristic = config.heuristic || 'manhattan';

        // Waliduj pozycje
        if (startPos.x < 0 || startPos.y < 0 || endPos.x < 0 || endPos.y < 0) {
            throw new Error("Nieprawidłowa pozycja: ujemne współrzędne");
        }

        const chunkSize = chunkData.length;
        if (chunkSize === 0 || chunkData[0].length === 0) {
            throw new Error("Nieprawidłowe dane chunka: puste");
        }

        if (startPos.x >= chunkSize || startPos.y >= chunkSize ||
            endPos.x >= chunkSize || endPos.y >= chunkSize) {
            throw new Error("Pozycja poza granicami chunka");
        }

        // Sprawdź czy start i koniec są dostępne
        if (!this.isWalkable(chunkData, startPos) || !this.isWalkable(chunkData, endPos)) {
            return null;
        }

        // Obsłuż tę samą pozycję
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            return [startPos];
        }

        // Implementacja A*
        const openSet = new PriorityQueue();
        const cameFrom = {};
        const gScore = {};
        const closedSet = new Set();

        // Helper do tworzenia klucza pozycji
        const posKey = (pos) => `${pos.x},${pos.y}`;

        // Inicjalizuj węzeł startowy
        const startKey = posKey(startPos);
        gScore[startKey] = 0;

        openSet.push({
            pos: startPos,
            gScore: 0,
            fScore: this.calculateHeuristic(startPos, endPos, heuristic),
            priority: this.calculateHeuristic(startPos, endPos, heuristic)
        });

        // Główna pętla A*
        while (!openSet.empty()) {
            const current = openSet.pop();
            const currentKey = posKey(current.pos);

            // Sprawdź czy osiągnęliśmy cel
            if (current.pos.x === endPos.x && current.pos.y === endPos.y) {
                // Zrekonstruuj ścieżkę
                const path = [];
                let pos = endPos;

                while (pos) {
                    path.unshift({ x: pos.x, y: pos.y });
                    const key = posKey(pos);
                    pos = cameFrom[key];
                }

                // Optymalizuj ścieżkę jeśli żądano
                if (config.optimizePath) {
                    return this.optimizePath(path, chunkData);
                }

                return path;
            }

            closedSet.add(currentKey);

            // Sprawdź sąsiadów
            const neighbors = this.getNeighbors(chunkData, current.pos);

            for (const neighbor of neighbors) {
                const neighborKey = posKey(neighbor);

                if (!closedSet.has(neighborKey)) {
                    const tentativeG = current.gScore + 1; // Koszt to 1 dla sąsiadujących kafelków

                    if (!(neighborKey in gScore) || tentativeG < gScore[neighborKey]) {
                        // Aktualizuj punkty
                        cameFrom[neighborKey] = current.pos;
                        gScore[neighborKey] = tentativeG;
                        const fScore = tentativeG + this.calculateHeuristic(neighbor, endPos, heuristic);

                        // Dodaj do zbioru otwartego
                        openSet.push({
                            pos: neighbor,
                            gScore: tentativeG,
                            fScore: fScore,
                            priority: fScore
                        });
                    }
                }
            }
        }

        // Nie znaleziono ścieżki
        return null;
    }

    /**
     * Optymalizuj ścieżkę przez usunięcie niepotrzebnych punktów drogi
     * @param {Array} path - Tablica pozycji
     * @param {Array} chunkData - Dane chunka do sprawdzania linii wzroku
     * @returns {Array} - Zoptymalizowana ścieżka
     */
    static optimizePath(path, chunkData) {
        if (path.length <= 2) {
            return path;
        }

        const optimized = [path[0]];
        let currentIndex = 0;

        while (currentIndex < path.length - 1) {
            let furthestVisible = currentIndex + 1;

            // Znajdź najdalszy punkt który widzimy w linii prostej
            for (let i = currentIndex + 2; i < path.length; i++) {
                if (this.hasLineOfSight(path[currentIndex], path[i], chunkData)) {
                    furthestVisible = i;
                } else {
                    break;
                }
            }

            optimized.push(path[furthestVisible]);
            currentIndex = furthestVisible;
        }

        return optimized;
    }

    /**
     * Sprawdź czy istnieje linia wzroku między dwoma punktami
     * @param {Object} from - Pozycja startowa
     * @param {Object} to - Pozycja końcowa
     * @param {Array} chunkData - Dane chunka
     * @returns {boolean} - True jeśli linia wzroku jest czysta
     */
    static hasLineOfSight(from, to, chunkData) {
        const dx = Math.abs(to.x - from.x);
        const dy = Math.abs(to.y - from.y);
        const sx = from.x < to.x ? 1 : -1;
        const sy = from.y < to.y ? 1 : -1;
        let err = dx - dy;

        let x = from.x;
        let y = from.y;

        while (true) {
            // Sprawdź czy aktualny punkt jest dostępny
            if (!this.isWalkable(chunkData, { x, y })) {
                return false;
            }

            // Osiągnęliśmy cel
            if (x === to.x && y === to.y) {
                break;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return true;
    }
} 