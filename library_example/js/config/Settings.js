/**
 * KONFIGURACJA I PRESETY - CENTRALNE MIEJSCE USTAWIEŃ
 */

export const DEFAULT_SETTINGS = {
    chunkCols: 8,        // Liczba chunków w poziomie
    chunkRows: 6,        // Liczba chunków w pionie  
    chunkSize: 11,        // Rozmiar chunka (6x6 tiles)
    tileSize: 16         // Rozmiar tile w pikselach
};

export const DEFAULT_ISLAND_SETTINGS = {
    preset: 'archipelago',      // Preset: archipelago/continent/scattered/dense
    landDensity: 27,            // Gęstość lądu w % (wpływa na bazową mapę)
    iterations: 4,              // Iteracje smoothing (cellular automata)
    neighborThreshold: 4,       // Próg sąsiadów dla smoothing
    archipelagoMode: true,      // Tryb archipelagu vs kontynent
    islandSize: 'medium'        // Rozmiar wysp: small/medium/large
};

export const DEFAULT_PATHFINDING_SETTINGS = {
    maxTransitionPoints: 3,     // Maksymalna liczba punktów przejścia per granica
    showTransitionPoints: true, // Pokazuj punkty przejścia na mapie
    transitionPointScale: 1.0   // Skala rozmiaru punktów przejścia
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
    GAP_SIZE: 4,        // Przerwa między chunkami w pikselach
    CANVAS_PADDING: 20, // Padding canvas
    MIN_POINT_RADIUS: 6,
    TILE_BORDER_MIN_SIZE: 16
};

/**
 * ZWRACA MNOŻNIK ROZMIARU WYSP
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
 * KAPITALIZUJE PIERWSZY ZNAK
 */
export function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
} 