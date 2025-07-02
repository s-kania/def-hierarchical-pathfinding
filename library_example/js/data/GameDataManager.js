/**
 * ZARZĄDZANIE DANYMI GRY - HIERARCHICZNE PATHFINDING
 */

/**
 * MENEDŻER DANYCH GIER Z GRAFIKĄ PUNKTÓW PRZEJŚCIA
 */
export class GameDataManager {
    constructor(gridWidth, gridHeight, chunkWidth, chunkHeight) {
        this.gridWidth = gridWidth;       // Liczba chunków w poziomie
        this.gridHeight = gridHeight;     // Liczba chunków w pionie
        this.chunkWidth = chunkWidth;     // Szerokość chunka w kafelkach (z ustawień)
        this.chunkHeight = chunkHeight;   // Wysokość chunka w kafelkach (z ustawień)
        
        /**
         * TRANSITION POINTS - Array punktów przejścia między chunkami
         * Format każdego punktu:
         * {
         *   id: string,           // "chunkA-chunkB-position" np. "0,0-1,0-15"
         *   chunks: [string],     // ["chunkA_id", "chunkB_id"] np. ["0,0", "1,0"]
         *   position: number,     // pozycja na krawędzi chunka (0-chunkSize-1)
         *   connections: [object] // [{id: "point_id", weight: number, chunk: "chunk_id"}] połączenia z wagami i chunkiem
         * }
         */
        this.transitionPoints = [];
        
        /**
         * CHUNKS - Obiekt chunków gdzie klucze to ID chunków, wartości to tiles
         * Format:
         * {
         *   "0,0": [[0,1,0,1], [1,0,0,1], ...],  // 2D array tiles (0=ocean, 1=land)
         *   "1,0": [[1,0,1,0], [0,1,1,0], ...],
         *   ...
         * }
         */
        this.chunks = {};
        
        console.log(`✓ GameDataManager: zainicjalizowano z chunks ${chunkWidth}x${chunkHeight}, grid ${gridWidth}x${gridHeight}`);
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
        // Konwertuj chunks array na obiekt z kluczami jako ID chunka
        this.chunks = {};
        chunks.forEach(chunk => {
            this.chunks[chunk.id] = this.convertChunkTo2D(chunk);
        });
        
        // Wyczyść poprzednie connections
        this.transitionPoints.forEach(point => point.connections = []);
        
        // Grupuj punkty przejścia według chunków
        const pointsByChunk = this.groupPointsByChunk();
        
        // Dla każdego chunka buduj połączenia między jego punktami przejścia
        Object.entries(pointsByChunk).forEach(([chunkId, points]) => {
            if (points.length > 1) {
                this.buildChunkConnections(chunkId, points);
            }
        });
    }
    
    /**
     * KONWERTUJE CHUNK Z 1D TILES ARRAY NA 2D FORMAT
     */
    convertChunkTo2D(chunk) {
        if (!chunk || !chunk.tiles) {
            return null;
        }
        
        // Sprawdź czy już ma format 2D
        if (Array.isArray(chunk.tiles[0])) {
            return chunk.tiles; // Zwróć tylko tiles w formacie 2D
        }
        
        // Oblicz chunkSize z tiles array (sqrt z długości)
        const chunkSize = Math.sqrt(chunk.tiles.length);
        
        // Konwertuj 1D → 2D
        const tiles2D = [];
        for (let y = 0; y < chunkSize; y++) {
            const row = [];
            for (let x = 0; x < chunkSize; x++) {
                const index = y * chunkSize + x;
                row.push(chunk.tiles[index]); // 0=ocean, 1=land
            }
            tiles2D.push(row);
        }
        
        return tiles2D; // Zwróć tylko tiles w formacie 2D
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
        const chunkTiles = this.chunks[chunkId];
        if (!chunkTiles) {
            return;
        }
        
        // Dla każdej pary punktów przejścia w chunka sprawdź połączenie A*
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const pointA = points[i];
                const pointB = points[j];
                
                const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
                if (pathData) {
                    // Dodaj dwukierunkowe połączenie z wagą i informacją o chunku
                    const connectionA = {
                        id: pointB.id,
                        weight: pathData.weight,
                        chunk: chunkId
                    };
                    const connectionB = {
                        id: pointA.id,
                        weight: pathData.weight,
                        chunk: chunkId
                    };
                    
                    pointA.connections.push(connectionA);
                    pointB.connections.push(connectionB);
                }
            }
        }
    }
    
    /**
     * SPRAWDZA CZY DWA PUNKTY PRZEJŚCIA MOGĄ BYĆ POŁĄCZONE A* I ZWRACA WAGĘ
     */
    canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB) {
        // Oblicz pozycje punktów w chunka
        const posA = this.getPointPositionInChunk(chunkId, pointA);
        const posB = this.getPointPositionInChunk(chunkId, pointB);
        
        if (!posA || !posB) {
            return null;
        }
        
        // Użyj A* do znalezienia ścieżki
        const path = this.findPathAStar(chunkTiles, posA, posB);
        if (path) {
            return {
                weight: path.length - 1, // Liczba kroków (węzłów - 1)
                path: path
            };
        }
        
        return null;
    }
    
    /**
     * SPRAWDZA CZY DWA PUNKTY PRZEJŚCIA MOGĄ BYĆ POŁĄCZONE A* (STARA METODA - KOMPATYBILNOŚĆ)
     */
    canConnectPoints(chunkTiles, chunkId, pointA, pointB) {
        const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
        return pathData !== null;
    }

    /**
     * SPRAWDZA POŁĄCZENIE MIĘDZY PUNKTAMI PRZEJŚCIA NA KONKRETNYM CHUNKU
     */
    checkConnectionOnChunk(chunkId, pointAId, pointBId) {
        // Sprawdź czy chunk istnieje
        const chunkTiles = this.chunks[chunkId];
        if (!chunkTiles) {
            return {
                canConnect: false,
                error: `Chunk ${chunkId} nie istnieje`
            };
        }

        // Znajdź punkty przejścia
        const pointA = this.getTransitionPointById(pointAId);
        const pointB = this.getTransitionPointById(pointBId);
        
        if (!pointA) {
            return {
                canConnect: false,
                error: `Punkt przejścia ${pointAId} nie istnieje`
            };
        }
        
        if (!pointB) {
            return {
                canConnect: false,
                error: `Punkt przejścia ${pointBId} nie istnieje`
            };
        }

        // Sprawdź czy oba punkty należą do tego chunka
        if (!pointA.chunks.includes(chunkId)) {
            return {
                canConnect: false,
                error: `Punkt ${pointAId} nie należy do chunka ${chunkId}`
            };
        }
        
        if (!pointB.chunks.includes(chunkId)) {
            return {
                canConnect: false,
                error: `Punkt ${pointBId} nie należy do chunka ${chunkId}`
            };
        }

        // Sprawdź połączenie A*
        const pathData = this.canConnectPointsWithWeight(chunkTiles, chunkId, pointA, pointB);
        
        if (pathData) {
            return {
                canConnect: true,
                weight: pathData.weight,
                pathLength: pathData.path.length,
                chunk: chunkId,
                path: pathData.path
            };
        } else {
            return {
                canConnect: false,
                error: `Brak możliwej ścieżki między punktami na chunku ${chunkId}`
            };
        }
    }
    
    /**
     * OBLICZA POZYCJĘ PUNKTU PRZEJŚCIA W CHUNKA (LOKALNE WSPÓŁRZĘDNE)
     */
    getPointPositionInChunk(chunkId, point) {
        // Sprawdź czy mamy informacje o wymiarach chunka
        if (!this.chunkWidth || !this.chunkHeight) {
            console.warn('GameDataManager: brak informacji o wymiarach chunka');
            return null;
        }
        
        // Znajdź która krawędź chunka zawiera ten punkt
        const chunkCoords = this.parseChunkId(chunkId);
        const [chunkA, chunkB] = point.chunks.map(id => this.parseChunkId(id));
        
        // Określ pozycję na krawędzi chunka
        if (chunkA.x === chunkB.x) {
            // Vertical connection
            if (chunkA.y < chunkB.y) {
                // Jeśli to chunk A (górny)
                if (chunkCoords.x === chunkA.x && chunkCoords.y === chunkA.y) {
                    return { x: point.position, y: this.chunkHeight - 1 };
                }
                // Jeśli to chunk B (dolny)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: 0 };
                }
            } else {
                // Jeśli to chunk B (górny)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: point.position, y: this.chunkHeight - 1 };
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
                    return { x: this.chunkWidth - 1, y: point.position };
                }
                // Jeśli to chunk B (prawy)
                else if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: 0, y: point.position };
                }
            } else {
                // Jeśli to chunk B (lewy)
                if (chunkCoords.x === chunkB.x && chunkCoords.y === chunkB.y) {
                    return { x: this.chunkWidth - 1, y: point.position };
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
    findPathAStar(chunkTiles, start, goal) {
        // Sprawdź czy start i goal są na oceanie
        if (!this.isOceanTile(chunkTiles, start.x, start.y) || 
            !this.isOceanTile(chunkTiles, goal.x, goal.y)) {
            return null;
        }
        
        const chunkSize = chunkTiles.length; // Wysokość chunka
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
                if (neighbor.x < 0 || neighbor.x >= chunkSize ||
                    neighbor.y < 0 || neighbor.y >= chunkSize ||
                    !this.isOceanTile(chunkTiles, neighbor.x, neighbor.y) ||
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
    isOceanTile(chunkTiles, x, y) {
        if (!chunkTiles || !Array.isArray(chunkTiles)) {
            return false;
        }
        
        // Sprawdź granice
        if (x < 0 || y < 0 || y >= chunkTiles.length || x >= chunkTiles[0].length) {
            return false;
        }
        
        // 2D format: chunkTiles[y][x]
        return chunkTiles[y][x] === 0;
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
     * POBIERA TYLKO ID POŁĄCZEŃ (BEZ WAG) - DLA KOMPATYBILNOŚCI
     */
    getConnectionIds(pointId) {
        const connections = this.getConnections(pointId);
        return connections.map(conn => typeof conn === 'string' ? conn : conn.id);
    }
    
    /**
     * POBIERA WAGĘ POŁĄCZENIA MIĘDZY DWOMA PUNKTAMI
     */
    getConnectionWeight(fromPointId, toPointId) {
        const connections = this.getConnections(fromPointId);
        const connection = connections.find(conn => 
            (typeof conn === 'string' ? conn : conn.id) === toPointId
        );
        
        if (connection && typeof connection === 'object' && connection.weight !== undefined) {
            return connection.weight;
        }
        
        // Jeśli nie ma wagi, zwróć 1 jako domyślną
        return 1;
    }
    
    /**
     * KONWERTUJE PUNKTY PRZEJŚCIA NA DOMYŚLNY FORMAT (DLA KOMPATYBILNOŚCI)
     */
    convertTransitionPointsToDefault() {
        return this.transitionPoints.map(point => {
            const [a, b] = point.chunks.map(id => this.parseChunkId(id));
            
            // Użyj wymiarów chunka z GameDataManager
            const chunkWidth = this.chunkWidth || 11;   // fallback na 11
            const chunkHeight = this.chunkHeight || 11; // fallback na 11
            
            // Dedukuj kierunek z pozycji chunków
            const direction = a.x === b.x ? 'vertical' : 'horizontal';
            
            // Oblicz globalne współrzędne
            let globalX, globalY;
            if (direction === 'vertical') {
                globalX = a.x * chunkWidth + point.position;
                globalY = a.y * chunkHeight + chunkHeight;
            } else {
                globalX = a.x * chunkWidth + chunkWidth;
                globalY = a.y * chunkHeight + point.position;
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
     * POBIERA DANE CHUNKA W FORMACIE 2D DLA HIERARCHICAL PATHFINDING
     */
    getChunkData(chunkId) {
        // Normalizuj format ID do przecinków
        const normalizedId = chunkId.replace('_', ',');
        return this.chunks[normalizedId] || null;
    }
    
    /**
     * WYŚWIETLA WSZYSTKIE POŁĄCZENIA DLA KONKRETNEGO PUNKTU PRZEJŚCIA
     */
    printPointConnections(pointId) {
        const point = this.getTransitionPointById(pointId);
        if (!point) {
            console.error(`❌ Punkt przejścia ${pointId} nie istnieje`);
            return;
        }

        console.log(`\n=== POŁĄCZENIA PUNKTU ${pointId} ===`);
        console.log(`📍 Chunki: [${point.chunks.join(', ')}]`);
        console.log(`📐 Pozycja: ${point.position}`);
        console.log(`🔗 Liczba połączeń: ${point.connections.length}`);
        
        if (point.connections.length === 0) {
            console.log('❌ Brak połączeń');
            return;
        }

        // Grupuj połączenia według chunków
        const connectionsByChunk = {};
        point.connections.forEach(conn => {
            const chunk = conn.chunk || 'unknown';
            if (!connectionsByChunk[chunk]) {
                connectionsByChunk[chunk] = [];
            }
            connectionsByChunk[chunk].push(conn);
        });

        // Wyświetl połączenia pogrupowane według chunków
        Object.entries(connectionsByChunk).forEach(([chunk, connections]) => {
            console.log(`\n📦 Chunk: ${chunk}`);
            connections.forEach(conn => {
                console.log(`  → ${conn.id} (waga: ${conn.weight})`);
            });
        });
        
        console.log('===============================\n');
    }

    /**
     * DRUKUJE STATYSTYKI GRAFU
     */
    printGraphStats() {
        console.log('=== GRAF PUNKTÓW PRZEJŚCIA ===');
        console.log(`📊 Łączna liczba punktów: ${this.transitionPoints.length}`);
        
        let totalConnections = 0;
        let totalWeight = 0;
        this.transitionPoints.forEach(point => {
            totalConnections += point.connections.length;
            point.connections.forEach(conn => {
                totalWeight += (typeof conn === 'object' && conn.weight) ? conn.weight : 1;
            });
        });
        
        console.log(`🔗 Łączna liczba połączeń: ${totalConnections / 2}`); // Dziel przez 2 bo dwukierunkowe
        console.log(`⚖️  Łączna waga połączeń: ${totalWeight / 2}`); // Dziel przez 2 bo dwukierunkowe
        console.log(`📈 Średnia połączeń na punkt: ${(totalConnections / this.transitionPoints.length).toFixed(2)}`);
        console.log(`📏 Średnia waga połączenia: ${((totalWeight / 2) / (totalConnections / 2)).toFixed(2)}`);
        
        console.log('\n🔍 Punkty i ich połączenia (ID:waga):');
        this.transitionPoints.forEach(point => {
            const connectionsStr = point.connections.map(conn => {
                if (typeof conn === 'object' && conn.weight !== undefined) {
                    return `${conn.id}:${conn.weight}`;
                } else {
                    return typeof conn === 'string' ? `${conn}:1` : `${conn.id}:1`;
                }
            }).join(', ');
            console.log(`${point.id}: [${connectionsStr}]`);
        });
        
        console.log('===============================');
    }
} 