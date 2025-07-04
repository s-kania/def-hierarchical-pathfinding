/**
 * MENEDŻER PUNKTÓW PRZEJŚCIA MIĘDZY CHUNKAMI
 */

import { RENDER_CONSTANTS } from '../config/Settings.js';

export class TransitionPointManager {
    constructor(settings, pathfindingSettings) {
        this.settings = settings;
        this.pathfindingSettings = pathfindingSettings;
        this.transitionPoints = [];
    }

    /**
     * GENERUJE PUNKTY PRZEJŚCIA MIĘDZY CHUNKAMI
     */
    generateTransitionPoints(chunks) {
        this.transitionPoints = [];
        
        const chunkSize = this.settings.chunkSize;
        const maxPoints = this.pathfindingSettings.maxTransitionPoints;
        
        // Sprawdź wszystkie pary sąsiadujących chunków
        for (let chunkY = 0; chunkY < this.settings.chunkRows; chunkY++) {
            for (let chunkX = 0; chunkX < this.settings.chunkCols; chunkX++) {
                const currentChunk = chunks.find(c => c.x === chunkX && c.y === chunkY);
                if (!currentChunk) continue;
                
                // Sprawdź granicę z chunkiem po prawej (horizontal)
                if (chunkX < this.settings.chunkCols - 1) {
                    const rightChunk = chunks.find(c => c.x === chunkX + 1 && c.y === chunkY);
                    if (rightChunk) {
                        const points = this.findTransitionPointsOnBorder(
                            currentChunk, rightChunk, 'horizontal', maxPoints
                        );
                        this.transitionPoints.push(...points);
                    }
                }
                
                // Sprawdź granicę z chunkiem poniżej (vertical)
                if (chunkY < this.settings.chunkRows - 1) {
                    const bottomChunk = chunks.find(c => c.x === chunkX && c.y === chunkY + 1);
                    if (bottomChunk) {
                        const points = this.findTransitionPointsOnBorder(
                            currentChunk, bottomChunk, 'vertical', maxPoints
                        );
                        this.transitionPoints.push(...points);
                    }
                }
            }
        }
        
        return this.transitionPoints;
    }

    /**
     * ZNAJDUJE PUNKTY PRZEJŚCIA NA GRANICY MIĘDZY DWOMA CHUNKAMI
     */
    findTransitionPointsOnBorder(chunkA, chunkB, direction, maxPoints) {
        const chunkSize = this.settings.chunkSize;
        const points = [];
        
        // Przygotuj tablicę do sprawdzania możliwości przejścia
        const canPass = [];
        
        if (direction === 'horizontal') {
            // Granica pionowa - sprawdzaj rzędy (Y)
            for (let y = 0; y < chunkSize; y++) {
                // Prawy brzeg chunkA (x = chunkSize-1)
                const tileA = chunkA.tiles[y * chunkSize + (chunkSize - 1)];
                // Lewy brzeg chunkB (x = 0)
                const tileB = chunkB.tiles[y * chunkSize + 0];
                
                // Można przejść tylko jeśli oba kafelki to oceany (0)
                canPass[y] = (tileA === 0 && tileB === 0);
            }
        } else if (direction === 'vertical') {
            // Granica pozioma - sprawdzaj kolumny (X)
            for (let x = 0; x < chunkSize; x++) {
                // Dolny brzeg chunkA (y = chunkSize-1)
                const tileA = chunkA.tiles[(chunkSize - 1) * chunkSize + x];
                // Górny brzeg chunkB (y = 0)
                const tileB = chunkB.tiles[0 * chunkSize + x];
                
                // Można przejść tylko jeśli oba kafelki to oceany (0)
                canPass[x] = (tileA === 0 && tileB === 0);
            }
        }
        
        // Znajdź ciągłe segmenty przejścia
        const segments = this.findPassableSegments(canPass);
        
        // Ogranicz liczbę segmentów do maxPoints
        const selectedSegments = this.selectBestSegments(segments, maxPoints);
        
        // Utwórz punkty przejścia na środku każdego segmentu
        selectedSegments.forEach(segment => {
            const midPoint = Math.floor((segment.start + segment.end) / 2);
            
            let globalX, globalY;
            
            if (direction === 'horizontal') {
                // Punkt na granicy między chunkami (na końcu chunk A)
                globalX = chunkA.x * chunkSize + chunkSize; // Granica po prawej stronie chunkA
                globalY = chunkA.y * chunkSize + midPoint;
            } else if (direction === 'vertical') {
                // Punkt na granicy między chunkami (na końcu chunk A)
                globalX = chunkA.x * chunkSize + midPoint;
                globalY = chunkA.y * chunkSize + chunkSize; // Granica poniżej chunkA
            }
            
            points.push({
                chunkA: chunkA.id,
                chunkB: chunkB.id,
                x: globalX,
                y: globalY,
                direction: direction,
                segmentLength: segment.end - segment.start + 1
            });
        });
        
        return points;
    }

    /**
     * ZNAJDUJE CIĄGŁE SEGMENTY GDZ MOŻNA PRZEJŚĆ
     */
    findPassableSegments(canPass) {
        const segments = [];
        let currentStart = null;
        
        for (let i = 0; i < canPass.length; i++) {
            if (canPass[i] && currentStart === null) {
                // Początek nowego segmentu
                currentStart = i;
            } else if (!canPass[i] && currentStart !== null) {
                // Koniec bieżącego segmentu
                segments.push({ start: currentStart, end: i - 1 });
                currentStart = null;
            }
        }
        
        // Jeśli segment trwa do końca
        if (currentStart !== null) {
            segments.push({ start: currentStart, end: canPass.length - 1 });
        }
        
        return segments;
    }

    /**
     * WYBIERA NAJLEPSZE SEGMENTY (NAJDŁUŻSZE)
     */
    selectBestSegments(segments, maxCount) {
        // Sortuj segmenty według długości (najdłuższe pierwsze)
        const sortedSegments = segments.sort((a, b) => {
            const lengthA = a.end - a.start + 1;
            const lengthB = b.end - b.start + 1;
            return lengthB - lengthA;
        });
        
        // Wybierz maksymalnie maxCount najdłuższych segmentów
        return sortedSegments.slice(0, maxCount);
    }

    /**
     * OBLICZA WSPÓŁRZĘDNE PIKSELI DLA PUNKTÓW PRZEJŚCIA
     */
    calculateTransitionPointPixels(chunks, gapSize = RENDER_CONSTANTS.GAP_SIZE) {
        const chunkPixelSize = this.settings.chunkSize * this.settings.tileSize;

        this.transitionPoints.forEach(point => {
            const chunkAData = chunks.find(c => c.id === point.chunkA);
            const chunkBData = chunks.find(c => c.id === point.chunkB);
            
            if (!chunkAData || !chunkBData) return;

            let pixelX, pixelY;

            if (point.direction === 'horizontal') {
                // Dla punktów poziomych - pozycja na prawej granicy chunk A
                const chunkStartX = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.x * (chunkPixelSize + gapSize);
                const chunkStartY = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.y * (chunkPixelSize + gapSize);
                
                // Pozycja X - na granicy między chunkami (na końcu chunk A)
                pixelX = chunkStartX + chunkPixelSize;
                
                // Pozycja Y - relatywna do chunk A, konwertowana na pozycję lokalną w chunku
                const localYInChunk = point.y % this.settings.chunkSize;
                pixelY = chunkStartY + localYInChunk * this.settings.tileSize + this.settings.tileSize / 2;
                
            } else if (point.direction === 'vertical') {
                // Dla punktów pionowych - pozycja na dolnej granicy chunk A
                const chunkStartX = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.x * (chunkPixelSize + gapSize);
                const chunkStartY = RENDER_CONSTANTS.CANVAS_PADDING + chunkAData.y * (chunkPixelSize + gapSize);
                
                // Pozycja X - relatywna do chunk A, konwertowana na pozycję lokalną w chunku
                const localXInChunk = point.x % this.settings.chunkSize;
                pixelX = chunkStartX + localXInChunk * this.settings.tileSize + this.settings.tileSize / 2;
                
                // Pozycja Y - na granicy między chunkami (na końcu chunk A)
                pixelY = chunkStartY + chunkPixelSize;
            }

            // Zapisz obliczone współrzędne w obiekcie punktu
            point.pixelX = pixelX;
            point.pixelY = pixelY;
        });
        

    }

    /**
     * ZNAJDUJE PUNKT PRZEJŚCIA POD WSPÓŁRZĘDNYMI MYSZY
     */
    getTransitionPointAt(mouseX, mouseY) {
        const baseRadius = Math.max(8, this.settings.tileSize / 2);
        const pointRadius = baseRadius * this.pathfindingSettings.transitionPointScale;
        
        // Stała tolerancja - prostsza i bardziej przewidywalna
        const tolerance = Math.max(20, pointRadius * 1.5);
        
        // Znajdź najbliższy punkt przejścia
        let closestPoint = null;
        let closestDistance = Infinity;
        
        for (const point of this.transitionPoints) {
            // Użyj pre-obliczonych współrzędnych pikseli
            if (typeof point.pixelX !== 'number' || typeof point.pixelY !== 'number') {
                console.warn(`⚠️ Point missing pixel coordinates:`, point);
                continue;
            }

            // Oblicz odległość od myszy do punktu
            const distance = Math.sqrt((mouseX - point.pixelX) ** 2 + (mouseY - point.pixelY) ** 2);
            
            // Sprawdź czy punkt jest w tolerancji i czy jest bliższy od poprzedniego
            if (distance <= tolerance && distance < closestDistance) {
                closestPoint = point;
                closestDistance = distance;
            }
        }
        
        return closestPoint;
    }

    /**
     * GETTER DLA PUNKTÓW PRZEJŚCIA
     */
    getTransitionPoints() {
        return this.transitionPoints;
    }

    /**
     * CZYŚCI PUNKTY PRZEJŚCIA
     */
    clearTransitionPoints() {
        this.transitionPoints = [];
    }
} 