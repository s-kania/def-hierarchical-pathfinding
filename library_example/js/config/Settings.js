/**
 * CONFIGURATION AND PRESETS - CENTRAL SETTINGS LOCATION
 */

export const DEFAULT_SETTINGS = {
    chunkCols: 8,        // Number of chunks horizontally
    chunkRows: 6,        // Number of chunks vertically  
    chunkSize: 11,        // Chunk size (6x6 tiles)
    tileSize: 16,         // Tile size in pixels
    seed: null           // Map generation seed (null = random)
};

export const DEFAULT_ISLAND_SETTINGS = {
    preset: 'archipelago',      // Preset: archipelago/continent/scattered/dense
    landDensity: 27,            // Land density in % (affects base map)
    iterations: 4,              // Smoothing iterations (cellular automata)
    neighborThreshold: 4,       // Neighbor threshold for smoothing
    archipelagoMode: true,      // Archipelago vs continent mode
    islandSize: 'medium'        // Island size: small/medium/large
};

export const DEFAULT_PATHFINDING_SETTINGS = {
    maxTransitionPoints: 3,     // Maximum number of transition points per border
    showTransitionPoints: true, // Show transition points on map
    showConnectionWeights: true, // Show connection weights on lines
    transitionPointScale: 1.0,  // Scale of transition point size
    pathfindingPointScale: 2.0, // Scale of pathfinding cross size
    showDebugLabels: false,     // Show segment numbers on path
    
    // NEW: Algorithm and heuristic settings
    localAlgorithm: 'astar',    // Local pathfinding algorithm: 'astar' or 'jps'
    localHeuristic: 'manhattan', // Local heuristic: 'manhattan', 'euclidean', 'diagonal', 'octile'
    hierarchicalHeuristic: 'manhattan', // Hierarchical heuristic: 'manhattan', 'euclidean', 'diagonal', 'octile'
    heuristicWeight: 1.0        // Heuristic weight (1.0 = admissible, >1.0 = weighted A*)
};

// Available algorithms and heuristics
export const PATHFINDING_ALGORITHMS = {
    astar: 'A* (A-Star)',
    jps: 'JPS (Jump Point Search)'
};

export const PATHFINDING_HEURISTICS = {
    manhattan: 'Manhattan Distance',
    euclidean: 'Euclidean Distance', 
    diagonal: 'Diagonal Distance',
    octile: 'Octile Distance'
};

export const ISLAND_PRESETS = {
    archipelago: {
        landDensity: 0.27,
        iterations: 4,
        neighborThreshold: 4,
        archipelagoMode: true,
        islandSize: 'medium'
    },
    continent: {
        landDensity: 0.55,
        iterations: 3,
        neighborThreshold: 3,
        archipelagoMode: false,
        islandSize: 'large'
    },
    scattered: {
        landDensity: 0.25,
        iterations: 2,
        neighborThreshold: 5,
        archipelagoMode: true,
        islandSize: 'small'
    },
    dense: {
        landDensity: 0.70,
        iterations: 5,
        neighborThreshold: 2,
        archipelagoMode: false,
        islandSize: 'large'
    }
};

export const COLORS = {
    ocean: '#0066cc',
    island: '#228b22',
    chunkBorder: '#333333',
    chunkBackground: '#f0f0f0',
    transitionPoint: '#ff6b6b'
};

export const RENDER_CONSTANTS = {
    GAP_SIZE: 4,        // Gap between chunks in pixels
    CANVAS_PADDING: 20, // Canvas padding
    MIN_POINT_RADIUS: 6,
    TILE_BORDER_MIN_SIZE: 16
};

/**
 * RETURNS ISLAND SIZE MULTIPLIER
 */
export function getIslandSizeMultiplier(islandSize) {
    switch (islandSize) {
        case 'small': return 0.7;
        case 'medium': return 1.0;
        case 'large': return 1.3;
        default: return 1.0;
    }
}

/**
 * CAPITALIZES FIRST CHARACTER
 */
export function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
} 