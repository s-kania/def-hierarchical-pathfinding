/**
 * Biblioteka Hierarchical Pathfinding dla JavaScript
 * Minimalna wersja z pre-computed grafem connections
 */

import { CoordUtils } from './src/utils/CoordUtils.js';
import { TransitionGraph } from './src/TransitionGraph.js';
import { LocalPathfinder } from './src/LocalPathfinder.js';

export class HierarchicalPathfinding {
    constructor() {
        this.transitionGraph = null;
        this.config = null;
    }

    /**
     * Inicjalizuje system pathfinding
     * @param {Object} config - Konfiguracja zawierająca:
     *   - tileSize: rozmiar kafelka (w jednostkach świata)
     *   - gridWidth/gridHeight: wymiary grida (w chunkach)
     *   - chunkWidth/chunkHeight: wymiary chunka (w kafelkach)
     *   - getChunkData: funkcja zwracająca dane chunka
     *   - transitionPoints: tablica punktów przejścia między chunkami
     */
    init(config) {
        // Walidacja podstawowa
        if (!config || !config.tileSize || 
            !config.gridWidth || !config.gridHeight || 
            !config.chunkWidth || !config.chunkHeight ||
            !config.getChunkData || !config.transitionPoints) {
            throw new Error("Brakuje wymaganych parametrów konfiguracji");
        }
        
        // Zapisz konfigurację
        this.config = config;
        
        // Budujemy graf połączeń między punktami przejścia
        this.transitionGraph = new TransitionGraph(config.transitionPoints, {
            gridWidth: config.gridWidth,
            gridHeight: config.gridHeight,
            chunkSize: config.chunkWidth, // Używamy chunkWidth jako chunkSize dla kompatybilności
            tileSize: config.tileSize
        });
    }

    /**
     * Główna funkcja - znajduje ścieżkę od startPos do endPos
     * @param {Object} startPos - Pozycja startowa {x, y} w jednostkach świata
     * @param {Object} endPos - Pozycja końcowa {x, y} w jednostkach świata
     * @returns {Array|null} - Tablica segmentów [{chunk, position}] lub null
     */
    findPath(startPos, endPos) {
        if (!this.config) {
            throw new Error("Pathfinder nie został zainicjalizowany");
        }

        // Sprawdzamy czy pozycje mieszczą się w świecie
        const worldWidth = this.config.gridWidth * this.config.chunkWidth * this.config.tileSize;
        const worldHeight = this.config.gridHeight * this.config.chunkHeight * this.config.tileSize;
        
        if (startPos.x < 0 || startPos.x >= worldWidth || 
            startPos.y < 0 || startPos.y >= worldHeight ||
            endPos.x < 0 || endPos.x >= worldWidth ||
            endPos.y < 0 || endPos.y >= worldHeight) {
            return null;
        }

        // Określamy w jakich chunkach są start i koniec
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);

        // Jeśli ten sam chunk - próbujemy najpierw A* lokalny
        if (startChunk === endChunk) {
            const localPath = this.findLocalPath(startChunk, startPos, endPos);
            // Jeśli ścieżka lokalna została znaleziona, zwracamy ją od razu
            if (localPath) {
                return localPath;
            }
            // Jeśli nie, pozwalamy na kontynuację do wyszukiwania hierarchicznego.
            // Może się zdarzyć, że punkty są w tym samym chunku, ale w oddzielnych,
            // niepołączonych obszarach, więc trzeba wyjść na zewnątrz.
        }

        // Różne chunki (lub ten sam chunk bez ścieżki lokalnej) - szukamy przez punkty przejścia
        const startPoint = this.findNearestTransition(startPos, startChunk);
        const endPoint = this.findNearestTransition(endPos, endChunk);

        if (!startPoint || !endPoint) {
            return null; // Brak dostępnych punktów przejścia
        }
        
        const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);

        if (!transitionPath) {
            return null; // Brak ścieżki między chunkami
        }

        // Budujemy finalne segmenty ścieżki
        const segments = this.buildPathSegments(startPos, endPos, transitionPath);
        
        return segments;
    }

    /**
     * Znajduje najbliższy punkt przejścia w danym chunku
     * @param {Object} pos - Pozycja dla której szukamy punktu
     * @param {string} chunkId - ID chunka
     * @returns {Object|null} - Najbliższy dostępny punkt przejścia
     */
    findNearestTransition(pos, chunkId) {
        // Pobieramy wszystkie punkty przejścia w tym chunku
        const points = this.transitionGraph.getPointsInChunk(chunkId);
        
        if (points.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        // Szukamy najbliższego punktu do którego można dojść
        for (const point of points) {
            // Obliczamy globalną pozycję punktu przejścia
            const pointPos = CoordUtils.getTransitionGlobalPosition(
                point, chunkId, this.config.chunkWidth, this.config.tileSize
            );

            if (!pointPos) {
                continue;
            }

            // Sprawdzamy czy można dojść do tego punktu lokalną ścieżką
            const localPath = this.findLocalPath(chunkId, pos, pointPos);

            if (localPath) {
                // Obliczamy odległość euklidesową
                const dx = pointPos.x - pos.x;
                const dy = pointPos.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = point;
                }
            }
        }

        return nearest;
    }

    /**
     * Znajduje lokalną ścieżkę w obrębie jednego chunka
     * @param {string} chunkId - ID chunka
     * @param {Object} startPos - Pozycja startowa (globalna)
     * @param {Object} endPos - Pozycja końcowa (globalna)
     * @returns {Array|null} - Segment ścieżki lub null
     */
    findLocalPath(chunkId, startPos, endPos) {
        // Pobieramy dane chunka (2D tablica)
        const chunkData = this.config.getChunkData(chunkId);
        if (!chunkData) {
            return null;
        }

        // Konwertujemy pozycje globalne na lokalne w chunku
        const localStart = CoordUtils.globalToLocal(startPos, chunkId, this.config.chunkWidth, this.config.tileSize);
        const localEnd = CoordUtils.globalToLocal(endPos, chunkId, this.config.chunkWidth, this.config.tileSize);

        // Szukamy ścieżki lokalnym A*
        const localPath = LocalPathfinder.findPath(chunkData, localStart, localEnd);

        if (localPath) {
            // Zwracamy jako pojedynczy segment
            return [{
                chunk: chunkId,
                position: endPos
            }];
        }

        return null;
    }

    /**
     * Znajduje chunk dla połączenia między dwoma punktami przejścia
     * @param {Object} fromPoint - Punkt startowy
     * @param {Object} toPoint - Punkt docelowy  
     * @returns {string|null} - ID chunka lub null jeśli brak połączenia
     */
    findConnectionChunk(fromPoint, toPoint) {
        const connection = fromPoint.connections.find(conn => conn.id === toPoint.id);
        return connection ? connection.chunk : null;
    }

    /**
     * Zwraca czyste punkty przejścia z optymalizacją redundantnych węzłów
     * @param {Object} startPos - Pozycja startowa 
     * @param {Object} endPos - Pozycja końcowa  
     * @param {Array} transitionPath - Lista ID punktów przejścia
     * @returns {Array} - Lista punktów przejścia
     */
    buildPathSegments(startPos, endPos, transitionPath) {
        const segments = [];
        
        // Określamy chunk startowy i końcowy
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);
        
        // Jeśli nie ma punktów przejścia (bezpośrednia ścieżka)
        if (transitionPath.length === 0) {
            segments.push({
                chunk: startChunk,
                position: endPos
            });
            return segments;
        }
        
        // Tworzymy kopię ścieżki do optymalizacji
        let effectivePath = [...transitionPath];
        
        // 🔥 WERYFIKACJA PIERWSZEGO WĘZŁA
        if (effectivePath.length >= 2) {
            const firstPoint = this.transitionGraph.getPoint(effectivePath[0]);
            const secondPoint = this.transitionGraph.getPoint(effectivePath[1]);
            
            // Sprawdź, czy drugi punkt jest dostępny z chunka startowego
            // ORAZ czy istnieje bezpośrednie połączenie z pierwszego do drugiego punktu w tym chunku.
            const connectionChunk = this.findConnectionChunk(firstPoint, secondPoint);
            if (secondPoint.chunks.includes(startChunk) && connectionChunk === startChunk) {
                effectivePath.shift(); // Usuń pierwszy, zbędny węzeł
            }
        }
        
        // Dodaj segment startowy (od startPos do pierwszego punktu przejścia)
        if (effectivePath.length > 0) {
            const firstPoint = this.transitionGraph.getPoint(effectivePath[0]);
            const firstPointPos = CoordUtils.getTransitionGlobalPosition(
                firstPoint, startChunk, this.config.chunkWidth, this.config.tileSize
            );
            
            

            if (firstPointPos) {
                segments.push({
                    chunk: startChunk,
                    position: firstPointPos
                });
            }
        }
        
        // Buduj segmenty między punktami przejścia
        for (let i = 0; i < effectivePath.length - 1; i++) {
            const currentPoint = this.transitionGraph.getPoint(effectivePath[i]);
            const nextPoint = this.transitionGraph.getPoint(effectivePath[i + 1]);
            
            // Używamy funkcji pomocniczej do znalezienia chunka połączenia
            const connectionChunk = this.findConnectionChunk(currentPoint, nextPoint);
            
            if (!connectionChunk) {
                continue;
            }
            
            const nextPointPos = CoordUtils.getTransitionGlobalPosition(
                nextPoint, connectionChunk, this.config.chunkWidth, this.config.tileSize
            );

            if (!nextPointPos) {
                continue;
            }
            
            segments.push({
                chunk: connectionChunk,
                position: nextPointPos
            });
        }
        
        // Dodaj segment końcowy (od ostatniego punktu przejścia do endPos)
        if (effectivePath.length > 0) {
            segments.push({
                chunk: endChunk,
                position: endPos
            });
        }

        // 🔥 WERYFIKACJA PRZEDOSTATNIEGO SEGMENTU
        if (segments.length >= 2) {
            const penultimateSegment = segments[segments.length - 2];
            
            if (penultimateSegment.chunk === endChunk) {
                segments.splice(segments.length - 2, 1); // Usuń przedostatni segment
            }
        }
        
        return segments;
    }
} 