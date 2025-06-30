/**
 * Uproszczone narzędzia współrzędnych dla hierarchical pathfinding
 * Zawiera tylko niezbędne funkcje zgodnie z zasadą KISS
 */

export class CoordUtils {
    /**
     * Konwertuj globalną pozycję na ID chunka
     * @param {Object} globalPos - Pozycja globalna {x, y}
     * @param {number} chunkSize - Rozmiar chunka w kafelkach
     * @param {number} tileSize - Rozmiar kafelka w jednostkach świata
     * @returns {string} - ID chunka "x,y"
     */
    static globalToChunkId(globalPos, chunkSize, tileSize) {
        const chunkWorldSize = chunkSize * tileSize;
        const chunkX = Math.floor(globalPos.x / chunkWorldSize);
        const chunkY = Math.floor(globalPos.y / chunkWorldSize);
        return `${chunkX},${chunkY}`;
    }
    
    /**
     * Konwertuj globalną pozycję na lokalną w obrębie chunka
     * @param {Object} globalPos - Pozycja globalna {x, y}
     * @param {string} chunkId - ID chunka
     * @param {number} chunkSize - Rozmiar chunka w kafelkach
     * @param {number} tileSize - Rozmiar kafelka w jednostkach świata
     * @returns {Object} - Pozycja lokalna {x, y}
     */
    static globalToLocal(globalPos, chunkId, chunkSize, tileSize) {
        const chunkCoords = this.chunkIdToCoords(chunkId);
        const chunkWorldSize = chunkSize * tileSize;
        
        const localX = Math.floor((globalPos.x - chunkCoords.x * chunkWorldSize) / tileSize);
        const localY = Math.floor((globalPos.y - chunkCoords.y * chunkWorldSize) / tileSize);
        
        // Clamp do granic chunka
        return {
            x: Math.max(0, Math.min(chunkSize - 1, localX)),
            y: Math.max(0, Math.min(chunkSize - 1, localY))
        };
    }
    
    /**
     * Konwertuj lokalną pozycję na globalną
     * @param {Object} localPos - Pozycja lokalna {x, y}
     * @param {string} chunkId - ID chunka
     * @param {number} chunkSize - Rozmiar chunka w kafelkach
     * @param {number} tileSize - Rozmiar kafelka w jednostkach świata
     * @returns {Object} - Pozycja globalna {x, y, z}
     */
    static localToGlobal(localPos, chunkId, chunkSize, tileSize) {
        const chunkCoords = this.chunkIdToCoords(chunkId);
        const chunkWorldSize = chunkSize * tileSize;
        
        return {
            x: chunkCoords.x * chunkWorldSize + localPos.x * tileSize + tileSize / 2,
            y: chunkCoords.y * chunkWorldSize + localPos.y * tileSize + tileSize / 2,
            z: 0
        };
    }
    
    /**
     * Konwertuj ID chunka na współrzędne
     * @param {string} chunkId - ID chunka "x,y"
     * @returns {Object} - Współrzędne chunka {x, y}
     */
    static chunkIdToCoords(chunkId) {
        const [x, y] = chunkId.split(',').map(Number);
        return { x, y };
    }
    
    /**
     * Konwertuj współrzędne chunka na ID
     * @param {number} x - Współrzędna X chunka
     * @param {number} y - Współrzędna Y chunka
     * @returns {string} - ID chunka "x,y"
     */
    static coordsToChunkId(x, y) {
        return `${x},${y}`;
    }
    
    /**
     * Oblicz pozycję punktu przejścia w chunku
     * @param {Object} point - Punkt przejścia
     * @param {string} chunkId - ID chunka
     * @param {number} chunkSize - Rozmiar chunka
     * @returns {Object|null} - Pozycja lokalna {x, y} lub null
     */
    static getTransitionLocalPosition(point, chunkId, chunkSize) {
        if (!point.chunks.includes(chunkId)) {
            return null;
        }
        
        // Znajdź drugi chunk do określenia kierunku
        const otherChunkId = point.chunks.find(id => id !== chunkId);
        if (!otherChunkId) {
            return null;
        }
        
        const coords = this.chunkIdToCoords(chunkId);
        const otherCoords = this.chunkIdToCoords(otherChunkId);
        
        // Określ pozycję na krawędzi chunka
        if (otherCoords.x > coords.x) {
            // Połączenie na prawej krawędzi
            return { x: chunkSize - 1, y: point.position };
        } else if (otherCoords.x < coords.x) {
            // Połączenie na lewej krawędzi
            return { x: 0, y: point.position };
        } else if (otherCoords.y > coords.y) {
            // Połączenie na dolnej krawędzi
            return { x: point.position, y: chunkSize - 1 };
        } else if (otherCoords.y < coords.y) {
            // Połączenie na górnej krawędzi
            return { x: point.position, y: 0 };
        }
        
        return null;
    }
    
    /**
     * Oblicz globalną pozycję punktu przejścia
     * @param {Object} point - Punkt przejścia
     * @param {string} chunkId - ID chunka
     * @param {number} chunkSize - Rozmiar chunka w kafelkach
     * @param {number} tileSize - Rozmiar kafelka w jednostkach świata
     * @returns {Object|null} - Pozycja globalna {x, y, z} lub null
     */
    static getTransitionGlobalPosition(point, chunkId, chunkSize, tileSize) {
        const localPos = this.getTransitionLocalPosition(point, chunkId, chunkSize);
        if (!localPos) {
            return null;
        }
        
        return this.localToGlobal(localPos, chunkId, chunkSize, tileSize);
    }
} 