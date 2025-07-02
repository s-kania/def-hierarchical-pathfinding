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

        console.log('🔍 === HIERARCHICAL PATHFINDING DEBUG ===');
        console.log('📍 Start:', startPos);
        console.log('📍 End:', endPos);

        // Sprawdzamy czy pozycje mieszczą się w świecie
        const worldWidth = this.config.gridWidth * this.config.chunkWidth * this.config.tileSize;
        const worldHeight = this.config.gridHeight * this.config.chunkHeight * this.config.tileSize;
        
        if (startPos.x < 0 || startPos.x >= worldWidth || 
            startPos.y < 0 || startPos.y >= worldHeight ||
            endPos.x < 0 || endPos.x >= worldWidth ||
            endPos.y < 0 || endPos.y >= worldHeight) {
            console.log('❌ Pozycje poza granicami świata');
            return null;
        }

        // Określamy w jakich chunkach są start i koniec
        const startChunk = CoordUtils.globalToChunkId(startPos, this.config.chunkWidth, this.config.tileSize);
        const endChunk = CoordUtils.globalToChunkId(endPos, this.config.chunkWidth, this.config.tileSize);

        console.log('🗂️ Start chunk:', startChunk);
        console.log('🗂️ End chunk:', endChunk);

        // Jeśli ten sam chunk - zwykły A* lokalny
        if (startChunk === endChunk) {
            console.log('✅ Ten sam chunk - lokalny pathfinding');
            return this.findLocalPath(startChunk, startPos, endPos);
        }

        console.log('🔀 Różne chunki - szukanie przez punkty przejścia');

        // Różne chunki - szukamy przez punkty przejścia
        const startPoint = this.findNearestTransition(startPos, startChunk);
        const endPoint = this.findNearestTransition(endPos, endChunk);

        console.log('🎯 Najbliższy punkt startowy:', startPoint);
        console.log('🎯 Najbliższy punkt końcowy:', endPoint);

        if (!startPoint || !endPoint) {
            console.log('❌ Brak dostępnych punktów przejścia');
            return null; // Brak dostępnych punktów przejścia
        }

        // Znajdujemy ścieżkę między punktami przejścia (A* na grafie)
        console.log('🗺️ Szukanie ścieżki między punktami przejścia...');
        console.log('   Od:', startPoint.id, '→ Do:', endPoint.id);
        
        const transitionPath = this.transitionGraph.findPath(startPoint.id, endPoint.id);

        console.log('🛤️ Znaleziona ścieżka punktów przejścia:', transitionPath);

        if (!transitionPath) {
            console.log('❌ Brak ścieżki między chunkami');
            return null; // Brak ścieżki między chunkami
        }

        // Budujemy finalne segmenty ścieżki
        console.log('🔨 Budowanie segmentów ścieżki...');
        const segments = this.buildPathSegments(startPos, endPos, transitionPath);
        
        console.log('📊 Finalne segmenty:', segments);
        console.log('🔍 === KONIEC DEBUG ===');
        
        return segments;
    }

    /**
     * Znajduje najbliższy punkt przejścia w danym chunku
     * @param {Object} pos - Pozycja dla której szukamy punktu
     * @param {string} chunkId - ID chunka
     * @returns {Object|null} - Najbliższy dostępny punkt przejścia
     */
    findNearestTransition(pos, chunkId) {
        console.log(`🔍 Szukanie punktów przejścia dla pozycji ${pos.x},${pos.y} w chunku ${chunkId}`);
        
        // Pobieramy wszystkie punkty przejścia w tym chunku
        const points = this.transitionGraph.getPointsInChunk(chunkId);
        
        console.log(`📋 Dostępne punkty przejścia w chunku ${chunkId}:`, points.length);
        points.forEach((point, index) => {
            console.log(`   ${index + 1}. ID: ${point.id}, chunks: [${point.chunks.join(', ')}], position: ${point.position}`);
        });
        
        if (points.length === 0) {
            console.log(`❌ Brak punktów przejścia w chunku ${chunkId}`);
            return null;
        }

        let nearest = null;
        let minDistance = Infinity;
        let evaluationResults = [];

        // Szukamy najbliższego punktu do którego można dojść
        for (const point of points) {
            // Obliczamy globalną pozycję punktu przejścia
            const pointPos = CoordUtils.getTransitionGlobalPosition(
                point, chunkId, this.config.chunkWidth, this.config.tileSize
            );

            if (!pointPos) {
                evaluationResults.push({
                    pointId: point.id,
                    status: 'BŁĄD - nie można obliczyć pozycji globalnej',
                    distance: null,
                    accessible: false
                });
                continue;
            }

            console.log(`   🎯 Sprawdzanie punktu ${point.id} na pozycji ${pointPos.x},${pointPos.y}`);

            // Sprawdzamy czy można dojść do tego punktu lokalną ścieżką
            const localPath = this.findLocalPath(chunkId, pos, pointPos);

            if (localPath) {
                // Obliczamy odległość euklidesową
                const dx = pointPos.x - pos.x;
                const dy = pointPos.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                evaluationResults.push({
                    pointId: point.id,
                    status: 'DOSTĘPNY',
                    distance: distance.toFixed(2),
                    accessible: true,
                    globalPos: pointPos
                });
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = point;
                }
            } else {
                evaluationResults.push({
                    pointId: point.id,
                    status: 'NIEDOSTĘPNY - brak lokalnej ścieżki',
                    distance: null,
                    accessible: false,
                    globalPos: pointPos
                });
            }
        }

        console.log('📊 Wyniki oceny punktów przejścia:');
        evaluationResults.forEach(result => {
            const status = result.accessible ? '✅' : '❌';
            console.log(`   ${status} ${result.pointId}: ${result.status}${result.distance ? ` (dystans: ${result.distance})` : ''}`);
        });

        if (nearest) {
            console.log(`🎯 Wybrany najbliższy punkt: ${nearest.id} (dystans: ${minDistance.toFixed(2)})`);
        } else {
            console.log(`❌ Nie znaleziono dostępnego punktu przejścia w chunku ${chunkId}`);
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
            
            // Sprawdź czy drugi punkt jest dostępny z chunk'a startowego
            if (secondPoint.chunks.includes(startChunk)) {
                console.log('✂️ Optymalizacja: usuwam pierwszy węzeł (redundantny)');
                effectivePath.shift(); // Usuń pierwszy
            }
        }
        
        // 🔥 WERYFIKACJA OSTATNIEGO WĘZŁA  
        if (effectivePath.length >= 2) {
            const lastPoint = this.transitionGraph.getPoint(effectivePath[effectivePath.length - 1]);
            const secondLastPoint = this.transitionGraph.getPoint(effectivePath[effectivePath.length - 2]);
            
            // Sprawdź czy przedostatni prowadzi do końcowego chunk'a
            if (secondLastPoint.chunks.includes(endChunk)) {
                console.log('✂️ Optymalizacja: usuwam ostatni węzeł (redundantny)');
                effectivePath.pop(); // Usuń ostatni
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
            
            // Znajdujemy wspólny chunk między punktami
            const commonChunk = currentPoint.chunks.find(chunk => nextPoint.chunks.includes(chunk));
            
            if (!commonChunk) {
                console.log('❌ Brak wspólnego chunk\'a między punktami:', currentPoint.id, 'i', nextPoint.id);
                continue;
            }
            
            const nextPointPos = CoordUtils.getTransitionGlobalPosition(
                nextPoint, commonChunk, this.config.chunkWidth, this.config.tileSize
            );
            
            if (!nextPointPos) {
                console.log('❌ Nie można obliczyć pozycji dla punktu:', nextPoint.id);
                continue;
            }
            
            segments.push({
                chunk: commonChunk,
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
        
        return segments;
    }
} 