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
import { HierarchicalPathfinding } from '../hierarchical_pathfinding/HierarchicalPathfinding.js';

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
        this.pathSegments = null; // Segmenty obliczonej ścieżki pathfinding
        
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
        
        // Modal i zakładki
        this.settingsModal = null;
        this.currentTab = 'map-config';
        
        this.init();
    }
    
    init() {
        // Inicjalizuj elementy DOM
        this.canvas = document.getElementById('mapCanvas');
        this.inspectorPanel = document.getElementById('transitionPointDetails');
        this.settingsModal = document.getElementById('settingsModal');
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        // Inicjalizuj komponenty
        this.initializeComponents();
        
        // Skonfiguruj UI
        this.setupUI();
        
        // Skonfiguruj modal i zakładki
        this.setupModalAndTabs();
        
        // Wygeneruj początkową mapę
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Inicjalizuj pathfinding UI
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Udostępnij globalnie dla konsoli deweloperskiej
        window.mapGenerator = this;
        window.app = this;
        window.gameDataManager = this.gameDataManager;
        console.log('🎮 MapGenerator dostępny jako window.mapGenerator i window.app');
        console.log('📊 GameDataManager dostępny jako window.gameDataManager');
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
        this.gameDataManager = new GameDataManager(
            this.settings.chunkCols, 
            this.settings.chunkRows,
            this.settings.chunkSize,  // chunkWidth
            this.settings.chunkSize   // chunkHeight (dla kwadratowych chunków)
        );
        this.inspector = new Inspector(this.inspectorPanel, this.gameDataManager);
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
            onPrintData: () => this.onPrintGameData()
        });
        
        // Skonfiguruj event listeners
        this.uiController.setupEventListeners();
        this.pathfindingUIController.setupEventListeners();
        
        // Skonfiguruj interaktywność canvas
        this.setupCanvasInteractivity();
    }
    
    /**
     * KONFIGURUJE MODAL I ZAKŁADKI
     */
    setupModalAndTabs() {
        // Przycisk Settings
        const settingsBtn = document.getElementById('settingsBtn');
        const closeModalBtn = document.getElementById('closeSettingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        
        // Zamknij modal po kliknięciu poza nim
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }
        
        // Zakładki
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Zamknij modal po naciśnięciu Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal.classList.contains('show')) {
                this.closeSettingsModal();
            }
        });
        
        // Przycisk "Oblicz ścieżkę" w głównym layout
        this.setupCalculatePathButton();
    }
    
    /**
     * OTWIERA MODAL SETTINGS
     */
    openSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Zablokuj scrollowanie strony
        }
    }
    
    /**
     * ZAMYKA MODAL SETTINGS
     */
    closeSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('show');
            document.body.style.overflow = ''; // Przywróć scrollowanie strony
        }
    }
    
    /**
     * PRZEŁĄCZA ZAKŁADKĘ
     */
    switchTab(tabName) {
        // Usuń aktywną klasę ze wszystkich przycisków i paneli
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Dodaj aktywną klasę do wybranej zakładki
        const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activeTabPane = document.getElementById(tabName);
        
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }
        if (activeTabPane) {
            activeTabPane.classList.add('active');
        }
        
        this.currentTab = tabName;
    }
    
    /**
     * GŁÓWNA METODA GENEROWANIA MAPY
     */
    generateMap() {

        
        // Aktualizuj ustawienia w komponentach
        this.updateComponentSettings();
        
        // Wyczyść punkty pathfinding i ścieżkę gdy generujemy nową mapę
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null;
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
        
        // Automatycznie zbuduj graf połączeń
        if (this.gameDataManager.transitionPoints.length > 0) {
            this.gameDataManager.buildConnections(this.chunks);
        }
        
        // Automatycznie wygeneruj losowe punkty pathfinding
        this.generateRandomPathfindingPoints();
        
        // Aktualizuj UI po automatycznym generowaniu punktów
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Zapisz referencje dla kompatybilności
        this.baseMap = this.mapGenerator.getBaseMap();
        this.mapDimensions = this.mapGenerator.getMapDimensions();
    }
    
    /**
     * APLIKUJE TYLKO SMOOTHING (OPTYMALIZACJA)
     */
    applySmoothingToExistingMap() {
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
        
        // Automatycznie zbuduj graf połączeń
        if (this.gameDataManager.transitionPoints.length > 0) {
            this.gameDataManager.buildConnections(this.chunks);
        }
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
                this.pathfindingPointManager.startPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Sprawdź punkt końcowy
        if (this.pathfindingPointManager.getEndPoint()) {
            const endPoint = this.pathfindingPointManager.getEndPoint();
            const tilePos = this.pathfindingPointManager.pixelToTilePosition(endPoint.pixelX, endPoint.pixelY);
            
            if (!tilePos || !this.pathfindingPointManager.isTileOcean(tilePos)) {
                this.pathfindingPointManager.endPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Zaktualizuj UI jeśli jakieś punkty zostały usunięte
        if (pointsRemoved) {
            this.pathfindingUIController.updateAll(this.pathfindingPointManager);
            
            // Automatycznie wygeneruj nowe punkty jeśli wszystkie zostały usunięte
            if (!this.pathfindingPointManager.getStartPoint() && !this.pathfindingPointManager.getEndPoint()) {
                this.generateRandomPathfindingPoints();
            }
        }
    }
    
    /**
     * RENDERUJE MAPĘ
     */
    renderMap() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        const selectedPoint = this.inspector.getSelectedPoint();
        const hoveredPoint = this.inspector.getHoveredPoint();
        
        // Użyj hoveredPoint jeśli nie ma selectedPoint, lub selectedPoint jeśli jest
        const activePoint = selectedPoint || hoveredPoint;
        
        // Przekaż selectedPoint i hoveredPoint do renderera
        this.renderer.selectedPoint = selectedPoint;
        this.renderer.hoveredPoint = hoveredPoint;
        
        this.renderer.renderMap(
            this.chunks, 
            this.chunkManager, 
            transitionPoints, 
            activePoint,
            this.pathfindingPointManager,
            this.gameDataManager,
            this.pathSegments
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
        
        // Aktualizuj GameDataManager z nowymi wymiarami chunka
        this.gameDataManager = new GameDataManager(
            this.settings.chunkCols, 
            this.settings.chunkRows,
            this.settings.chunkSize,  // chunkWidth
            this.settings.chunkSize   // chunkHeight (dla kwadratowych chunków)
        );
    }
    
    /**
     * AKTUALIZUJE STATYSTYKI
     */
    updateStats() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        this.uiController.updateStats(this.chunks, transitionPoints);
        
        // Aktualizuj Active Point ID
        this.updateActivePointId();
    }
    
    /**
     * AKTUALIZUJE ACTIVE POINT ID W SEKCJI NAD MAPĄ
     */
    updateActivePointId() {
        const activePointIdElement = document.getElementById('activePointId');
        if (!activePointIdElement) return;
        
        const selectedPoint = this.inspector.getSelectedPoint();
        const hoveredPoint = this.inspector.getHoveredPoint();
        // Priorytet dla hovered point, potem selected point
        const activePoint = hoveredPoint || selectedPoint;
        
        if (activePoint) {
            // Znajdź punkt w GameDataManager, aby uzyskać poprawne ID
            const gdPoint = this.findGameDataPoint(activePoint);
            const pointId = gdPoint ? gdPoint.id : `${activePoint.chunkA}-${activePoint.chunkB}-${activePoint.x}-${activePoint.y}`;

            activePointIdElement.textContent = pointId;
            // Enable Print button
            const printBtn = document.getElementById('debugConnectionsBtn');
            if (printBtn) printBtn.disabled = false;
        } else {
            activePointIdElement.textContent = '-';
            // Disable Print button
            const printBtn = document.getElementById('debugConnectionsBtn');
            if (printBtn) printBtn.disabled = true;
        }
    }
    
    /**
     * ZNAJDUJE ODPOWIEDNI PUNKT W GAMEDATA MANAGER
     */
    findGameDataPoint(point) {
        if (!this.gameDataManager || !this.gameDataManager.transitionPoints) {
            return null;
        }

        // Szukaj punktu przejścia w GameDataManager który odpowiada naszemu punktowi
        return this.gameDataManager.transitionPoints.find(gdPoint => {
            // Sprawdź czy chunk'i się zgadzają (w dowolnej kolejności)
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            const pointMatches = (gdChunkA === point.chunkA && gdChunkB === point.chunkB) ||
                                (gdChunkA === point.chunkB && gdChunkB === point.chunkA);
            
            if (!pointMatches) return false;
            
            // Sprawdź pozycję na podstawie kierunku
            if (point.direction === 'horizontal') {
                // Dla punktów poziomych pozycja to Y względem chunka
                const localY = point.y % this.gameDataManager.chunkHeight;
                return gdPoint.position === localY;
            } else if (point.direction === 'vertical') {
                // Dla punktów pionowych pozycja to X względem chunka  
                const localX = point.x % this.gameDataManager.chunkWidth;
                return gdPoint.position === localX;
            }
            
            return false;
        });
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
        // Reset punktów pathfinding i ścieżki
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null;
        
        // Reset ustawień UI
        this.uiController.resetToDefaults();
        
        // Regeneruj mapę (która automatycznie wygeneruje nowe punkty)
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Aktualizuj UI pathfinding po resecie
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * GENERUJE LOSOWE PUNKTY PATHFINDING
     */
    /**
     * AUTOMATYCZNIE GENERUJE LOSOWE PUNKTY PATHFINDING
     */
    generateRandomPathfindingPoints() {
        const success = this.pathfindingPointManager.generateRandomPoints(this.chunks);
        
        if (!success) {
            console.log('⚠️ Nie można wygenerować punktów - brak wystarczającej ilości oceanu');
        }
    }

    /**
     * CZYŚCI PUNKTY PATHFINDING
     */
    onClearPathfindingPoints() {
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null; // Wyczyść też obliczoną ścieżkę
        this.pathfindingUIController.showSuccess('Wyczyszczono punkty');
        this.renderMap();
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * OBLICZA ŚCIEŻKĘ PATHFINDING
     */
    onCalculatePathfindingPath() {
        
        if (!this.pathfindingPointManager.hasPoints()) {
            this.pathfindingUIController.showError('Brak punktów do obliczenia ścieżki');
            return;
        }

        // NOWA IMPLEMENTACJA - HierarchicalPathfinding
        try {
            // Tworzymy nową instancję HierarchicalPathfinding
            const pathfinder = new HierarchicalPathfinding();
            
            // Konfiguracja z wymiarami chunka z ustawień
            const config = {
                tileSize: this.settings.tileSize,
                gridWidth: this.gameDataManager.gridWidth,
                gridHeight: this.gameDataManager.gridHeight,
                chunkWidth: this.gameDataManager.chunkWidth,
                chunkHeight: this.gameDataManager.chunkHeight,
                getChunkData: (chunkId) => this.gameDataManager.getChunkData(chunkId),
                transitionPoints: this.gameDataManager.transitionPoints
            };
            
            // Inicjalizuj pathfinder
            pathfinder.init(config);
            
            // Pobierz punkty start/end z PathfindingPointManager
            const startPoint = this.pathfindingPointManager.getStartPoint();
            const endPoint = this.pathfindingPointManager.getEndPoint();
            
            // Konwertuj pozycje tile na pozycje świata (w jednostkach world)
            // PathfindingPointManager przechowuje numery tile'ów, ale biblioteca oczekuje pozycji świata
            const startPos = {
                x: startPoint.x * this.settings.tileSize + this.settings.tileSize / 2,
                y: startPoint.y * this.settings.tileSize + this.settings.tileSize / 2,
                z: 0
            };
            
            const endPos = {
                x: endPoint.x * this.settings.tileSize + this.settings.tileSize / 2,
                y: endPoint.y * this.settings.tileSize + this.settings.tileSize / 2,
                z: 0
            };
            

            
            // Znajdź ścieżkę
            const pathSegments = pathfinder.findPath(startPos, endPos);
            
            if (pathSegments) {

                console.log('--- Obliczone segmenty ścieżki ---');
                const tableData = pathSegments.map(segment => ({
                    chunk: segment.chunk,
                    x: segment.position.x.toFixed(2),
                    y: segment.position.y.toFixed(2)
                }));
                console.table(tableData);
                console.log('------------------------------------');
                
                // Stwórz kompletną ścieżkę zaczynającą się od pozycji startowej
                const completePath = [];
                
                // Dodaj pozycję startową jako pierwszy punkt
                completePath.push({
                    chunk: 'start',
                    position: startPos
                });
                
                // Dodaj segmenty ścieżki z biblioteki
                completePath.push(...pathSegments);
                
                // Zapisz kompletną ścieżkę do renderowania
                this.pathSegments = completePath;
                
                // Rerenderuj mapę z narysowaną ścieżką
                this.renderMap();
                
                this.pathfindingUIController.showSuccess(`Znaleziono ścieżkę z ${pathSegments.length} segmentami`);
            } else {
                // Wyczyść poprzednią ścieżkę
                this.pathSegments = null;
                this.renderMap();
                this.pathfindingUIController.showError('Nie można znaleźć ścieżki między punktami');
            }
            
        } catch (error) {
            console.error('❌ Błąd podczas obliczania ścieżki:', error);
            this.pathfindingUIController.showError(`Błąd: ${error.message}`);
        }
    }

    /**
     * KONFIGURUJE INTERAKTYWNOŚĆ CANVAS Z OBSŁUGĄ PATHFINDING
     */
    setupCanvasInteractivity() {
        // Obsługa ruchu myszy
        this.canvas.addEventListener('mousemove', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas);
            
            // Aktualizuj pozycję myszy w UI
            this.uiController.updateMousePosition(mouseX, mouseY);
            
            // Aktualizuj przeciąganie punktów pathfinding
            if (this.pathfindingPointManager.isDraggingPoint()) {
                const success = this.pathfindingPointManager.updateDragging(mouseX, mouseY);
                if (success) {
                    // Wyczyść obliczoną ścieżkę bo punkty się zmieniły
                    this.pathSegments = null;
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
            const currentHoveredPoint = this.inspector.getHoveredPoint();
            
            // Sprawdź czy hover się zmienił (porównaj przez ID punktów)
            const getPointId = (point) => point ? `${point.chunkA}-${point.chunkB}-${point.x}-${point.y}` : null;
            const hoveredId = getPointId(hoveredPoint);
            const currentHoveredId = getPointId(currentHoveredPoint);
            const hoverChanged = hoveredId !== currentHoveredId;
            
            if (hoveredPoint) {
                this.inspector.setHoveredPoint(hoveredPoint);
                this.canvas.classList.add('pointer-cursor');
                this.inspector.showInspector(hoveredPoint, this.gameDataManager);
                this.canvas.style.cursor = 'pointer';
                
                // Renderuj mapę tylko jeśli hover się zmienił
                if (hoverChanged) {
                    this.renderMap();
                    this.updateActivePointId();
                }
            } else {
                this.inspector.setHoveredPoint(null);
                this.canvas.classList.remove('pointer-cursor');
                this.canvas.style.cursor = 'default';
                
                if (this.inspector.getSelectedPoint()) {
                    this.inspector.showInspector(this.inspector.getSelectedPoint(), this.gameDataManager);
                } else {
                    this.inspector.hideInspector();
                }
                
                // Renderuj mapę tylko jeśli hover się zmienił
                if (hoverChanged) {
                    this.renderMap();
                    this.updateActivePointId();
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
                    this.inspector.showInspector(clickedPoint, this.gameDataManager);
                    // Renderuj mapę z liniami połączeń dla selectedPoint
                    this.renderMap();
                    this.updateActivePointId();
                } else {
                    // Kliknięto poza punktem przejścia - resetuj zaznaczenie
                    this.inspector.setSelectedPoint(null);
                    this.inspector.hideInspector();
                    // Renderuj mapę bez linii połączeń
                    this.renderMap();
                    this.updateActivePointId();
                }
            } else {
                // Punkty przejścia są wyłączone - resetuj zaznaczenie
                this.inspector.setSelectedPoint(null);
                this.inspector.hideInspector();
                this.renderMap();
                this.updateActivePointId();
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
            
            // Wyczyść pozycję myszy
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = '-';
            }
            
            // Resetuj hover (ale zachowaj selected)
            this.inspector.setHoveredPoint(null);
            this.canvas.classList.remove('pointer-cursor');
            this.canvas.style.cursor = 'default';
            
            // Pokaż selectedPoint jeśli istnieje, inaczej ukryj inspector
            if (this.inspector.getSelectedPoint()) {
                this.inspector.showInspector(this.inspector.getSelectedPoint(), this.gameDataManager);
            } else {
                this.inspector.hideInspector();
            }
            
            // Renderuj mapę (może ukryć linie hover, ale zachować linie selected)
            this.renderMap();
            this.updateActivePointId();
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
        
        // Zaktualizuj referencję gameDataManager w Inspector'ze
        this.inspector.setGameDataManager(this.gameDataManager);
        
        // Graf połączeń będzie budowany na żądanie przez przycisk "Zbuduj Graf Przejść"
        // this.gameDataManager.buildConnections(this.chunks);
        

    }
    
    /**
     * BUDUJE GRAF POŁĄCZEŃ MIĘDZY PUNKTAMI PRZEJŚCIA
     */
    onBuildTransitionGraph() {
        // Upewnij się że mamy dane w GameDataManager
        if (!this.gameDataManager || this.gameDataManager.transitionPoints.length === 0) {
            this.pathfindingUIController.showError('Brak punktów przejścia do zbudowania grafu');
            return;
        }
        
        // Buduj graf połączeń
        this.gameDataManager.buildConnections(this.chunks);
        
        // Zaktualizuj referencję gameDataManager w Inspector'ze po zbudowaniu połączeń
        this.inspector.setGameDataManager(this.gameDataManager);
        
        // Pokaż sukces
        this.pathfindingUIController.showSuccess('Zbudowano graf połączeń');
    }

    /**
     * DRUKUJE DANE GAME DATA MANAGER W KONSOLI
     */
    onPrintGameData() {
        console.log('=== GAMEDATA MANAGER PRINT ===');
        console.log('📊 GameDataManager Object:', this.gameDataManager);

        
        console.log('\n📐 Settings:');
        console.log(`- Chunk Size: ${this.gameDataManager.chunkWidth}x${this.gameDataManager.chunkHeight}`);
        console.log(`- Grid Size: ${this.gameDataManager.gridWidth}x${this.gameDataManager.gridHeight}`);
        console.log('- Total Transition Points:', this.gameDataManager.transitionPoints.length);
        console.log('- Total Chunks:', Object.keys(this.gameDataManager.chunks).length);
        
        console.log('\n📋 JSON Export (New Format):');
        console.log(JSON.stringify(this.gameDataManager.transitionPoints, null, 2));
        
        console.log('==============================');
        
        // Pokazuje też sukces w UI
        this.pathfindingUIController.showSuccess('Dane wydrukowane w konsoli');
    }

    /**
     * KONFIGURUJE PRZYCISK "OBLICZ ŚCIEŻKĘ"
     */
    setupCalculatePathButton() {
        const calculatePathBtn = document.getElementById('calculatePath');
        if (calculatePathBtn) {
            calculatePathBtn.addEventListener('click', () => {
                this.onCalculatePathfindingPath();
            });
        }
    }
}

// Inicjalizuj aplikację gdy DOM jest gotowy
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
}); 