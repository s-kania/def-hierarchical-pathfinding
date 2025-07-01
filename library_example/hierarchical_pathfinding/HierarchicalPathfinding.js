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
        
        console.log(`✓ HierarchicalPathfinding: chunk ${config.chunkWidth}x${config.chunkHeight}, grid ${config.gridWidth}x${config.gridHeight}`);
        
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

        // Jeśli ten sam chunk - zwykły A* lokalny
        if (startChunk === endChunk) {
            return this.findLocalPath(startChunk, startPos, endPos);
        }

        // Różne chunki - szukamy przez punkty przejścia
        const startPoint = this.findNearestTransition(startPos, startChunk);
        const endPoint = this.findNearestTransition(endPos, endChunk);

        if (!startPoint || !endPoint) {
            return null; // Brak dostępnych punktów przejścia
        }

        // Znajdujemy ścieżkę między punktami przejścia (A* na grafie)
        const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);

        if (!transitionPath) {
            return null; // Brak ścieżki między chunkami
        }

        // Budujemy finalne segmenty ścieżki
        return this.buildPathSegments(startPos, endPos, transitionPath);
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

            if (!pointPos) continue;

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
     * Buduje kompletne segmenty ścieżki przechodząc przez punkty przejścia
     * @param {Object} startPos - Pozycja startowa
     * @param {Object} endPos - Pozycja końcowa  
     * @param {Array} transitionPath - Lista ID punktów przejścia
     * @returns {Array} - Tablica segmentów ścieżki
     */
    buildPathSegments(startPos, endPos, transitionPath) {
        const segments = [];
        let currentPos = startPos;

        // Przechodzimy przez każdy punkt przejścia
        for (let i = 0; i < transitionPath.length; i++) {
            const pointId = transitionPath[i];
            const point = this.transitionGraph.getPoint(pointId);

            if (!point) return null;

            // Określamy obecny chunk
            const currentChunk = CoordUtils.globalToChunkId(currentPos, this.config.chunkWidth, this.config.tileSize);
            
            // Określamy pozycję docelową dla tego kroku
            let targetPos;
            
            if (i === transitionPath.length - 1) {
                // Ostatni punkt - idziemy do finalnej pozycji
                targetPos = endPos;
            } else {
                // Punkt pośredni - idziemy do punktu przejścia
                targetPos = CoordUtils.getTransitionGlobalPosition(
                    point, currentChunk, this.config.chunkWidth, this.config.tileSize
                );

                if (!targetPos) return null;
            }

            // Znajdujemy lokalną ścieżkę do celu
            const segmentPath = this.findLocalPath(currentChunk, currentPos, targetPos);
            
            if (!segmentPath) return null;

            segments.push(...segmentPath);

            // Przesuwamy się do następnego chunka (jeśli nie ostatni punkt)
            if (i < transitionPath.length - 1) {
                const nextPointId = transitionPath[i + 1];
                const nextPoint = this.transitionGraph.getPoint(nextPointId);
                
                if (nextPoint) {
                    // Znajdujemy chunk po drugiej stronie przejścia
                    const nextChunk = nextPoint.chunks.find(id => id !== currentChunk);
                    if (nextChunk) {
                        currentPos = CoordUtils.getTransitionGlobalPosition(
                            point, nextChunk, this.config.chunkWidth, this.config.tileSize
                        );
                    }
                }
            }
        }

        return segments;
    }
} 