/**
 * GŁÓWNY GENERATOR MAP - CENTRALNA LOGIKA GENEROWANIA
 */

import { ISLAND_PRESETS, getIslandSizeMultiplier } from '../config/Settings.js';
import { 
    applyCellularAutomataUnified, 
    applyArchipelagoEffectUnified, 
    applyContinentEffectUnified 
} from '../algorithms/CellularAutomata.js';
import { cloneArray } from '../utils/MathUtils.js';

export class MapGenerator {
    constructor(settings, islandSettings) {
        this.settings = settings;
        this.islandSettings = islandSettings;
        this.baseMap = null;
        this.mapDimensions = { width: 0, height: 0 };
    }

    /**
     * GŁÓWNA METODA GENEROWANIA MAPY
     * 
     * FLOW: 
     * 1. Oblicza rozmiar całej mapy (chunkCols * chunkSize x chunkRows * chunkSize)
     * 2. Generuje bazową mapę -> this.baseMap (Array[width*height])
     * 3. Aplikuje smoothing -> finalMap
     * 
     * WYNIK: this.baseMap, this.mapDimensions są zaktualizowane
     */
    generateMap() {
        // Oblicz rozmiar całej mapy w tiles
        const totalWidth = this.settings.chunkCols * this.settings.chunkSize;
        const totalHeight = this.settings.chunkRows * this.settings.chunkSize;
        this.mapDimensions = { width: totalWidth, height: totalHeight };
        
        // KROK 1: Generuj bazową mapę (random noise + island size adjustment)
        // REZULTAT: this.baseMap = [0,1,0,1,1,0...] (width*height elementów)
        this.baseMap = this.generateBaseMap(totalWidth, totalHeight);
        
        // KROK 2: Aplikuj smoothing (cellular automata + effects)
        // INPUT: this.baseMap, OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, totalWidth, totalHeight);
        
        return finalMap;
    }

    /**
     * APLIKUJE SMOOTHING DO ISTNIEJĄCEJ MAPY (bez regeneracji this.baseMap)
     * 
     * Używane gdy zmieniają się tylko parametry smoothing:
     * - iterations, neighborThreshold, archipelagoMode
     */
    applySmoothingToExistingMap() {
        if (!this.baseMap || !this.mapDimensions.width || !this.mapDimensions.height) {
            console.warn('No base map available, generating new map...');
            return this.generateMap();
        }
        
        // KROK 1: Aplikuj smoothing do istniejącej this.baseMap
        // INPUT: this.baseMap (niezmieniona), OUTPUT: finalMap
        const finalMap = this.applySmoothing(this.baseMap, this.mapDimensions.width, this.mapDimensions.height);

        return finalMap;
    }

    /**
     * GENERUJE BAZOWĄ MAPĘ
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
     * GENERUJE BAZOWĄ MAPĘ Z PRESETEM
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
     * GENERUJE BAZOWĄ MAPĘ Z ZAAWANSOWANYMI PARAMETRAMI
     */
    generateBaseMapAdvanced(width, height, landDensity, islandSize) {
        // Adjust land density based on island size
        const sizeMultiplier = getIslandSizeMultiplier(islandSize);
        const adjustedLandDensity = Math.min(1.0, landDensity * sizeMultiplier);
        
        // Initial random generation based on adjusted land density
        const tiles = [];
        for (let i = 0; i < width * height; i++) {
            tiles[i] = Math.random() < adjustedLandDensity ? 1 : 0;
        }
        
        return tiles;
    }

    /**
     * APLIKUJE SMOOTHING (CELLULAR AUTOMATA + EFFECTS)
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
     * GETTERY DLA DANYCH MAPY
     */
    getBaseMap() {
        return this.baseMap;
    }

    getMapDimensions() {
        return this.mapDimensions;
    }

    /**
     * AKTUALIZUJE USTAWIENIA
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    updateIslandSettings(newIslandSettings) {
        this.islandSettings = { ...this.islandSettings, ...newIslandSettings };
    }
} 