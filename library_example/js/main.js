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
import { GameDataManager } from './data/GameDataManager.js';
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
        this.gameDataManager = null;
        
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
        this.gameDataManager = new GameDataManager(this.settings.chunkSize);
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
            onCalculatePath: () => this.onCalculatePathfindingPath(),
            onBuildTransitionGraph: () => this.onBuildTransitionGraph(),
            onPrintData: () => this.onPrintGameData()
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
        
        // Wyczyść punkty pathfinding gdy generujemy nową mapę
        this.pathfindingPointManager.clearPoints();
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
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
        
        // Aktualizuj GameDataManager z punktami przejścia
        this.updateGameDataManager();
        
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
        
        // Sprawdź czy istniejące punkty pathfinding są nadal na oceanie
        this.validatePathfindingPoints();
        
        // Regeneruj punkty przejścia
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        
        // Aktualizuj GameDataManager z punktami przejścia
        this.updateGameDataManager();
        
        console.log(`✓ Applied smoothing to existing map`);
    }
    
    /**
     * WALIDUJE PUNKTY PATHFINDING I USUWA NIEWAŻNE
     */
    validatePathfindingPoints() {
        let pointsRemoved = false;
        
        // Sprawdź punkt startowy
        if (this.pathfindingPointManager.getStartPoint()) {
            const startPoint = this.pathfindingPointManager.getStartPoint();
            const tilePos = this.pathfindingPointManager.pixelToTilePosition(startPoint.pixelX, startPoint.pixelY);
            
            if (!tilePos || !this.pathfindingPointManager.isTileOcean(tilePos)) {
                console.log('⚠️ Punkt startowy nie jest już na oceanie - usuwam');
                this.pathfindingPointManager.startPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Sprawdź punkt końcowy
        if (this.pathfindingPointManager.getEndPoint()) {
            const endPoint = this.pathfindingPointManager.getEndPoint();
            const tilePos = this.pathfindingPointManager.pixelToTilePosition(endPoint.pixelX, endPoint.pixelY);
            
            if (!tilePos || !this.pathfindingPointManager.isTileOcean(tilePos)) {
                console.log('⚠️ Punkt końcowy nie jest już na oceanie - usuwam');
                this.pathfindingPointManager.endPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Zaktualizuj UI jeśli jakieś punkty zostały usunięte
        if (pointsRemoved) {
            this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        }
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
        
        // Reset punktów pathfinding
        this.pathfindingPointManager.clearPoints();
        
        // Reset ustawień UI
        this.uiController.resetToDefaults();
        
        // Regeneruj mapę
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Aktualizuj UI pathfinding po resecie
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
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
    
    /**
     * AKTUALIZUJE GAMEDATA MANAGER Z PUNKTAMI PRZEJŚCIA I BUDUJE GRAF
     */
    updateGameDataManager() {
        if (!this.gameDataManager || !this.transitionPointManager) {
            return;
        }
        
        // Wyczyść poprzednie punkty przejścia
        this.gameDataManager.transitionPoints = [];
        
        // Pobierz punkty przejścia z TransitionPointManager
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        
        // Konwertuj do nowego formatu i dodaj do GameDataManager
        transitionPoints.forEach(point => {
            // Sprawdź czy punkt ma wymagane właściwości
            if (point.chunkA && point.chunkB && point.x !== undefined && point.y !== undefined) {
                // Oblicz pozycję lokalną na podstawie kierunku
                let position;
                if (point.direction === 'vertical') {
                    position = point.x % this.settings.chunkSize;
                } else {
                    position = point.y % this.settings.chunkSize;
                }
                
                // Dodaj punkt z ID i connections
                this.gameDataManager.addTransitionPoint(point.chunkA, point.chunkB, position);
            }
        });
        
        // Graf połączeń będzie budowany na żądanie przez przycisk "Zbuduj Graf Przejść"
        // this.gameDataManager.buildConnections(this.chunks);
        
        console.log(`✓ GameDataManager updated with ${this.gameDataManager.transitionPoints.length} transition points`);
    }
    
    /**
     * BUDUJE GRAF POŁĄCZEŃ MIĘDZY PUNKTAMI PRZEJŚCIA
     */
    onBuildTransitionGraph() {
        console.log('🔗 Ręczne budowanie grafu połączeń...');
        
        // Upewnij się że mamy dane w GameDataManager
        if (!this.gameDataManager || this.gameDataManager.transitionPoints.length === 0) {
            this.pathfindingUIController.showError('Brak punktów przejścia do zbudowania grafu');
            return;
        }
        
        // Buduj graf połączeń
        this.gameDataManager.buildConnections(this.chunks);
        
        // Drukuj statystyki grafu
        this.gameDataManager.printGraphStats();
        
        // Pokaż sukces
        this.pathfindingUIController.showSuccess('Zbudowano graf połączeń');
    }

    /**
     * DRUKUJE DANE GAME DATA MANAGER W KONSOLI
     */
    onPrintGameData() {
        console.log('=== GAMEDATA MANAGER PRINT ===');
        console.log('📊 GameDataManager Object:', this.gameDataManager);
        
        console.log('\n🔗 Transition Points (New Format with IDs):');
        console.table(this.gameDataManager.transitionPoints.map(point => ({
            id: point.id,
            chunks: point.chunks.join(' ↔ '),
            position: point.position,
            connections_count: point.connections.length,
            connections: point.connections.join(', ')
        })));
        
        console.log('\n🔄 Converted to Default Format:');
        const defaultFormat = this.gameDataManager.convertTransitionPointsToDefault();
        console.table(defaultFormat);
        
        // Drukuj statystyki grafu
        this.gameDataManager.printGraphStats();
        
        console.log('\n📐 Settings:');
        console.log('- Chunk Size:', this.gameDataManager.chunkSize);
        console.log('- Total Transition Points:', this.gameDataManager.transitionPoints.length);
        
        console.log('\n📋 JSON Export (New Format):');
        console.log(JSON.stringify(this.gameDataManager.transitionPoints, null, 2));
        
        console.log('==============================');
        
        // Pokazuje też sukces w UI
        this.pathfindingUIController.showSuccess('Dane wydrukowane w konsoli');
    }
}

// Inicjalizuj aplikację gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
}); 