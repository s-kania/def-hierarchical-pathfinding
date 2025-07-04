/**
 * MAIN MAP GENERATOR - CENTRAL GENERATION LOGIC
 */

import { ISLAND_PRESETS, getIslandSizeMultiplier } from '../config/Settings.js';
import { 
    applyCellularAutomataUnified, 
    applyArchipelagoEffectUnified, 
    applyContinentEffectUnified 
} from '../algorithms/CellularAutomata.js';
import { cloneArray, createSeededRandom } from '../utils/MathUtils.js';

export class MapGenerator {
    constructor(settings, islandSettings) {
        this.settings = settings;
        this.islandSettings = islandSettings;
        this.baseMap = null;
        this.mapDimensions = { width: 0, height: 0 };

        // Initialize seed and random generator
        this.seed = settings.seed != null ? settings.seed : Date.now();
        this.random = createSeededRandom(this.seed);
    }

    /**
     * SETS NEW SEED AND UPDATES PRNG
     */
    setSeed(newSeed) {
        this.seed = newSeed;
        // Update in settings for consistency
        if (this.settings) {
            this.settings.seed = newSeed;
        }
        this.random = createSeededRandom(this.seed);
    }

    /**
     * MAIN MAP GENERATION METHOD
     * 
     * FLOW: 
     * 1. Calculate total map size (chunkCols * chunkSize x chunkRows * chunkSize)
     * 2. Generate base map -> this.baseMap (Array[width*height])
     * 3. Apply smoothing -> finalMap
     * 
     * RESULT: this.baseMap, this.mapDimensions are updated
     */
    generateMap() {
        // Calculate total map size in tiles
        const totalWidth = this.settings.chunkCols * this.settings.chunkSize;
        const totalHeight = this.settings.chunkRows * this.settings.chunkSize;
        this.mapDimensions = { width: totalWidth, height: totalHeight };
        
        // Make sure random generator is set to current seed
        if (!this.random) {
            this.random = createSeededRandom(this.seed);
        }
        
        // STEP 1: Generate base map (random noise + island size adjustment)
        // RESULT: this.baseMap = [0,1,0,1,1,0...] (width*height elements)
        this.baseMap = this.generateBaseMap(totalWidth, totalHeight);
        
        // STEP 2: Apply smoothing (cellular automata + effects)
        // INPUT: this.baseMap, OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, totalWidth, totalHeight);
        
        return finalMap;
    }

    /**
     * APPLIES SMOOTHING TO EXISTING MAP (without regenerating this.baseMap)
     * 
     * Used when only smoothing parameters change:
     * - iterations, neighborThreshold, archipelagoMode
     */
    applySmoothingToExistingMap() {
        if (!this.baseMap || !this.mapDimensions.width || !this.mapDimensions.height) {
            console.warn('No base map available, generating new map...');
            return this.generateMap();
        }
        
        // STEP 1: Apply smoothing to existing this.baseMap
        // INPUT: this.baseMap (unchanged), OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, this.mapDimensions.width, this.mapDimensions.height);

        return finalMap;
    }

    /**
     * GENERATES BASE MAP
     */
    generateBaseMap(width, height) {
        if (this.islandSettings.preset !== 'custom') {
            return this.generateBaseMapWithPreset(width, height, this.islandSettings.preset);
        } else {
            return this.generateBaseMapAdvanced(
                width,
                height,
                this.islandSettings.landDensity / 100,
                this.islandSettings.islandSize
            );
        }
    }

    /**
     * GENERATES BASE MAP WITH PRESET
     */
    generateBaseMapWithPreset(width, height, presetName) {
        const preset = ISLAND_PRESETS[presetName];
        if (!preset) {
            console.warn(`Unknown preset: ${presetName}, using default`);
            return this.generateBaseMapAdvanced(width, height, 0.35, 'medium');
        }
        
        return this.generateBaseMapAdvanced(
            width,
            height,
            preset.landDensity,
            preset.islandSize
        );
    }

    /**
     * GENERATES BASE MAP WITH ADVANCED PARAMETERS
     */
    generateBaseMapAdvanced(width, height, landDensity, islandSize) {
        // Adjust land density based on island size
        const sizeMultiplier = getIslandSizeMultiplier(islandSize);
        const adjustedLandDensity = Math.min(1.0, landDensity * sizeMultiplier);
        
        // Initial random generation based on adjusted land density
        const tiles = [];
        for (let i = 0; i < width * height; i++) {
            tiles[i] = this.random() < adjustedLandDensity ? 1 : 0;
        }
        
        return tiles;
    }

    /**
     * APPLIES SMOOTHING (CELLULAR AUTOMATA + EFFECTS)
     */
    applySmoothing(baseMap, width, height) {
        let tiles = cloneArray(baseMap); // Start with copy of base map
        
        // Apply cellular automata for specified iterations
        for (let iteration = 0; iteration < this.islandSettings.iterations; iteration++) {
            tiles = applyCellularAutomataUnified(
                tiles, 
                width, 
                height, 
                this.islandSettings.neighborThreshold, 
                this.islandSettings.archipelagoMode
            );
        }
        
        // Post-processing based on island size and archipelago mode
        if (this.islandSettings.archipelagoMode) {
            tiles = applyArchipelagoEffectUnified(tiles, width, height, this.islandSettings.islandSize);
        } else {
            tiles = applyContinentEffectUnified(tiles, width, height, this.islandSettings.islandSize);
        }
        
        return tiles;
    }

    /**
     * GETTERS FOR MAP DATA
     */
    getBaseMap() {
        return this.baseMap;
    }

    getMapDimensions() {
        return this.mapDimensions;
    }

    /**
     * UPDATES SETTINGS
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    updateIslandSettings(newIslandSettings) {
        this.islandSettings = { ...this.islandSettings, ...newIslandSettings };
    }
} 