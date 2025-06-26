/**
 * GŁÓWNA APLIKACJA - ŁĄCZY WSZYSTKIE MODUŁY
 */

import { 
    DEFAULT_SETTINGS, 
    DEFAULT_ISLAND_SETTINGS, 
    DEFAULT_PATHFINDING_SETTINGS 
} from './config/Settings.js';

import { MapGenerator } from './core/MapGenerator.js';
import { ChunkManager } from './core/ChunkManager.js';
import { TransitionPointManager } from './pathfinding/TransitionPointManager.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { UIController } from './ui/UIController.js';
import { Inspector } from './ui/Inspector.js';

/**
 * GŁÓWNA KLASA APLIKACJI
 */
class ChunkMapGenerator {
    constructor() {
        // Ustawienia
        this.settings = { ...DEFAULT_SETTINGS };
        this.islandSettings = { ...DEFAULT_ISLAND_SETTINGS };
        this.pathfindingSettings = { ...DEFAULT_PATHFINDING_SETTINGS };
        
        // Główne dane aplikacji
        this.chunks = [];
        this.baseMap = null;
        this.mapDimensions = { width: 0, height: 0 };
        
        // Komponenty
        this.mapGenerator = null;
        this.chunkManager = null;
        this.transitionPointManager = null;
        this.renderer = null;
        this.uiController = null;
        this.inspector = null;
        
        // Elementy DOM
        this.canvas = null;
        this.inspectorPanel = null;
        
        this.init();
    }
    
    init() {
        // Inicjalizuj elementy DOM
        this.canvas = document.getElementById('mapCanvas');
        this.inspectorPanel = document.getElementById('transitionPointDetails');
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        // Inicjalizuj komponenty
        this.initializeComponents();
        
        // Skonfiguruj UI
        this.setupUI();
        
        // Wygeneruj początkową mapę
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Udostępnij globalnie dla konsoli deweloperskiej
        window.mapGenerator = this;
        console.log('🎮 MapGenerator dostępny jako window.mapGenerator');
    }
    
    /**
     * INICJALIZUJE WSZYSTKIE KOMPONENTY
     */
    initializeComponents() {
        this.mapGenerator = new MapGenerator(this.settings, this.islandSettings);
        this.chunkManager = new ChunkManager(this.settings);
        this.transitionPointManager = new TransitionPointManager(this.settings, this.pathfindingSettings);
        this.renderer = new CanvasRenderer(this.canvas, this.settings, this.pathfindingSettings);
        this.uiController = new UIController(this.settings, this.islandSettings, this.pathfindingSettings);
        this.inspector = new Inspector(this.inspectorPanel);
    }
    
    /**
     * KONFIGURUJE INTERFEJS UŻYTKOWNIKA
     */
    setupUI() {
        // Ustaw callbacki dla UI controllera
        this.uiController.setCallbacks({
            onFullRegenerationNeeded: () => this.onFullRegeneration(),
            onSmoothingOnlyNeeded: () => this.onSmoothingOnly(),
            onRenderOnlyNeeded: () => this.onRenderOnly(),
            onPathfindingUpdate: () => this.onPathfindingUpdate(),
            onExportPNG: () => this.onExportPNG(),
            onReset: () => this.onReset()
        });
        
        // Skonfiguruj event listeners
        this.uiController.setupEventListeners();
        
        // Skonfiguruj interaktywność canvas
        this.uiController.setupCanvasInteractivity(
            this.canvas, 
            this.inspector, 
            this.transitionPointManager
        );
    }
    
    /**
     * GŁÓWNA METODA GENEROWANIA MAPY
     */
    generateMap() {
        console.log('🗺️ Generating unified map...');
        
        // Aktualizuj ustawienia w komponentach
        this.updateComponentSettings();
        
        // Generuj mapę
        const finalMap = this.mapGenerator.generateMap();
        
        // Podziel na chunki
        this.chunks = this.chunkManager.splitMapIntoChunks(
            finalMap, 
            this.mapGenerator.getMapDimensions().width, 
            this.mapGenerator.getMapDimensions().height
        );
        
        // Generuj punkty przejścia
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        
        // Zapisz referencje dla kompatybilności
        this.baseMap = this.mapGenerator.getBaseMap();
        this.mapDimensions = this.mapGenerator.getMapDimensions();
        
        console.log(`✓ Generated ${this.chunks.length} chunks from unified map`);
    }
    
    /**
     * APLIKUJE TYLKO SMOOTHING (OPTYMALIZACJA)
     */
    applySmoothingToExistingMap() {
        console.log('🔄 Applying smoothing to existing map...');
        
        // Aktualizuj ustawienia
        this.updateComponentSettings();
        
        // Aplikuj smoothing
        const finalMap = this.mapGenerator.applySmoothingToExistingMap();
        
        // Podziel na chunki
        this.chunks = this.chunkManager.splitMapIntoChunks(
            finalMap,
            this.mapGenerator.getMapDimensions().width,
            this.mapGenerator.getMapDimensions().height
        );
        
        // Regeneruj punkty przejścia
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        
        console.log(`✓ Applied smoothing to existing map`);
    }
    
    /**
     * RENDERUJE MAPĘ
     */
    renderMap() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        const selectedPoint = this.inspector.getSelectedPoint();
        
        this.renderer.renderMap(
            this.chunks, 
            this.chunkManager, 
            transitionPoints, 
            selectedPoint
        );
    }
    
    /**
     * AKTUALIZUJE USTAWIENIA W KOMPONENTACH
     */
    updateComponentSettings() {
        this.mapGenerator.updateSettings(this.settings);
        this.mapGenerator.updateIslandSettings(this.islandSettings);
        this.renderer.updateSettings(this.settings);
        this.renderer.updatePathfindingSettings(this.pathfindingSettings);
    }
    
    /**
     * AKTUALIZUJE STATYSTYKI
     */
    updateStats() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        this.uiController.updateStats(this.chunks, transitionPoints);
    }
    
    /**
     * CALLBACKI UI
     */
    onFullRegeneration() {
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
    
    onSmoothingOnly() {
        this.applySmoothingToExistingMap();
        this.renderMap();
        this.updateStats();
    }
    
    onRenderOnly() {
        this.updateComponentSettings();
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        this.renderMap();
    }
    
    onPathfindingUpdate() {
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        this.renderMap();
        this.updateStats();
    }
    
    onExportPNG() {
        this.renderer.exportToPNG(
            this.islandSettings.preset, 
            this.settings.chunkCols, 
            this.settings.chunkRows
        );
    }
    
    onReset() {
        // Reset punktów przejścia
        this.inspector.clearSelection();
        
        // Reset ustawień
        this.uiController.resetToDefaults();
        
        // Pełna regeneracja
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
}

// Inicjalizuj aplikację gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
}); 