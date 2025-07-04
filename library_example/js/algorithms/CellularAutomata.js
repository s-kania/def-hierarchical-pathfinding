/**
 * CELLULAR AUTOMATA ALGORITHMS AND ISLAND EFFECTS
 */

import { 
    countNeighborsUnified, 
    countOceanNeighborsUnified, 
    countLandNeighborsUnified,
    cloneArray 
} from '../utils/MathUtils.js';

/**
 * APPLIES CELLULAR AUTOMATA
 */
export function applyCellularAutomataUnified(tiles, width, height, threshold, archipelagoMode) {
    const newTiles = cloneArray(tiles);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const neighbors = countNeighborsUnified(tiles, x, y, width, height);
            
            if (archipelagoMode) {
                // More aggressive for archipelago - creates more fragmented islands
                if (neighbors >= threshold) {
                    newTiles[index] = 1; // Island
                } else if (neighbors <= (threshold - 3)) {
                    newTiles[index] = 0; // Ocean
                }
            } else {
                // Standard rules for continent mode
                if (neighbors >= threshold) {
                    newTiles[index] = 1; // Island
                } else if (neighbors <= (threshold - 2)) {
                    newTiles[index] = 0; // Ocean
                }
            }
        }
    }
    
    return newTiles;
}

/**
 * APPLIES ARCHIPELAGO EFFECT
 */
export function applyArchipelagoEffectUnified(tiles, width, height, islandSize) {
    // For archipelago mode, apply some erosion to create more separate islands
    if (islandSize === 'small') {
        // More aggressive erosion for small islands
        return applyErosionUnified(tiles, width, height, 2);
    } else if (islandSize === 'medium') {
        return applyErosionUnified(tiles, width, height, 1);
    }
    return tiles; // Large islands don't need erosion in archipelago mode
}

/**
 * APPLIES CONTINENT EFFECT
 */
export function applyContinentEffectUnified(tiles, width, height, islandSize) {
    // For continent mode, apply dilation to create larger connected landmasses
    if (islandSize === 'large') {
        return applyDilationUnified(tiles, width, height, 2);
    } else if (islandSize === 'medium') {
        return applyDilationUnified(tiles, width, height, 1);
    }
    return tiles; // Small islands don't need dilation in continent mode
}

/**
 * APPLIES EROSION (REDUCES ISLANDS)
 */
export function applyErosionUnified(tiles, width, height, intensity) {
    let result = cloneArray(tiles);
    
    for (let i = 0; i < intensity; i++) {
        const newTiles = cloneArray(result);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (result[index] === 1) {
                    const oceanNeighbors = countOceanNeighborsUnified(result, x, y, width, height);
                    if (oceanNeighbors >= 3) {
                        newTiles[index] = 0; // Erode to ocean
                    }
                }
            }
        }
        
        result = newTiles;
    }
    
    return result;
}

/**
 * APPLIES DILATION (EXPANDS ISLANDS)
 */
export function applyDilationUnified(tiles, width, height, intensity) {
    let result = cloneArray(tiles);
    
    for (let i = 0; i < intensity; i++) {
        const newTiles = cloneArray(result);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                if (result[index] === 0) {
                    const landNeighbors = countLandNeighborsUnified(result, x, y, width, height);
                    if (landNeighbors >= 2) {
                        newTiles[index] = 1; // Expand land
                    }
                }
            }
        }
        
        result = newTiles;
    }
    
    return result;
} 