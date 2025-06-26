/**
 * ZARZĄDZANIE DANYMI GRY - KOMPATYBILNOŚĆ Z POPRZEDNIĄ WERSJĄ
 */

/**
 * MENEDŻER PUNKTÓW PRZEJŚCIA - MINIMALISTYCZNY FORMAT
 * 
 * Przechowuje punkty przejścia w formacie:
 * {
 *   chunks: ['8_1', '8_2'],  // para ID chunków
 *   position: 16             // pozycja wzdłuż krawędzi (0 do chunkSize-1)
 * }
 */
// export class TransitionPointManagerLegacy {
//     constructor(chunkSize) {
//         this.chunkSize = chunkSize;
//         this.points = [];  // Array punktów w nowym formacie
//     }
    
//     /**
//      * DODAJE PUNKT PRZEJŚCIA W NOWYM FORMACIE
//      */
//     addPoint(chunkA, chunkB, position) {
//         // Walidacja
//         if (!this.areChunksAdjacent(chunkA, chunkB)) {
//             console.warn(`⚠️ Chunks ${chunkA} and ${chunkB} are not adjacent`);
//             return null;
//         }
        
//         if (position < 0 || position >= this.chunkSize) {
//             console.warn(`⚠️ Position ${position} out of range (0-${this.chunkSize-1})`);
//             return null;
//         }
        
//         // Normalizuj kolejność chunków (zawsze mniejszy pierwszy)
//         const [sortedA, sortedB] = this.sortChunks(chunkA, chunkB);
        
//         const point = {
//             chunks: [sortedA, sortedB],
//             position: position
//         };
        
//         this.points.push(point);
//         console.log(`✓ Added transition point: ${sortedA} ↔ ${sortedB} at position ${position}`);
        
//         return point;
//     }
    
//     /**
//      * KONWERTUJE ZE STAREGO FORMATU DO NOWEGO
//      */
//     convertFromOldFormat(oldFormatPoints) {
//         this.points = [];
        
//         oldFormatPoints.forEach(oldPoint => {
//             // Wyciągnij chunk coordinates z globalnych
//             const chunkA = this.globalToChunkId(oldPoint.x, oldPoint.y, oldPoint.direction);
//             const chunkB = this.getAdjacentChunkId(chunkA, oldPoint.direction);
            
//             // Oblicz pozycję lokalną wzdłuż krawędzi
//             const position = this.calculateLocalPosition(oldPoint.x, oldPoint.y, oldPoint.direction);
            
//             this.addPoint(chunkA, chunkB, position);
//         });
        
//         console.log(`🔄 Converted ${oldFormatPoints.length} points from old format`);
//         return this.points;
//     }
    
//     /**
//      * KONWERTUJE DO STAREGO FORMATU (DLA KOMPATYBILNOŚCI)
//      */
//     convertToOldFormat() {
//         return this.points.map(point => {
//             const globalCoords = this.getGlobalCoords(point);
//             const direction = this.getDirection(point);
            
//             return {
//                 chunkA: point.chunks[0],
//                 chunkB: point.chunks[1],
//                 x: globalCoords.x,
//                 y: globalCoords.y,
//                 direction: direction,
//                 segmentLength: 1, // Domyślnie pojedynczy punkt
//                 pixelX: 0, // Będzie obliczone przez renderer
//                 pixelY: 0
//             };
//         });
//     }
    
//     /**
//      * SPRAWDZA CZY CHUNKI SĄ SĄSIADUJĄCE
//      */
//     areChunksAdjacent(chunkA, chunkB) {
//         const a = this.parseChunkId(chunkA);
//         const b = this.parseChunkId(chunkB);
        
//         const dx = Math.abs(a.x - b.x);
//         const dy = Math.abs(a.y - b.y);
        
//         // Sąsiadujące: dokładnie jeden z dx,dy = 1, drugi = 0
//         return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
//     }
    
//     /**
//      * PARSUJE CHUNK ID DO OBIEKTÓW WSPÓŁRZĘDNYCH
//      */
//     parseChunkId(chunkId) {
//         const [x, y] = chunkId.split('_').map(Number);
//         return { x, y };
//     }
    
//     // Inne metody pomocnicze...
//     sortChunks(chunkA, chunkB) {
//         const a = this.parseChunkId(chunkA);
//         const b = this.parseChunkId(chunkB);
        
//         if (a.y < b.y || (a.y === b.y && a.x < b.x)) {
//             return [chunkA, chunkB];
//         } else {
//             return [chunkB, chunkA];
//         }
//     }
    
//     getGlobalCoords(point) {
//         const [a, b] = point.chunks.map(id => this.parseChunkId(id));
        
//         if (a.x === b.x) {
//             return {
//                 x: a.x * this.chunkSize + point.position,
//                 y: a.y * this.chunkSize + this.chunkSize
//             };
//         } else {
//             return {
//                 x: a.x * this.chunkSize + this.chunkSize,
//                 y: a.y * this.chunkSize + point.position
//             };
//         }
//     }
    
//     getDirection(point) {
//         const [a, b] = point.chunks.map(id => this.parseChunkId(id));
        
//         if (a.x === b.x) {
//             return 'vertical';
//         } else {
//             return 'horizontal';
//         }
//     }
    
//     globalToChunkId(globalX, globalY, direction) {
//         if (direction === 'horizontal') {
//             const chunkX = Math.floor((globalX - 1) / this.chunkSize);
//             const chunkY = Math.floor(globalY / this.chunkSize);
//             return `${chunkX}_${chunkY}`;
//         } else {
//             const chunkX = Math.floor(globalX / this.chunkSize);
//             const chunkY = Math.floor((globalY - 1) / this.chunkSize);
//             return `${chunkX}_${chunkY}`;
//         }
//     }
    
//     getAdjacentChunkId(chunkId, direction) {
//         const chunk = this.parseChunkId(chunkId);
        
//         if (direction === 'horizontal') {
//             return `${chunk.x + 1}_${chunk.y}`;
//         } else {
//             return `${chunk.x}_${chunk.y + 1}`;
//         }
//     }
    
//     calculateLocalPosition(globalX, globalY, direction) {
//         if (direction === 'horizontal') {
//             return globalY % this.chunkSize;
//         } else {
//             return globalX % this.chunkSize;
//         }
//     }
// }

/**
 * MENEDŻER DANYCH GIER - PROSTY FORMAT
 */
export class GameDataManager {
    constructor(chunkSize) {
        this.chunkSize = chunkSize;
        this.transitionPoints = [];  // Array punktów w nowym formacie
        this.chunks = [];            // Array chunków (w przyszłości)
    }
    
    /**
     * KONWERTUJE PUNKTY PRZEJŚCIA NA DOMYŚLNY FORMAT (DLA KOMPATYBILNOŚCI)
     */
    convertTransitionPointsToDefault() {
        return this.transitionPoints.map(point => {
            const [a, b] = point.chunks.map(id => this.parseChunkId(id));
            
            // Dedukuj kierunek z pozycji chunków
            const direction = a.x === b.x ? 'vertical' : 'horizontal';
            
            // Oblicz globalne współrzędne
            let globalX, globalY;
            if (direction === 'vertical') {
                // Vertical connection - X nie zmienia się
                globalX = a.x * this.chunkSize + point.position;
                globalY = a.y * this.chunkSize + this.chunkSize;
            } else {
                // Horizontal connection - Y nie zmienia się  
                globalX = a.x * this.chunkSize + this.chunkSize;
                globalY = a.y * this.chunkSize + point.position;
            }
            
            return {
                chunkA: point.chunks[0],
                chunkB: point.chunks[1],
                x: globalX,
                y: globalY,
                direction: direction,
                segmentLength: 1,
                pixelX: 0,  // Będzie obliczone przez renderer
                pixelY: 0
            };
        });
    }
    
    /**
     * PARSUJE CHUNK ID DO WSPÓŁRZĘDNYCH
     */
    parseChunkId(chunkId) {
        const [x, y] = chunkId.split('_').map(Number);
        return { x, y };
    }
} 