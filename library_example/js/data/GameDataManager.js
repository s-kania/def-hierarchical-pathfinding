/**
 * ZARZĄDZANIE DANYMI GRY - HIERARCHICZNE PATHFINDING
 */

/**
 * MENEDŻER DANYCH GIER Z GRAFIKĄ PUNKTÓW PRZEJŚCIA
 */
export class GameDataManager {
    constructor(chunkSize) {
        this.chunkSize = chunkSize;
        this.transitionPoints = [];  // Array punktów z ID i connections
        this.chunks = [];            // Array chunków dla A*
        this.chunkConnections = new Map(); // Cache połączeń per chunk
    }
    
    /**
     * DODAJE PUNKT PRZEJŚCIA Z GENEROWANIEM ID I CONNECTIONS
     */
    addTransitionPoint(chunkA, chunkB, position) {
        // Normalizuj format ID chunków do przecinków
        const normalizeChunkId = (id) => id.replace('_', ',');
        chunkA = normalizeChunkId(chunkA);
        chunkB = normalizeChunkId(chunkB);
        
        // Generuj unikalne ID w formacie "chunkA-chunkB-position"
        const [sortedA, sortedB] = this.sortChunks(chunkA, chunkB);
        const id = `${sortedA}-${sortedB}-${position}`;
        
        const transitionPoint = {
            id: id,
            chunks: [sortedA, sortedB],
            position: position,
            connections: []  // Będzie wypełnione przez buildConnections
        };
        
        this.transitionPoints.push(transitionPoint);
        return transitionPoint;
    }
    
    /**
     * BUDUJE GRAF POŁĄCZEŃ MIĘDZY PUNKTAMI PRZEJŚCIA
     */
    buildConnections(chunks) {
        this.chunks = chunks;
        console.log('🔗 Budowanie grafu połączeń punktów przejścia...');
        
        // Wyczyść poprzednie connections
        this.transitionPoints.forEach(point => point.connections = []);
        this.chunkConnections.clear();
        
        // Grupuj punkty przejścia według chunków
        const pointsByChunk = this.groupPointsByChunk();
        
        // Dla każdego chunka buduj połączenia między jego punktami przejścia
        Object.entries(pointsByChunk).forEach(([chunkId, points]) => {
            if (points.length > 1) {
                this.buildChunkConnections(chunkId, points);
            }
        });
        
        console.log(`✓ Zbudowano graf z ${this.transitionPoints.length} punktów przejścia`);
    }
    
    /**
     * GRUPUJE PUNKTY PRZEJŚCIA WEDŁUG CHUNKÓW
     */
    groupPointsByChunk() {
        const pointsByChunk = {};
        
        this.transitionPoints.forEach(point => {
            point.chunks.forEach(chunkId => {
                if (!pointsByChunk[chunkId]) {
                    pointsByChunk[chunkId] = [];
                }
                pointsByChunk[chunkId].push(point);
            });
        });
        
        return pointsByChunk;
    }
    
    /**
     * BUDUJE POŁĄCZENIA W OBRĘBIE JEDNEGO CHUNKA UŻYWAJĄC A*
     */
    buildChunkConnections(chunkId, points) {
        const chunk = this.findChunk(chunkId);
        if (!chunk) {
            console.warn(`⚠️ Chunk ${chunkId} nie znaleziony`);
            return;
        }
        
        // Debug: sprawdź strukturę chunka
        console.log(`🔍 Budowanie połączeń dla chunka ${chunkId}:`, {
            id: chunk.id,
            x: chunk.x,
            y: chunk.y,
            hasTiles: !!chunk.tiles,
            tilesLength: chunk.tiles ? chunk.tiles.length : 0,
            pointsCount: points.length
        });
        
        // Dla każdej pary punktów przejścia w chunka sprawdź połączenie A*
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const pointA = points[i];
                const pointB = points[j];
                
                if (this.canConnectPoints(chunk, chunkId, pointA, pointB)) {
                    // Dodaj dwukierunkowe połączenie
                    pointA.connections.push(pointB.id);
                    pointB.connections.push(pointA.id);
                }
            }
        }
    }
    
    /**
     * SPRAWDZA CZY DWA PUNKTY PRZEJŚCIA MOGĄ BYĆ POŁĄCZONE A*
     */
    canConnectPoints(chunk, chunkId, pointA, pointB) {
        // Oblicz pozycje punktów w chunka
        const posA = this.getPointPositionInChunk(chunkId, pointA);
        const posB = this.getPointPositionInChunk(chunkId, pointB);
        
        if (!posA || !posB) {
            console.warn(`⚠️ Nie można obliczyć pozycji punktów w chunka ${chunkId}`, {
                pointA: pointA.id,
                pointB: pointB.id,
                posA,
                posB
            });
            return false;
        }
        
        // Debug pozycje
        console.log(`🔍 Sprawdzanie połączenia ${pointA.id} ↔ ${pointB.id}:`, {
            posA,
            posB,
            chunkSize: this.chunkSize
        });
        
        // Użyj A* do znalezienia ścieżki
        const path = this.findPathAStar(chunk, posA, posB);
        return path !== null;
    }
    
    /**
     * OBLICZA POZYCJĘ PUNKTU PRZEJŚCIA W CHUNKA (LOKALNE WSPÓŁRZĘDNE)
     */
    getPointPositionInChunk(chunkId, point) {
        // Znajdź która krawędź chunka zawiera ten punkt
        const chunkCoords = this.parseChunkId(chunkId);
        const [chunkA, chunkB] = point.chunks.map(id => this.parseChunkId(id));
        
        // Określ pozycję na krawędzi chunka
        if (chunkA.x === chunkB.x) {
            // Vertical connection
            if (chunkA.y < chunkB.y) {
                // Jeśli to chunk A (górny)
                if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: point.position, y: this.chunkSize - 1 };
                }
                // Jeśli to chunk B (dolny)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: 0 };
                }
            } else {
                // Jeśli to chunk B (górny)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: this.chunkSize - 1 };
                }
                // Jeśli to chunk A (dolny)
                else if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: point.position, y: 0 };
                }
            }
        } else {
            // Horizontal connection
            if (chunkA.x < chunkB.x) {
                // Jeśli to chunk A (lewy)
                if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: this.chunkSize - 1, y: point.position };
                }
                // Jeśli to chunk B (prawy)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: 0, y: point.position };
                }
            } else {
                // Jeśli to chunk B (lewy)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: this.chunkSize - 1, y: point.position };
                }
                // Jeśli to chunk A (prawy)
                else if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: 0, y: point.position };
                }
            }
        }
        
        return null;
    }
    
    /**
     * ALGORYTM A* DO ZNAJDOWANIA ŚCIEŻKI W CHUNKA
     */
    findPathAStar(chunk, start, goal) {
        // Sprawdź czy start i goal są na oceanie
        if (!this.isOceanTile(chunk, start.x, start.y) || 
            !this.isOceanTile(chunk, goal.x, goal.y)) {
            return null;
        }
        
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${start.x},${start.y}`;
        const goalKey = `${goal.x},${goal.y}`;
        
        openSet.push({ x: start.x, y: start.y, f: 0 });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, goal));
        
        while (openSet.length > 0) {
            // Znajdź węzeł z najniższym f score
            openSet.sort((a, b) => fScore.get(`${a.x},${a.y}`) - fScore.get(`${b.x},${b.y}`));
            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;
            
            if (currentKey === goalKey) {
                // Znaleziono ścieżkę
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            
            // Sprawdź sąsiadów
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Sprawdź czy sąsiad jest w granicach chunka i na oceanie
                if (neighbor.x < 0 || neighbor.x >= this.chunkSize ||
                    neighbor.y < 0 || neighbor.y >= this.chunkSize ||
                    !this.isOceanTile(chunk, neighbor.x, neighbor.y) ||
                    closedSet.has(neighborKey)) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(currentKey) + 1;
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goal));
                    
                    if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        return null; // Ścieżka nie znaleziona
    }
    
    /**
     * SPRAWDZA CZY TILE JEST OCEANEM
     */
    isOceanTile(chunk, x, y) {
        // Chunks używają pola 'tiles', nie 'data'
        const tileIndex = y * this.chunkSize + x;
        
        // Debug logging
        if (!chunk.tiles) {
            console.error('❌ Chunk nie ma pola tiles!', chunk);
            return false;
        }
        
        if (tileIndex < 0 || tileIndex >= chunk.tiles.length) {
            console.error(`❌ Tile index ${tileIndex} out of bounds! x=${x}, y=${y}, chunkSize=${this.chunkSize}`);
            return false;
        }
        
        return chunk.tiles[tileIndex] === 0;
    }
    
    /**
     * HEURYSTYKA DLA A* (ODLEGŁOŚĆ MANHATTAN)
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    /**
     * POBIERA SĄSIADÓW WĘZŁA
     */
    getNeighbors(node) {
        return [
            { x: node.x - 1, y: node.y },
            { x: node.x + 1, y: node.y },
            { x: node.x, y: node.y - 1 },
            { x: node.x, y: node.y + 1 }
        ];
    }
    
    /**
     * REKONSTRUUJE ŚCIEŻKĘ Z A*
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }
        
        return path;
    }
    
    /**
     * ZNAJDUJE CHUNK PO ID
     */
    findChunk(chunkId) {
        // Normalizuj format ID do przecinków
        const normalizedId = chunkId.replace('_', ',');
        return this.chunks.find(chunk => chunk.id === normalizedId);
    }
    
    /**
     * SORTUJE CHUNKI ALFABETYCZNIE
     */
    sortChunks(chunkA, chunkB) {
        const a = this.parseChunkId(chunkA);
        const b = this.parseChunkId(chunkB);
        
        if (a.y < b.y || (a.y === b.y && a.x < b.x)) {
            return [chunkA, chunkB];
        } else {
            return [chunkB, chunkA];
        }
    }
    
    /**
     * POBIERA PUNKT PRZEJŚCIA PO ID
     */
    getTransitionPointById(id) {
        return this.transitionPoints.find(point => point.id === id);
    }
    
    /**
     * POBIERA WSZYSTKIE POŁĄCZENIA DLA PUNKTU PRZEJŚCIA
     */
    getConnections(pointId) {
        const point = this.getTransitionPointById(pointId);
        return point ? point.connections : [];
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
                globalX = a.x * this.chunkSize + point.position;
                globalY = a.y * this.chunkSize + this.chunkSize;
            } else {
                globalX = a.x * this.chunkSize + this.chunkSize;
                globalY = a.y * this.chunkSize + point.position;
            }
            
            return {
                id: point.id,
                chunkA: point.chunks[0],
                chunkB: point.chunks[1],
                x: globalX,
                y: globalY,
                direction: direction,
                segmentLength: 1,
                pixelX: 0,
                pixelY: 0,
                connections: point.connections
            };
        });
    }
    
    /**
     * PARSUJE CHUNK ID DO WSPÓŁRZĘDNYCH
     */
    parseChunkId(chunkId) {
        // Obsługa obu formatów: "1_0" i "1,0"
        const separator = chunkId.includes(',') ? ',' : '_';
        const [x, y] = chunkId.split(separator).map(Number);
        return { x, y };
    }
    
    /**
     * DRUKUJE STATYSTYKI GRAFU
     */
    printGraphStats() {
        console.log('=== GRAF PUNKTÓW PRZEJŚCIA ===');
        console.log(`📊 Łączna liczba punktów: ${this.transitionPoints.length}`);
        
        let totalConnections = 0;
        this.transitionPoints.forEach(point => {
            totalConnections += point.connections.length;
        });
        
        console.log(`🔗 Łączna liczba połączeń: ${totalConnections / 2}`); // Dziel przez 2 bo dwukierunkowe
        console.log(`📈 Średnia połączeń na punkt: ${(totalConnections / this.transitionPoints.length).toFixed(2)}`);
        
        console.log('\n🔍 Punkty i ich połączenia:');
        this.transitionPoints.forEach(point => {
            console.log(`${point.id}: [${point.connections.join(', ')}]`);
        });
        
        console.log('===============================');
    }
} 