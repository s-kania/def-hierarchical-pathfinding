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
    localHeuristic: 'manhattan', // Local heuristic: 'manhattan', 'euclidean'
    hierarchicalHeuristic: 'manhattan', // Hierarchical heuristic: 'manhattan', 'euclidean'
    heuristicWeight: 1.0        // Heuristic weight (1.0 = admissible, >1.0 = weighted A*)
};

// Available algorithms and heuristics
export const PATHFINDING_ALGORITHMS = {
    astar: 'A* (A-Star)',
    jps: 'JPS (Jump Point Search)'
};

export const PATHFINDING_HEURISTICS = {
    manhattan: 'Manhattan Distance',
    euclidean: 'Euclidean Distance'
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

/**
 * LOCAL STORAGE SETTINGS MANAGEMENT
 */

// Storage keys
const STORAGE_KEYS = {
    MAP_SEED: 'mapSeed',
    MAP_SETTINGS: 'mapSettings',
    ISLAND_SETTINGS: 'islandSettings',
    PATHFINDING_SETTINGS: 'pathfindingSettings',
    SETTINGS_VERSION: 'settingsVersion'
};

// Current settings version for compatibility
const CURRENT_SETTINGS_VERSION = '1.0';

/**
 * Saves all settings to localStorage
 */
export function saveSettingsToLocalStorage(settings, islandSettings, pathfindingSettings) {
    try {
        // Save individual settings
        localStorage.setItem(STORAGE_KEYS.MAP_SETTINGS, JSON.stringify(settings));
        localStorage.setItem(STORAGE_KEYS.ISLAND_SETTINGS, JSON.stringify(islandSettings));
        localStorage.setItem(STORAGE_KEYS.PATHFINDING_SETTINGS, JSON.stringify(pathfindingSettings));
        localStorage.setItem(STORAGE_KEYS.SETTINGS_VERSION, CURRENT_SETTINGS_VERSION);
        
        console.log('✅ Settings saved to localStorage');
        return true;
    } catch (error) {
        console.error('❌ Failed to save settings to localStorage:', error);
        return false;
    }
}

/**
 * Loads all settings from localStorage
 */
export function loadSettingsFromLocalStorage() {
    try {
        const version = localStorage.getItem(STORAGE_KEYS.SETTINGS_VERSION);
        
        // Check if we have saved settings
        if (!version) {
            console.log('ℹ️ No saved settings found, using defaults');
            return null;
        }
        
        // Load settings
        const mapSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.MAP_SETTINGS) || '{}');
        const islandSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.ISLAND_SETTINGS) || '{}');
        const pathfindingSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATHFINDING_SETTINGS) || '{}');
        
        console.log('✅ Settings loaded from localStorage:', {
            mapSettings,
            islandSettings,
            pathfindingSettings,
            version
        });
        
        return {
            mapSettings,
            islandSettings,
            pathfindingSettings,
            version
        };
    } catch (error) {
        console.error('❌ Failed to load settings from localStorage:', error);
        return null;
    }
}

/**
 * Merges loaded settings with defaults to ensure all fields are present
 */
export function mergeSettingsWithDefaults(loadedSettings) {
    if (!loadedSettings) {
        console.log('🔄 Using default settings');
        return {
            mapSettings: { ...DEFAULT_SETTINGS },
            islandSettings: { ...DEFAULT_ISLAND_SETTINGS },
            pathfindingSettings: { ...DEFAULT_PATHFINDING_SETTINGS }
        };
    }
    
    const mergedSettings = {
        mapSettings: { ...DEFAULT_SETTINGS, ...loadedSettings.mapSettings },
        islandSettings: { ...DEFAULT_ISLAND_SETTINGS, ...loadedSettings.islandSettings },
        pathfindingSettings: { ...DEFAULT_PATHFINDING_SETTINGS, ...loadedSettings.pathfindingSettings }
    };
    
    console.log('🔄 Merged settings with defaults:', mergedSettings);
    
    return mergedSettings;
}

/**
 * Clears all settings from localStorage
 */
export function clearSettingsFromLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEYS.MAP_SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.ISLAND_SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.PATHFINDING_SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS_VERSION);
        // Note: We keep mapSeed as it's handled separately
        
        console.log('🗑️ Settings cleared from localStorage');
        return true;
    } catch (error) {
        console.error('❌ Failed to clear settings from localStorage:', error);
        return false;
    }
}

/**
 * Checks if settings are saved in localStorage
 */
export function hasSavedSettings() {
    return localStorage.getItem(STORAGE_KEYS.SETTINGS_VERSION) !== null;
}

/**
 * Exports current settings as JSON string
 */
export function exportSettingsAsJSON(settings, islandSettings, pathfindingSettings) {
    const exportData = {
        version: CURRENT_SETTINGS_VERSION,
        timestamp: new Date().toISOString(),
        mapSettings: settings,
        islandSettings: islandSettings,
        pathfindingSettings: pathfindingSettings
    };
    
    return JSON.stringify(exportData, null, 2);
}

/**
 * Imports settings from JSON string
 */
export function importSettingsFromJSON(jsonString) {
    try {
        const importData = JSON.parse(jsonString);
        
        // Validate structure
        if (!importData.mapSettings || !importData.islandSettings || !importData.pathfindingSettings) {
            throw new Error('Invalid settings format');
        }
        
        return {
            mapSettings: importData.mapSettings,
            islandSettings: importData.islandSettings,
            pathfindingSettings: importData.pathfindingSettings
        };
    } catch (error) {
        console.error('❌ Failed to import settings from JSON:', error);
        return null;
    }
} 