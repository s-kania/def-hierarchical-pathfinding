/**
 * Graf punktów przejścia dla hierarchical pathfinding
 * Minimalna implementacja A* na grafie pre-computed connections
 */

/**
 * Prosta implementacja Min Heap dla A*
 */
class MinHeap {
    constructor() {
        this.heap = [];
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
            if (this.heap[index].f >= this.heap[parentIndex].f) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < this.heap.length && this.heap[leftChild].f < this.heap[smallest].f) {
                smallest = leftChild;
            }

            if (rightChild < this.heap.length && this.heap[rightChild].f < this.heap[smallest].f) {
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
}

export class TransitionGraph {
    constructor(transitionPoints, gridConfig = null) {
        // Przechowujemy punkty i ich połączenia
        this.points = new Map(); // id -> point
        this.graph = new Map();  // id -> connections
        this.gridConfig = gridConfig;
        
        // Budujemy struktury danych
        for (const point of transitionPoints) {
            this.points.set(point.id, point);
            this.graph.set(point.id, point.connections || []);
        }
    }
    
    /**
     * Główna funkcja - znajdź ścieżkę między punktami używając A*
     * @param {string} startId - ID punktu startowego
     * @param {string} endId - ID punktu końcowego
     * @returns {Array|null} - Tablica ID punktów lub null
     */
    findPath(startId, endId) {
        // Przypadek trywialny
        if (startId === endId) {
            return [startId];
        }
        
        // Sprawdzamy czy punkty istnieją
        if (!this.points.has(startId) || !this.points.has(endId)) {
            return null;
        }
        
        // Implementacja A*
        const openSet = new MinHeap();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        
        // Inicjalizujemy start
        gScore.set(startId, 0);
        openSet.push({ 
            id: startId, 
            f: this.heuristic(startId, endId) 
        });
        
        // Główna pętla A*
        while (!openSet.isEmpty()) {
            const current = openSet.pop();
            
            // Znaleźliśmy cel!
            if (current.id === endId) {
                return this.reconstructPath(cameFrom, endId);
            }
            
            closedSet.add(current.id);
            
            // Sprawdzamy wszystkie połączenia
            const connections = this.graph.get(current.id) || [];
            
            for (const connection of connections) {
                const neighbor = connection.id;
                const weight = connection.weight || 1;
                
                // Pomijamy już odwiedzone
                if (closedSet.has(neighbor)) continue;
                
                // Obliczamy nowy koszt
                const currentG = gScore.get(current.id) || 0;
                const tentativeG = currentG + weight;
                
                // Sprawdzamy czy mamy lepszą ścieżkę
                const existingG = gScore.get(neighbor);
                if (existingG !== undefined && tentativeG >= existingG) {
                    continue;
                }
                
                // Aktualizujemy ścieżkę
                cameFrom.set(neighbor, current.id);
                gScore.set(neighbor, tentativeG);
                
                // Dodajemy do kolejki priorytetowej
                openSet.push({
                    id: neighbor,
                    f: tentativeG + this.heuristic(neighbor, endId)
                });
            }
        }
        
        // Nie znaleźliśmy ścieżki
        return null;
    }
    
    /**
     * Pobierz punkty przejścia w danym chunku
     * @param {string} chunkId - ID chunka
     * @returns {Array} - Tablica punktów
     */
    getPointsInChunk(chunkId) {
        const result = [];
        for (const [id, point] of this.points) {
            if (point.chunks.includes(chunkId)) {
                result.push(point);
            }
        }
        return result;
    }
    
    /**
     * Pobierz punkt po ID
     * @param {string} pointId - ID punktu
     * @returns {Object|null} - Punkt lub null
     */
    getPoint(pointId) {
        return this.points.get(pointId) || null;
    }
    
    /**
     * Heurystyka dla A* - odległość Manhattan między chunkami
     * @param {string} pointId1 - ID pierwszego punktu
     * @param {string} pointId2 - ID drugiego punktu
     * @returns {number} - Szacowana odległość
     */
    heuristic(pointId1, pointId2) {
        const point1 = this.points.get(pointId1);
        const point2 = this.points.get(pointId2);
        
        if (!point1 || !point2) {
            return 0;
        }
        
        // Używamy pierwszego chunka z każdego punktu
        const chunk1 = this.parseChunkId(point1.chunks[0]);
        const chunk2 = this.parseChunkId(point2.chunks[0]);
        
        // Odległość Manhattan w chunkach
        const chunkDistance = Math.abs(chunk2.x - chunk1.x) + Math.abs(chunk2.y - chunk1.y);
        
        // Skalujemy jeśli mamy konfigurację
        if (this.gridConfig) {
            const scale = (this.gridConfig.chunkSize * this.gridConfig.tileSize) * 0.5;
            return chunkDistance * scale;
        }
        
        return chunkDistance;
    }
    
    /**
     * Odtwórz ścieżkę z mapy poprzedników
     * @param {Map} cameFrom - Mapa poprzedników
     * @param {string} endId - ID końca
     * @returns {Array} - Ścieżka ID punktów
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
     * @param {string} chunkId - ID w formacie "x,y"
     * @returns {Object} - {x, y}
     */
    parseChunkId(chunkId) {
        const [x, y] = chunkId.split(',').map(Number);
        return { x, y };
    }
} 