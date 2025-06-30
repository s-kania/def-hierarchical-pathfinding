/**
 * Graf punktów przejścia dla hierarchical pathfinding
 * Implementuje A* na grafie pre-computed connections między punktami przejścia
 */

export class TransitionGraph {
    constructor(transitionPoints) {
        this.points = new Map(); // id -> point
        this.graph = new Map();  // id -> connections
        
        // Buduj struktury danych
        for (const point of transitionPoints) {
            this.points.set(point.id, point);
            this.graph.set(point.id, point.connections || []);
        }
    }
    
    /**
     * Znajdź ścieżkę między punktami przejścia używając A*
     * @param {string} startId - ID punktu startowego
     * @param {string} endId - ID punktu końcowego
     * @returns {Array|null} - Tablica ID punktów tworzących ścieżkę
     */
    findPath(startId, endId) {
        if (startId === endId) {
            return [startId];
        }
        
        if (!this.points.has(startId) || !this.points.has(endId)) {
            return null;
        }
        
        // Prosta implementacja PriorityQueue
        const openSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const closedSet = new Set();
        
        gScore.set(startId, 0);
        fScore.set(startId, this.heuristic(startId, endId));
        openSet.push({ id: startId, f: fScore.get(startId) });
        
        while (openSet.length > 0) {
            // Znajdź węzeł z najniższym f score
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            
            if (current.id === endId) {
                return this.reconstructPath(cameFrom, endId);
            }
            
            closedSet.add(current.id);
            
            const connections = this.graph.get(current.id) || [];
            
            for (const conn of connections) {
                if (closedSet.has(conn.id)) {
                    continue;
                }
                
                const tentativeG = gScore.get(current.id) + conn.weight;
                
                if (!gScore.has(conn.id) || tentativeG < gScore.get(conn.id)) {
                    cameFrom.set(conn.id, current.id);
                    gScore.set(conn.id, tentativeG);
                    fScore.set(conn.id, tentativeG + this.heuristic(conn.id, endId));
                    
                    // Dodaj do openSet jeśli nie ma
                    if (!openSet.find(item => item.id === conn.id)) {
                        openSet.push({ id: conn.id, f: fScore.get(conn.id) });
                    }
                }
            }
        }
        
        return null; // Brak ścieżki
    }
    
    /**
     * Pobierz wszystkie punkty przejścia w danym chunku
     * @param {string} chunkId - ID chunka
     * @returns {Array} - Tablica punktów przejścia
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
     * Pobierz punkt przejścia po ID
     * @param {string} pointId - ID punktu
     * @returns {Object|null} - Punkt przejścia lub null
     */
    getPoint(pointId) {
        return this.points.get(pointId) || null;
    }
    
    /**
     * Heurystyka dla A* - odległość Manhattan między chunkami punktów
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
        
        return Math.abs(chunk2.x - chunk1.x) + Math.abs(chunk2.y - chunk1.y);
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
} 