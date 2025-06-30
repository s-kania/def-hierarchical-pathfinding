/**
 * Biblioteka Hierarchical Pathfinding dla JavaScript
 * Radykalnie uproszczona wersja wykorzystująca pre-computed graf connections
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
     * @param {Object} config - Konfiguracja z wymaganymi polami:
     *   chunkSize: Rozmiar chunka w kafelkach
     *   tileSize: Rozmiar kafelka w jednostkach świata
     *   gridWidth: Szerokość całego grida w chunkach
     *   gridHeight: Wysokość całego grida w chunkach
     *   getChunkData: Funkcja(chunkId) -> 2D array danych chunka
     *   transitionPoints: Tablica punktów przejścia z connections
     */
    init(config) {
        this.validateConfig(config);
        this.config = config;
        
        // Zbuduj graf przejść z konfiguracją grida
        const gridConfig = {
            gridWidth: config.gridWidth,
            gridHeight: config.gridHeight,
            chunkSize: config.chunkSize,
            tileSize: config.tileSize
        };
        this.transitionGraph = new TransitionGraph(config.transitionPoints, gridConfig);
        
        console.log('🗺️ HierarchicalPathfinding zainicjalizowany');
        console.log('📊 Statystyki grafu:', this.transitionGraph.getStats());
    }

    /**
     * Znajdź ścieżkę od pozycji startowej do końcowej
     * @param {Object} startPos - Globalna pozycja startowa {x, y}
     * @param {Object} endPos - Globalna pozycja końcowa {x, y}
     * @returns {Array|null} - Tablica segmentów {chunk, position} lub null jeśli brak ścieżki
     */
    findPath(startPos, endPos) {
        if (!this.config) {
            throw new Error("Pathfinder nie został zainicjalizowany. Wywołaj init() najpierw.");
        }

        // Sprawdź czy pozycje mieszczą się w granicach świata
        if (!this.isPositionInBounds(startPos)) {
            console.warn('❌ Pozycja startowa poza granicami świata:', startPos);
            return null;
        }
        if (!this.isPositionInBounds(endPos)) {
            console.warn('❌ Pozycja końcowa poza granicami świata:', endPos);
            return null;
        }

        // 1. Konwertuj pozycje na chunki
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkSize, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkSize, this.config.tileSize);

        // 2. Specjalny przypadek - ten sam chunk
        if (startChunk === endChunk) {
            return this.findLocalPath(startChunk, startPos, endPos);
        }

        // 3. Znajdź najbliższe punkty przejścia
        const startPoint = this.findNearestTransition(startPos, startChunk);
        const endPoint = this.findNearestTransition(endPos, endChunk);

        if (!startPoint || !endPoint) {
            console.warn('❌ Brak dostępnych punktów przejścia');
            return null;
        }

        // 4. Znajdź ścieżkę między punktami przejścia
        const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);

        if (!transitionPath) {
            console.warn('❌ Brak ścieżki między punktami przejścia');
            return null;
        }

        // 5. Zbuduj segmenty
        return this.buildPathSegments(startPos, endPos, transitionPath);
    }

    /**
     * Znajdź najbliższy dostępny punkt przejścia w chunku
     * @param {Object} pos - Pozycja globalna
     * @param {string} chunkId - ID chunka
     * @returns {Object|null} - Najbliższy punkt przejścia
     */
    findNearestTransition(pos, chunkId) {
        const points = this.transitionGraph.getPointsInChunk(chunkId);
        
        if (points.length === 0) {
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;

        for (const point of points) {
            // Oblicz pozycję punktu przejścia
            const pointPos = CoordUtils.getTransitionGlobalPosition(
                point, chunkId, this.config.chunkSize, this.config.tileSize
            );

            if (!pointPos) {
                continue;
            }

            // Sprawdź czy można dojść do punktu lokalną ścieżką
            const localPath = this.findLocalPath(chunkId, pos, pointPos);

            if (localPath) {
                const distance = this.calculateDistance(pos, pointPos);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = point;
                }
            }
        }

        return nearest;
    }

    /**
     * Znajdź lokalną ścieżkę w obrębie chunka
     * @param {string} chunkId - ID chunka
     * @param {Object} startPos - Pozycja startowa
     * @param {Object} endPos - Pozycja końcowa
     * @returns {Array|null} - Segment ścieżki lub null
     */
    findLocalPath(chunkId, startPos, endPos) {
        const chunkData = this.config.getChunkData(chunkId);
        if (!chunkData) {
            return null;
        }

        // Konwertuj na lokalne współrzędne
        const localStart = CoordUtils.globalToLocal(startPos, chunkId, this.config.chunkSize, this.config.tileSize);
        const localEnd = CoordUtils.globalToLocal(endPos, chunkId, this.config.chunkSize, this.config.tileSize);

        // Znajdź lokalną ścieżkę A*
        const localPath = LocalPathfinder.findPath(chunkData, localStart, localEnd);

        if (localPath) {
            // Zwróć jako pojedynczy segment
            return [{
                chunk: chunkId,
                position: endPos
            }];
        }

        return null;
    }

    /**
     * Zbuduj segmenty ścieżki z listy punktów przejścia
     * @param {Object} startPos - Pozycja startowa
     * @param {Object} endPos - Pozycja końcowa  
     * @param {Array} transitionPath - Lista ID punktów przejścia
     * @returns {Array} - Tablica segmentów ścieżki
     */
    buildPathSegments(startPos, endPos, transitionPath) {
        const segments = [];
        let currentPos = startPos;

        for (let i = 0; i < transitionPath.length; i++) {
            const pointId = transitionPath[i];
            const point = this.transitionGraph.getPoint(pointId);

            if (!point) {
                console.error(`❌ Nie znaleziono punktu przejścia: ${pointId}`);
                return null;
            }

            // Określ chunk w którym się obecnie znajdujemy
            const currentChunk = CoordUtils.globalToChunkId(currentPos, this.config.chunkSize, this.config.tileSize);
            
            // Znajdź chunk dla tego punktu przejścia
            const targetChunk = point.chunks.find(chunkId => {
                return this.transitionGraph.getPointsInChunk(chunkId).some(p => p.id === pointId);
            });

            if (!targetChunk) {
                console.error(`❌ Nie można określić chunka dla punktu: ${pointId}`);
                return null;
            }

            // Oblicz pozycję docelową
            let targetPos;
            
            if (i === transitionPath.length - 1) {
                // Ostatni punkt - cel to finalna pozycja
                targetPos = endPos;
            } else {
                // Punkt pośredni - pozycja przejścia
                targetPos = CoordUtils.getTransitionGlobalPosition(
                    point, currentChunk, this.config.chunkSize, this.config.tileSize
                );

                if (!targetPos) {
                    console.error(`❌ Nie można obliczyć pozycji przejścia: ${pointId}`);
                    return null;
                }
            }

            // Sprawdź czy można dotrzeć do pozycji docelowej
            const segmentPath = this.findLocalPath(currentChunk, currentPos, targetPos);
            
            if (!segmentPath) {
                console.error(`❌ Nie można dotrzeć do punktu w chunku ${currentChunk}`);
                return null;
            }

            segments.push(...segmentPath);

            // Przejdź do następnego chunka jeśli nie ostatni punkt
            if (i < transitionPath.length - 1) {
                const nextPointId = transitionPath[i + 1];
                const nextPoint = this.transitionGraph.getPoint(nextPointId);
                
                if (nextPoint) {
                    // Znajdź chunk docelowy dla następnego punktu
                    const nextChunk = nextPoint.chunks.find(id => id !== currentChunk);
                    if (nextChunk) {
                        currentPos = CoordUtils.getTransitionGlobalPosition(
                            point, nextChunk, this.config.chunkSize, this.config.tileSize
                        );
                    }
                }
            }
        }

        return segments;
    }

    /**
     * Oblicz odległość euklidesową między dwoma punktami
     * @param {Object} pos1 - Pierwsza pozycja
     * @param {Object} pos2 - Druga pozycja
     * @returns {number} - Odległość
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Waliduj konfigurację
     * @param {Object} config - Konfiguracja do walidacji
     */
    validateConfig(config) {
        if (!config) {
            throw new Error("Konfiguracja jest wymagana");
        }
        if (typeof config.chunkSize !== 'number' || config.chunkSize <= 0) {
            throw new Error("Nieprawidłowy chunkSize");
        }
        if (typeof config.tileSize !== 'number' || config.tileSize <= 0) {
            throw new Error("Nieprawidłowy tileSize");
        }
        if (typeof config.gridWidth !== 'number' || config.gridWidth <= 0) {
            throw new Error("Nieprawidłowy gridWidth");
        }
        if (typeof config.gridHeight !== 'number' || config.gridHeight <= 0) {
            throw new Error("Nieprawidłowy gridHeight");
        }
        if (typeof config.getChunkData !== 'function') {
            throw new Error("getChunkData musi być funkcją");
        }
        if (!Array.isArray(config.transitionPoints)) {
            throw new Error("transitionPoints musi być tablicą");
        }
    }

    /**
     * Sprawdź czy pozycja jest dostępna
     * @param {Object} globalPos - Pozycja globalna
     * @returns {boolean}
     */
    isPositionWalkable(globalPos) {
        if (!this.config) {
            return false;
        }

        // Sprawdź czy pozycja mieści się w granicach świata
        if (!this.isPositionInBounds(globalPos)) {
            return false;
        }

        const chunkId = CoordUtils.globalToChunkId(globalPos, this.config.chunkSize, this.config.tileSize);
        const chunkData = this.config.getChunkData(chunkId);

        if (!chunkData) {
            return false;
        }

        const localPos = CoordUtils.globalToLocal(globalPos, chunkId, this.config.chunkSize, this.config.tileSize);
        return LocalPathfinder.isWalkable(chunkData, localPos);
    }

    /**
     * Sprawdź czy dwie pozycje mogą się ze sobą połączyć
     * @param {Object} startPos - Pozycja startowa
     * @param {Object} endPos - Pozycja końcowa
     * @returns {boolean}
     */
    canReach(startPos, endPos) {
        const segments = this.findPath(startPos, endPos);
        return segments !== null;
    }

    /**
     * Pobierz statystyki grafu przejść
     * @returns {Object} - Statystyki
     */
    getGraphStats() {
        if (!this.transitionGraph) {
            return null;
        }

        const baseStats = this.transitionGraph.getStats();
        const gridSize = this.transitionGraph.getGridSize();
        
        return {
            ...baseStats,
            gridSize,
            gridInfo: gridSize ? {
                totalChunks: gridSize.width * gridSize.height,
                pointDensity: baseStats.pointCount / (gridSize.width * gridSize.height)
            } : null
        };
    }

    /**
     * Sprawdź czy pozycja globalna mieści się w granicach świata
     * @param {Object} globalPos - Pozycja globalna {x, y}
     * @returns {boolean}
     */
    isPositionInBounds(globalPos) {
        if (!this.config) {
            return false;
        }

        const worldWidth = this.config.gridWidth * this.config.chunkSize * this.config.tileSize;
        const worldHeight = this.config.gridHeight * this.config.chunkSize * this.config.tileSize;

        return globalPos.x >= 0 && globalPos.x < worldWidth &&
               globalPos.y >= 0 && globalPos.y < worldHeight;
    }

    /**
     * Pobierz rozmiar całego świata w jednostkach globalnych
     * @returns {Object} - {width, height} w jednostkach świata
     */
    getWorldSize() {
        if (!this.config) {
            return null;
        }

        return {
            width: this.config.gridWidth * this.config.chunkSize * this.config.tileSize,
            height: this.config.gridHeight * this.config.chunkSize * this.config.tileSize
        };
    }

    /**
     * Pobierz informacje o gridzie chunków
     * @returns {Object} - Informacje o gridzie
     */
    getGridInfo() {
        if (!this.config) {
            return null;
        }

        return {
            gridWidth: this.config.gridWidth,
            gridHeight: this.config.gridHeight,
            totalChunks: this.config.gridWidth * this.config.gridHeight,
            chunkSize: this.config.chunkSize,
            tileSize: this.config.tileSize,
            worldSize: this.getWorldSize()
        };
    }
} 