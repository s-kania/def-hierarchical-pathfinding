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
import { PathfindingPointManager } from './pathfinding/PathfindingPointManager.js';
import { CanvasRenderer } from './rendering/CanvasRenderer.js';
import { UIController } from './ui/UIController.js';
import { PathfindingUIController } from './ui/PathfindingUIController.js';
import { Inspector } from './ui/Inspector.js';
import { getCanvasCoordinates } from './utils/MathUtils.js';

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
        this.pathfindingPointManager = null;
        this.renderer = null;
        this.uiController = null;
        this.pathfindingUIController = null;
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
        
        // Inicjalizuj pathfinding UI
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Udostępnij globalnie dla konsoli deweloperskiej
        window.mapGenerator = this;
        window.app = this;
        console.log('🎮 MapGenerator dostępny jako window.mapGenerator i window.app');
    }
    
    /**
     * INICJALIZUJE WSZYSTKIE KOMPONENTY
     */
    initializeComponents() {
        this.mapGenerator = new MapGenerator(this.settings, this.islandSettings);
        this.chunkManager = new ChunkManager(this.settings);
        this.transitionPointManager = new TransitionPointManager(this.settings, this.pathfindingSettings);
        this.pathfindingPointManager = new PathfindingPointManager(this.settings);
        this.renderer = new CanvasRenderer(this.canvas, this.settings, this.pathfindingSettings);
        this.uiController = new UIController(this.settings, this.islandSettings, this.pathfindingSettings);
        this.pathfindingUIController = new PathfindingUIController();
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
        
        // Ustaw callbacki dla pathfinding UI
        this.pathfindingUIController.setCallbacks({
            onGenerateRandomPoints: () => this.onGenerateRandomPathfindingPoints(),
            onClearPoints: () => this.onClearPathfindingPoints(),
            onCalculatePath: () => this.onCalculatePathfindingPath()
        });
        
        // Skonfiguruj event listeners
        this.uiController.setupEventListeners();
        this.pathfindingUIController.setupEventListeners();
        
        // Skonfiguruj interaktywność canvas
        this.setupCanvasInteractivity();
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
            selectedPoint,
            this.pathfindingPointManager
        );
    }
    
    /**
     * AKTUALIZUJE USTAWIENIA W KOMPONENTACH
     */
    updateComponentSettings() {
        this.mapGenerator.updateSettings(this.settings);
        this.mapGenerator.updateIslandSettings(this.islandSettings);
        this.pathfindingPointManager.updateSettings(this.settings);
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
    
    /**
     * RESETUJE DO DOMYŚLNYCH USTAWIEŃ
     */
    onReset() {
        console.log('🔄 Resetting to defaults...');
        this.uiController.resetToDefaults();
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }

    /**
     * GENERUJE LOSOWE PUNKTY PATHFINDING
     */
    onGenerateRandomPathfindingPoints() {
        console.log('🎲 Generowanie losowych punktów pathfinding...');
        const success = this.pathfindingPointManager.generateRandomPoints(this.chunks);
        
        if (success) {
            this.pathfindingUIController.showSuccess('Wygenerowano losowe punkty');
        } else {
            this.pathfindingUIController.showError('Nie można wygenerować punktów - brak wystarczającej ilości oceanu');
        }
        
        this.renderMap();
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * CZYŚCI PUNKTY PATHFINDING
     */
    onClearPathfindingPoints() {
        console.log('🗑️ Czyszczenie punktów pathfinding...');
        this.pathfindingPointManager.clearPoints();
        this.pathfindingUIController.showSuccess('Wyczyszczono punkty');
        this.renderMap();
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * OBLICZA ŚCIEŻKĘ PATHFINDING
     */
    onCalculatePathfindingPath() {
        console.log('🧭 Obliczanie ścieżki pathfinding...');
        
        if (!this.pathfindingPointManager.hasPoints()) {
            this.pathfindingUIController.showError('Brak punktów do obliczenia ścieżki');
            return;
        }
        
        // Tutaj można dodać prawdziwy algorytm pathfinding
        const distance = this.pathfindingPointManager.calculateLinearDistance();
        this.pathfindingUIController.showSuccess(`Obliczono ścieżkę: ${distance.tiles} tiles`);
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * KONFIGURUJE INTERAKTYWNOŚĆ CANVAS Z OBSŁUGĄ PATHFINDING
     */
    setupCanvasInteractivity() {
        // Obsługa ruchu myszy
        this.canvas.addEventListener('mousemove', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas);
            
            // Aktualizuj przeciąganie punktów pathfinding
            if (this.pathfindingPointManager.isDraggingPoint()) {
                const success = this.pathfindingPointManager.updateDragging(mouseX, mouseY);
                if (success) {
                    this.renderMap();
                    this.pathfindingUIController.updateAll(this.pathfindingPointManager);
                }
                return;
            }
            
            // Sprawdź czy najeżdżamy na punkt pathfinding
            const pathfindingPoint = this.pathfindingPointManager.getPointAt(mouseX, mouseY);
            if (pathfindingPoint) {
                this.canvas.style.cursor = 'grab';
                return;
            }
            
            // Sprawdź punkty przejścia (istniejąca logika)
            if (!this.pathfindingSettings.showTransitionPoints) {
                this.inspector.hideInspector();
                this.canvas.style.cursor = 'default';
                return;
            }

            const hoveredPoint = this.transitionPointManager.getTransitionPointAt(mouseX, mouseY);
            if (hoveredPoint) {
                this.inspector.setHoveredPoint(hoveredPoint);
                this.canvas.classList.add('pointer-cursor');
                this.inspector.showInspector(hoveredPoint);
                this.canvas.style.cursor = 'pointer';
            } else {
                this.inspector.setHoveredPoint(null);
                this.canvas.classList.remove('pointer-cursor');
                this.canvas.style.cursor = 'default';
                
                if (this.inspector.getSelectedPoint()) {
                    this.inspector.showInspector(this.inspector.getSelectedPoint());
                } else {
                    this.inspector.hideInspector();
                }
            }
        });

        // Obsługa kliknięć myszy
        this.canvas.addEventListener('mousedown', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas);
            
            // Sprawdź czy kliknięto na punkt pathfinding
            const pathfindingPoint = this.pathfindingPointManager.getPointAt(mouseX, mouseY);
            if (pathfindingPoint) {
                this.pathfindingPointManager.startDragging(pathfindingPoint, mouseX, mouseY);
                this.pathfindingUIController.showDraggingMessage(pathfindingPoint.type);
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            
            // Sprawdź punkty przejścia (istniejąca logika)
            if (this.pathfindingSettings.showTransitionPoints) {
                const clickedPoint = this.transitionPointManager.getTransitionPointAt(mouseX, mouseY);
                if (clickedPoint) {
                    this.inspector.setSelectedPoint(clickedPoint);
                    this.inspector.showInspector(clickedPoint);
                    this.renderMap();
                }
            }
        });

        // Obsługa puszczenia myszy
        this.canvas.addEventListener('mouseup', () => {
            if (this.pathfindingPointManager.isDraggingPoint()) {
                this.pathfindingPointManager.stopDragging();
                this.pathfindingUIController.updateAll(this.pathfindingPointManager);
                this.canvas.style.cursor = 'default';
            }
        });

        // Obsługa opuszczenia canvas
        this.canvas.addEventListener('mouseleave', () => {
            if (this.pathfindingPointManager.isDraggingPoint()) {
                this.pathfindingPointManager.stopDragging();
                this.pathfindingUIController.updateAll(this.pathfindingPointManager);
            }
            
            this.inspector.hideInspector();
            this.canvas.classList.remove('pointer-cursor');
            this.canvas.style.cursor = 'default';
        });
    }
}

// Inicjalizuj aplikację gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
}); 