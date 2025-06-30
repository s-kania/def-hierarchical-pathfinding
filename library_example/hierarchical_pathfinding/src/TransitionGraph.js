/**
 * Graf punktów przejścia dla hierarchical pathfinding
 * Implementuje A* na grafie pre-computed connections między punktami przejścia
 */

/**
 * Minimalna implementacja Min Heap dla A* priority queue
 * Bazująca na standardowych implementacjach priority queue dla A*
 */
class MinHeap {
    constructor(compareFunction) {
        this.heap = [];
        this.compare = compareFunction || ((a, b) => a.f - b.f);
    }

    push(element) {
        this.heap.push(element);
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        
        const min = this.heap[0];
        const end = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        
        return min;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
                smallest = leftChild;
            }

            if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
                smallest = rightChild;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    size() {
        return this.heap.length;
    }

    // Sprawdź czy element o danym ID jest w heap
    contains(id) {
        return this.heap.some(item => item.id === id);
    }

    // Usuń element o danym ID
    remove(id) {
        const index = this.heap.findIndex(item => item.id === id);
        if (index === -1) return false;

        const lastElement = this.heap.pop();
        if (index < this.heap.length) {
            this.heap[index] = lastElement;
            this.bubbleUp(index);
            this.bubbleDown(index);
        }
        return true;
    }
}

export class TransitionGraph {
    constructor(transitionPoints, gridConfig = null) {
        this.points = new Map(); // id -> point
        this.graph = new Map();  // id -> connections
        this.gridConfig = gridConfig; // {gridWidth, gridHeight, chunkSize, tileSize}
        
        // Buduj struktury danych
        for (const point of transitionPoints) {
            // Waliduj punkt przejścia jeśli mamy konfigurację grida
            if (this.gridConfig && !this.isPointValid(point)) {
                console.warn(`⚠️ Punkt przejścia poza gridem: ${point.id}`);
                continue;
            }
            
            this.points.set(point.id, point);
            this.graph.set(point.id, point.connections || []);
        }
        
        // Waliduj connections jeśli mamy konfigurację grida
        if (this.gridConfig) {
            this.validateConnections();
        }
    }
    
    /**
     * Znajdź ścieżkę między punktami przejścia używając A*
     * Implementacja bazująca na standardowym algorytmie A* z Wikipedii
     * @param {string} startId - ID punktu startowego
     * @param {string} endId - ID punktu końcowego
     * @returns {Array|null} - Tablica ID punktów tworzących ścieżkę
     */
    findPath(startId, endId) {
        if (startId === endId) {
            return [startId];
        }
        
        if (!this.points.has(startId) || !this.points.has(endId)) {
            console.warn(`❌ Nie znaleziono punktów: start=${startId}, end=${endId}`);
            return null;
        }

        console.log(`🔍 A* pathfinding: ${startId} → ${endId}`);
        
        // Standardowa implementacja A* z Wikipedii + Priority Queue
        const openSet = new MinHeap((a, b) => a.f - b.f);  // Priority queue dla węzłów
        const openSetLookup = new Set();                    // Szybkie sprawdzanie czy węzeł w openSet
        const closedSet = new Set();                        // Węzły już sprawdzone
        const cameFrom = new Map();                         // Ścieżka poprzedników
        const gScore = new Map();                           // g(n) - koszt od startu do n
        const fScore = new Map();                           // f(n) = g(n) + h(n)
        
        // Inicjalizacja dla węzła startowego
        const startH = this.heuristic(startId, endId);
        gScore.set(startId, 0);
        fScore.set(startId, startH);
        openSet.push({ id: startId, f: startH, g: 0 });
        openSetLookup.add(startId);
        
        let iterations = 0;
        
        while (!openSet.isEmpty()) {
            iterations++;
            
            // Pobierz węzeł z najniższym f-score (O(log n))
            const currentNode = openSet.pop();
            if (!currentNode) {
                console.warn(`❌ A* nie znalazł current node (iteracja ${iterations})`);
                break;
            }
            
            const current = currentNode.id;
            openSetLookup.delete(current);
            
            // Znaleziono cel
            if (current === endId) {
                const path = this.reconstructPath(cameFrom, endId);
                console.log(`✅ A* znalazł ścieżkę w ${iterations} iteracjach: ${path.join(' → ')}`);
                return path;
            }
            
            // Przenieś current do closedSet
            closedSet.add(current);
            
            // Sprawdź wszystkich sąsiadów current
            const connections = this.graph.get(current) || [];
            console.log(`   Sprawdzam ${connections.length} connections z ${current}`);
            
            for (const connection of connections) {
                const neighbor = connection.id;
                const weight = connection.weight;
                
                // Pomiń sąsiadów już w closedSet
                if (closedSet.has(neighbor)) {
                    continue;
                }
                
                // Sprawdź czy sąsiad istnieje
                if (!this.points.has(neighbor)) {
                    console.warn(`⚠️ Connection do nieistniejącego punktu: ${current} → ${neighbor}`);
                    continue;
                }
                
                // Oblicz tentative gScore dla sąsiada
                const currentG = gScore.get(current) || Infinity;
                const tentativeG = currentG + weight;
                
                // Sprawdź czy już mamy lepszą ścieżkę do tego sąsiada
                const existingG = gScore.get(neighbor);
                if (existingG !== undefined && tentativeG >= existingG) {
                    // Ta ścieżka nie jest lepsza
                    continue;
                }
                
                // Ta ścieżka jest najlepsza do tej pory
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                
                const hCost = this.heuristic(neighbor, endId);
                const fCost = tentativeG + hCost;
                fScore.set(neighbor, fCost);
                
                // Jeśli sąsiad nie jest w openSet, dodaj go
                if (!openSetLookup.has(neighbor)) {
                    openSet.push({ id: neighbor, f: fCost, g: tentativeG });
                    openSetLookup.add(neighbor);
                } else {
                    // Sąsiad już jest w openSet - musimy zaktualizować jego f-score
                    // W prostej implementacji usuwamy stary i dodajemy nowy
                    openSet.remove(neighbor);
                    openSet.push({ id: neighbor, f: fCost, g: tentativeG });
                }
                
                console.log(`   → ${neighbor}: g=${tentativeG.toFixed(1)}, h=${hCost.toFixed(1)}, f=${fCost.toFixed(1)}`);
            }
            
            // Zabezpieczenie przed nieskończoną pętlą
            if (iterations > 1000) {
                console.error(`❌ A* przekroczył 1000 iteracji, przerywam`);
                break;
            }
        }
        
        console.warn(`❌ A* nie znalazł ścieżki po ${iterations} iteracjach`);
        return null;
    }
    
    /**
     * Pobierz wszystkie punkty przejścia w danym chunku
     * @param {string} chunkId - ID chunka
     * @returns {Array} - Tablica punktów przejścia
     */
    getPointsInChunk(chunkId) {
        // Sprawdź czy chunk jest w granicach grida
        if (this.gridConfig && !this.isChunkInBounds(chunkId)) {
            console.warn(`⚠️ Żądanie punktów dla chunka poza gridem: ${chunkId}`);
            return [];
        }

        const result = [];
        for (const [id, point] of this.points) {
            if (point.chunks.includes(chunkId)) {
                result.push(point);
            }
        }
        return result;
    }
    
    /**
     * Pobierz punkt przejścia po ID
     * @param {string} pointId - ID punktu
     * @returns {Object|null} - Punkt przejścia lub null
     */
    getPoint(pointId) {
        return this.points.get(pointId) || null;
    }
    
    /**
     * Heurystyka dla A* - odległość Manhattan między chunkami punktów
     * WAŻNE: Musi być admissible (nie przekraczać rzeczywistego kosztu)
     * @param {string} pointId1 - ID pierwszego punktu
     * @param {string} pointId2 - ID drugiego punktu
     * @returns {number} - Heurystyczna odległość
     */
    heuristic(pointId1, pointId2) {
        const point1 = this.points.get(pointId1);
        const point2 = this.points.get(pointId2);
        
        if (!point1 || !point2) {
            return 0;
        }
        
        // Używaj pierwszego chunka z każdego punktu do obliczeń
        const chunk1 = this.parseChunkId(point1.chunks[0]);
        const chunk2 = this.parseChunkId(point2.chunks[0]);
        
        // Podstawowa odległość Manhattan w chunkach
        const chunkDistance = Math.abs(chunk2.x - chunk1.x) + Math.abs(chunk2.y - chunk1.y);
        
        // Konserwatywne skalowanie - musi być <= rzeczywistego kosztu
        // Używamy małego mnożnika żeby heurystyka była admissible
        let scaledDistance = chunkDistance;
        
        if (this.gridConfig) {
            // Mnożnik powinien być <= średniej wagi przejścia między chunkami
            // Używamy połowy rozmiaru chunka jako bezpieczną wartość
            const conservativeScale = (this.gridConfig.chunkSize * this.gridConfig.tileSize) * 0.5;
            scaledDistance = chunkDistance * conservativeScale;
        }
        
        return scaledDistance;
    }
    
    /**
     * Rekonstruuj ścieżkę z mapy cameFrom
     * @param {Map} cameFrom - Mapa poprzedników
     * @param {string} endId - ID punktu końcowego
     * @returns {Array} - Tablica ID punktów tworzących ścieżkę
     */
    reconstructPath(cameFrom, endId) {
        const path = [endId];
        let currentId = endId;
        
        while (cameFrom.has(currentId)) {
            currentId = cameFrom.get(currentId);
            path.unshift(currentId);
        }
        
        return path;
    }
    
    /**
     * Parsuj ID chunka na współrzędne
     * @param {string} chunkId - ID chunka w formacie "x,y"
     * @returns {Object} - Współrzędne {x, y}
     */
    parseChunkId(chunkId) {
        const [x, y] = chunkId.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * Pobierz statystyki grafu
     * @returns {Object} - Statystyki grafu
     */
    getStats() {
        const pointCount = this.points.size;
        let connectionCount = 0;
        
        for (const connections of this.graph.values()) {
            connectionCount += connections.length;
        }
        
        return {
            pointCount,
            connectionCount: connectionCount / 2, // Dwukierunkowe połączenia
            avgConnectionsPerPoint: pointCount > 0 ? connectionCount / pointCount : 0
        };
    }

    /**
     * Sprawdź czy punkt przejścia jest prawidłowy w kontekście grida
     * @param {Object} point - Punkt przejścia
     * @returns {boolean} - Czy punkt jest prawidłowy
     */
    isPointValid(point) {
        if (!this.gridConfig) {
            return true; // Brak walidacji bez konfiguracji grida
        }

        for (const chunkId of point.chunks) {
            const chunkCoords = this.parseChunkId(chunkId);
            
            // Sprawdź czy chunk mieści się w gridzie
            if (chunkCoords.x < 0 || chunkCoords.x >= this.gridConfig.gridWidth ||
                chunkCoords.y < 0 || chunkCoords.y >= this.gridConfig.gridHeight) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Waliduj wszystkie connections w grafie
     */
    validateConnections() {
        let invalidConnections = 0;
        
        for (const [pointId, connections] of this.graph) {
            for (const conn of connections) {
                if (!this.points.has(conn.id)) {
                    console.warn(`⚠️ Connection do nieistniejącego punktu: ${pointId} -> ${conn.id}`);
                    invalidConnections++;
                }
            }
        }
        
        if (invalidConnections > 0) {
            console.warn(`⚠️ Znaleziono ${invalidConnections} nieprawidłowych connections`);
        }
    }

    /**
     * Sprawdź czy chunk mieści się w granicach grida
     * @param {string} chunkId - ID chunka
     * @returns {boolean} - Czy chunk jest w granicach
     */
    isChunkInBounds(chunkId) {
        if (!this.gridConfig) {
            return true;
        }

        const coords = this.parseChunkId(chunkId);
        return coords.x >= 0 && coords.x < this.gridConfig.gridWidth &&
               coords.y >= 0 && coords.y < this.gridConfig.gridHeight;
    }

    /**
     * Pobierz rozmiar grida w chunkach
     * @returns {Object|null} - {width, height} lub null jeśli brak konfiguracji
     */
    getGridSize() {
        return this.gridConfig ? {
            width: this.gridConfig.gridWidth,
            height: this.gridConfig.gridHeight
        } : null;
    }

    /**
     * Debug grafu - sprawdź strukturę connections
     * @returns {Object} - Raport o stanie grafu
     */
    debugGraph() {
        const report = {
            totalPoints: this.points.size,
            totalConnections: 0,
            isolatedPoints: [],
            invalidConnections: [],
            connectionMatrix: new Map(),
            bidirectionalIssues: []
        };

        // Sprawdź każdy punkt
        for (const [pointId, point] of this.points) {
            const connections = this.graph.get(pointId) || [];
            report.totalConnections += connections.length;
            
            // Punkty bez połączeń
            if (connections.length === 0) {
                report.isolatedPoints.push(pointId);
            }
            
            // Sprawdź każde połączenie
            for (const conn of connections) {
                // Czy docelowy punkt istnieje?
                if (!this.points.has(conn.id)) {
                    report.invalidConnections.push({
                        from: pointId,
                        to: conn.id,
                        weight: conn.weight
                    });
                    continue;
                }
                
                // Sprawdź bidirectional
                const reverseConnections = this.graph.get(conn.id) || [];
                const hasReverse = reverseConnections.some(rev => rev.id === pointId);
                
                if (!hasReverse) {
                    report.bidirectionalIssues.push({
                        from: pointId,
                        to: conn.id,
                        weight: conn.weight,
                        issue: 'missing_reverse'
                    });
                }
            }
            
            report.connectionMatrix.set(pointId, connections.map(c => ({
                to: c.id,
                weight: c.weight
            })));
        }
        
        report.avgConnectionsPerPoint = report.totalPoints > 0 ? 
            report.totalConnections / report.totalPoints : 0;
            
        return report;
    }

    /**
     * Wyświetl raport debug grafu
     */
    printDebugReport() {
        const report = this.debugGraph();
        
        console.log('\n🔍 RAPORT DEBUG GRAFU');
        console.log('═══════════════════════');
        console.log(`📊 Punkty: ${report.totalPoints}`);
        console.log(`🔗 Connections: ${report.totalConnections}`);
        console.log(`📈 Średnio connections/punkt: ${report.avgConnectionsPerPoint.toFixed(2)}`);
        
        if (report.isolatedPoints.length > 0) {
            console.log(`\n🏝️ IZOLOWANE PUNKTY (${report.isolatedPoints.length}):`);
            report.isolatedPoints.forEach(p => console.log(`   - ${p}`));
        }
        
        if (report.invalidConnections.length > 0) {
            console.log(`\n❌ NIEPRAWIDŁOWE CONNECTIONS (${report.invalidConnections.length}):`);
            report.invalidConnections.forEach(c => 
                console.log(`   - ${c.from} → ${c.to} (weight: ${c.weight})`)
            );
        }
        
        if (report.bidirectionalIssues.length > 0) {
            console.log(`\n⚠️ PROBLEMY BIDIRECTIONAL (${report.bidirectionalIssues.length}):`);
            report.bidirectionalIssues.forEach(c => 
                console.log(`   - ${c.from} → ${c.to} (brak reverse connection)`)
            );
        }
        
        console.log('\n🗺️ MATRYCA CONNECTIONS:');
        for (const [pointId, connections] of report.connectionMatrix) {
            if (connections.length > 0) {
                const connStr = connections.map(c => `${c.to}(${c.weight})`).join(', ');
                console.log(`   ${pointId} → [${connStr}]`);
            }
        }
        
        return report;
    }

    /**
     * Test A* na konkretnej parze punktów z szczegółowym debugowaniem
     * @param {string} startId - ID punktu startowego
     * @param {string} endId - ID punktu końcowego
     * @returns {Object} - Raport testu A*
     */
    testAStar(startId, endId) {
        console.log(`\n🧪 TEST A* ALGORITHM: ${startId} → ${endId}`);
        console.log('═══════════════════════════════════════════');
        
        const startTime = performance.now();
        
        const result = {
            startId,
            endId,
            success: false,
            path: null,
            iterations: 0,
            nodesExpanded: 0,
            timing: {},
            issues: []
        };
        
        try {
            // Sprawdź czy punkty istnieją
            if (!this.points.has(startId)) {
                result.issues.push(`Start point ${startId} nie istnieje`);
            }
            if (!this.points.has(endId)) {
                result.issues.push(`End point ${endId} nie istnieje`);
            }
            
            if (result.issues.length > 0) {
                return result;
            }
            
            // Sprawdź heurystykę
            const heuristic = this.heuristic(startId, endId);
            console.log(`📏 Heurystyka ${startId} → ${endId}: ${heuristic.toFixed(2)}`);
            
            // Uruchom A*
            const path = this.findPath(startId, endId);
            result.path = path;
            result.success = path !== null;
            
            if (path) {
                // Oblicz rzeczywisty koszt ścieżki
                let totalCost = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    const from = path[i];
                    const to = path[i + 1];
                    const connections = this.graph.get(from) || [];
                    const connection = connections.find(c => c.id === to);
                    if (connection) {
                        totalCost += connection.weight;
                    } else {
                        result.issues.push(`Brak connection ${from} → ${to} w znalezionej ścieżce!`);
                    }
                }
                
                console.log(`💰 Rzeczywisty koszt ścieżki: ${totalCost.toFixed(2)}`);
                console.log(`📏 Początkowa heurystyka: ${heuristic.toFixed(2)}`);
                
                // Sprawdź czy heurystyka była admissible
                if (heuristic > totalCost) {
                    result.issues.push(`Heurystyka nie jest admissible: ${heuristic.toFixed(2)} > ${totalCost.toFixed(2)}`);
                    console.warn(`⚠️ PROBLEM: Heurystyka przekroczyła rzeczywisty koszt!`);
                }
                
                result.pathCost = totalCost;
                result.heuristicCost = heuristic;
            }
            
        } catch (error) {
            result.issues.push(`Błąd A*: ${error.message}`);
        }
        
        const endTime = performance.now();
        result.timing.total = endTime - startTime;
        
        console.log(`\n📊 WYNIK TESTU A*:`);
        console.log(`✅ Sukces: ${result.success}`);
        console.log(`⏱️ Czas: ${result.timing.total.toFixed(2)}ms`);
        if (result.issues.length > 0) {
            console.log(`⚠️ Problemy (${result.issues.length}):`);
            result.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        return result;
    }

    /**
     * Waliduj wszystkie wagi w grafie pod kątem A*
     * @returns {Object} - Raport walidacji
     */
    validateWeights() {
        console.log(`\n🔍 WALIDACJA WAG GRAFU DLA A*`);
        console.log('═══════════════════════════════════════');
        
        const report = {
            totalConnections: 0,
            negativeWeights: [],
            zeroWeights: [],
            missingWeights: [],
            weightStats: {
                min: Infinity,
                max: -Infinity,
                avg: 0,
                total: 0
            }
        };
        
        let totalWeight = 0;
        
        for (const [pointId, connections] of this.graph) {
            for (const conn of connections) {
                report.totalConnections++;
                
                if (conn.weight === undefined || conn.weight === null) {
                    report.missingWeights.push(`${pointId} → ${conn.id}`);
                    continue;
                }
                
                if (conn.weight < 0) {
                    report.negativeWeights.push(`${pointId} → ${conn.id}: ${conn.weight}`);
                }
                
                if (conn.weight === 0) {
                    report.zeroWeights.push(`${pointId} → ${conn.id}`);
                }
                
                totalWeight += conn.weight;
                report.weightStats.min = Math.min(report.weightStats.min, conn.weight);
                report.weightStats.max = Math.max(report.weightStats.max, conn.weight);
            }
        }
        
        report.weightStats.avg = report.totalConnections > 0 ? totalWeight / report.totalConnections : 0;
        report.weightStats.total = totalWeight;
        
        // Wyświetl raport
        console.log(`📊 Connections: ${report.totalConnections}`);
        console.log(`📈 Wagi: min=${report.weightStats.min.toFixed(2)}, max=${report.weightStats.max.toFixed(2)}, avg=${report.weightStats.avg.toFixed(2)}`);
        
        if (report.negativeWeights.length > 0) {
            console.log(`❌ UJEMNE WAGI (${report.negativeWeights.length}):`);
            report.negativeWeights.forEach(w => console.log(`   - ${w}`));
        }
        
        if (report.zeroWeights.length > 0) {
            console.log(`⚠️ ZEROWE WAGI (${report.zeroWeights.length}):`);
            report.zeroWeights.forEach(w => console.log(`   - ${w}`));
        }
        
        if (report.missingWeights.length > 0) {
            console.log(`❌ BRAKUJĄCE WAGI (${report.missingWeights.length}):`);
            report.missingWeights.forEach(w => console.log(`   - ${w}`));
        }
        
        const hasIssues = report.negativeWeights.length > 0 || report.missingWeights.length > 0;
        console.log(`\n${hasIssues ? '❌' : '✅'} Graf ${hasIssues ? 'MA PROBLEMY' : 'JEST PRAWIDŁOWY'} dla A*`);
        
        return report;
    }
} 