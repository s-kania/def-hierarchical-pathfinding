/**
 * MATHEMATICAL AND HELPER UTILITIES
 */

/**
 * COUNTS TILE NEIGHBORS (UNIFIED)
 */
export function countNeighborsUnified(tiles, x, y, width, height) {
    let count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            // Treat out-of-bounds as ocean
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                continue;
            }
            
            const index = ny * width + nx;
            if (tiles[index] === 1) {
                count++;
            }
        }
    }
    
    return count;
}

/**
 * COUNTS OCEAN NEIGHBORS
 */
export function countOceanNeighborsUnified(tiles, x, y, width, height) {
    let count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            // Treat out-of-bounds as ocean
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                count++;
                continue;
            }
            
            const index = ny * width + nx;
            if (tiles[index] === 0) {
                count++;
            }
        }
    }
    
    return count;
}

/**
 * COUNTS LAND NEIGHBORS
 */
export function countLandNeighborsUnified(tiles, x, y, width, height) {
    let count = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            
            // Treat out-of-bounds as ocean
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                continue;
            }
            
            const index = ny * width + nx;
            if (tiles[index] === 1) {
                count++;
            }
        }
    }
    
    return count;
}

/**
 * CONVERTS MOUSE COORDINATES TO CANVAS
 */
export function getCanvasCoordinates(e, canvas, renderer = null) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;
    
    // If renderer has zoom/pan, convert to canvas coordinates
    if (renderer && renderer.zoom !== 1.0) {
        const canvasCoords = renderer.screenToCanvas(mouseX, mouseY);
        mouseX = canvasCoords.x;
        mouseY = canvasCoords.y;
    }
    
    return { mouseX, mouseY, rect, scaleX, scaleY };
}

/**
 * CALCULATES DISTANCE BETWEEN TWO POINTS
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * CLONES ARRAY (SHALLOW COPY)
 */
export function cloneArray(array) {
    return [...array];
}

/**
 * CREATES RANDOM FUNCTION WITH GIVEN SEED (Mulberry32)
 * Returns function generating numbers from range [0,1).
 */
export function createSeededRandom(seed) {
    // Convert to 32-bit unsigned int
    let a = (seed >>> 0) || 0;
    return function () {
        // Mulberry32 PRNG
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
} 