/**
 * MAIN APPLICATION - CONNECTS ALL MODULES
 */

import { 
    DEFAULT_SETTINGS, 
    DEFAULT_ISLAND_SETTINGS, 
    DEFAULT_PATHFINDING_SETTINGS,
    loadSettingsFromLocalStorage,
    mergeSettingsWithDefaults,
    saveSettingsToLocalStorage,
    clearSettingsFromLocalStorage,
    exportSettingsAsJSON,
    importSettingsFromJSON
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
import { HierarchicalPathfinding } from '../hierarchical_pathfinding/src/index.js';

/**
 * MAIN APPLICATION CLASS
 */
class ChunkMapGenerator {
    constructor() {
        // Load settings from localStorage or use defaults
        const loadedSettings = loadSettingsFromLocalStorage();
        const mergedSettings = mergeSettingsWithDefaults(loadedSettings);
        
        // Settings
        this.settings = mergedSettings.mapSettings;

        // Seed handling - try to load from localStorage
        const savedSeed = localStorage.getItem('mapSeed');
        this._useSavedSeedOnce = false;
        if (savedSeed) {
            this.settings.seed = parseInt(savedSeed, 10);
            this._useSavedSeedOnce = true; // use saved seed only for first generation
        }
        
        this.islandSettings = mergedSettings.islandSettings;
        this.pathfindingSettings = mergedSettings.pathfindingSettings;
        
        // Main application data
        this.chunks = [];
        this.baseMap = null;
        this.mapDimensions = { width: 0, height: 0 };
        this.pathSegments = null; // Calculated pathfinding path segments
        
        // Components
        this.mapGenerator = null;
        this.chunkManager = null;
        this.transitionPointManager = null;
        this.pathfindingPointManager = null;
        this.renderer = null;
        this.uiController = null;
        this.pathfindingUIController = null;
        this.inspector = null;
        this.gameDataManager = null;
        
        // DOM elements
        this.canvas = null;
        this.inspectorPanel = null;
        
        // Modal and tabs
        this.settingsModal = null;
        this.currentTab = 'map-config';
        
        this.init();
    }
    
    init() {
        // Initialize DOM elements
        this.canvas = document.getElementById('mapCanvas');
        this.inspectorPanel = document.getElementById('transitionPointDetails');
        this.settingsModal = document.getElementById('settingsModal');
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        // Initialize components
        this.initializeComponents();
        
        // Update UI controller with loaded settings
        this.updateUIControllerSettings();
        
        // Debug: log loaded settings
        console.log('🔧 Loaded settings from localStorage:', {
            map: this.settings,
            island: this.islandSettings,
            pathfinding: this.pathfindingSettings
        });
        
        // Configure UI
        this.setupUI();
        
        // Configure modal and tabs
        this.setupModalAndTabs();
        
        // Generate initial map
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Initialize pathfinding UI
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Initialize UI with current settings
        this.uiController.updateUIFromSettings();
        
        // Initialize settings status
        if (this.uiController && this.uiController.updateSettingsStatus) {
            this.uiController.updateSettingsStatus();
        }
        
        // Update controls hint
        this.updateControlsHint();
        
        // Make available globally for developer console
        window.mapGenerator = this;
        window.app = this;
        window.gameDataManager = this.gameDataManager;
        console.log('🎮 MapGenerator available as window.mapGenerator and window.app');
        console.log('📊 GameDataManager available as window.gameDataManager');
    }
    
    /**
     * INITIALIZES ALL COMPONENTS
     */
    initializeComponents() {
        this.mapGenerator = new MapGenerator(this.settings, this.islandSettings);
        if (this.settings.seed != null) {
            this.mapGenerator.setSeed(this.settings.seed);
        }
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
            this.settings.chunkSize   // chunkHeight (for square chunks)
        );
        this.inspector = new Inspector(this.inspectorPanel, this.gameDataManager);
    }

    /**
     * UPDATES UI CONTROLLER SETTINGS REFERENCES
     */
    updateUIControllerSettings() {
        if (this.uiController) {
            this.uiController.settings = this.settings;
            this.uiController.islandSettings = this.islandSettings;
            this.uiController.pathfindingSettings = this.pathfindingSettings;
        }
    }
    
    /**
     * CONFIGURES USER INTERFACE
     */
    setupUI() {
        // Set callbacks for UI controller
        this.uiController.setCallbacks({
            onFullRegenerationNeeded: () => this.onFullRegeneration(),
            onSmoothingOnlyNeeded: () => this.onSmoothingOnly(),
            onRenderOnlyNeeded: () => this.onRenderOnly(),
            onPathfindingUpdate: () => this.onPathfindingUpdate(),
            onExportPNG: () => this.onExportPNG(),
            onReset: () => this.onReset(),
            onSaveSettings: () => this.saveSettings(),
            onClearSettings: () => this.clearSettings(),
            onExportSettings: () => this.exportSettings(),
            onImportSettings: (jsonString) => this.importSettings(jsonString)
        });
        
        // Set callbacks for pathfinding UI
        this.pathfindingUIController.setCallbacks({
            onPrintData: () => this.onPrintGameData(),
            onCalculateNextSegment: () => this.onCalculateNextSegment()
        });
        
        // Configure event listeners
        this.uiController.setupEventListeners();
        this.pathfindingUIController.setupEventListeners();
        
        // Configure canvas interactivity
        this.setupCanvasInteractivity();
        
        // Configure zoom controls
        this.setupZoomControls();
    }
    
    /**
     * CONFIGURES MODAL AND TABS
     */
    setupModalAndTabs() {
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        const closeModalBtn = document.getElementById('closeSettingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettingsModal());
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeSettingsModal());
        }
        
        // Close modal when clicking outside
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettingsModal();
                }
            });
        }
        
        // Tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal.classList.contains('show')) {
                this.closeSettingsModal();
            } else if (e.key === 'Escape' && !this.settingsModal.classList.contains('show')) {
                // Reset zoom when Escape is pressed outside modal
                if (this.renderer.resetZoom()) {
                    this.renderMap();
                }
            }
        });
        
        // "Calculate Path" button in main layout
        this.setupCalculatePathButton();
    }
    
    /**
     * OPENS SETTINGS MODAL
     */
    openSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Block page scrolling
        }
    }
    
    /**
     * CLOSES SETTINGS MODAL
     */
    closeSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('show');
            document.body.style.overflow = ''; // Restore page scrolling
        }
    }
    
    /**
     * SWITCHES TAB
     */
    switchTab(tabName) {
        // Remove active class from all buttons and panels
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Add active class to selected tab
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
     * MAIN MAP GENERATION METHOD
     */
    generateMap() {
        // Seed management: use saved only once, then generate new
        if (this._useSavedSeedOnce) {
            // Use seed from localStorage only for first map generation
            this.mapGenerator.setSeed(this.settings.seed);
            this._useSavedSeedOnce = false;
        } else {
            // Generate new seed and save it
            const newSeed = Date.now();
            this.settings.seed = newSeed;
            localStorage.setItem('mapSeed', newSeed);
            this.mapGenerator.setSeed(newSeed);
        }

        // Update seed display in UI
        if (this.uiController && this.uiController.updateSeed) {
            this.uiController.updateSeed(this.settings.seed);
        }

        // Update settings in components
        this.updateComponentSettings();
        
        // Clear pathfinding points and path when generating new map
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null;
        this.pathfindingUIController.resetSegments(); // Reset segment state when generating new map
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Generate map
        const finalMap = this.mapGenerator.generateMap();
        
        // Split into chunks
        this.chunks = this.chunkManager.splitMapIntoChunks(
            finalMap, 
            this.mapGenerator.getMapDimensions().width, 
            this.mapGenerator.getMapDimensions().height
        );
        
        // Generate transition points
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        
        // Update GameDataManager with transition points
        this.updateGameDataManager();
        
        // Automatically build connection graph
        if (this.gameDataManager.transitionPoints.length > 0) {
            this.gameDataManager.buildConnections(this.chunks);
        }
        
        // Automatically generate random pathfinding points
        this.generateRandomPathfindingPoints();
        
        // Update UI after automatic point generation
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
        
        // Save references for compatibility
        this.baseMap = this.mapGenerator.getBaseMap();
        this.mapDimensions = this.mapGenerator.getMapDimensions();
    }
    
    /**
     * APPLIES ONLY SMOOTHING (OPTIMIZATION)
     */
    applySmoothingToExistingMap() {
        // Update settings
        this.updateComponentSettings();
        
        // Apply smoothing
        const finalMap = this.mapGenerator.applySmoothingToExistingMap();
        
        // Split into chunks
        this.chunks = this.chunkManager.splitMapIntoChunks(
            finalMap,
            this.mapGenerator.getMapDimensions().width,
            this.mapGenerator.getMapDimensions().height
        );
        
        // Check if existing pathfinding points are still on ocean
        this.validatePathfindingPoints();
        
        // Regenerate transition points
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        
        // Update GameDataManager with transition points
        this.updateGameDataManager();
        
        // Automatically build connection graph
        if (this.gameDataManager.transitionPoints.length > 0) {
            this.gameDataManager.buildConnections(this.chunks);
        }
        
        // Clear path and segments after smoothing (they may be invalid now)
        this.pathSegments = null;
        this.pathfindingUIController.resetSegments(); // Reset segment state after smoothing
    }
    
    /**
     * VALIDATES PATHFINDING POINTS AND REMOVES INVALID ONES
     */
    validatePathfindingPoints() {
        let pointsRemoved = false;
        
        // Check start point
        if (this.pathfindingPointManager.getStartPoint()) {
            const startPoint = this.pathfindingPointManager.getStartPoint();
            const tilePos = this.pathfindingPointManager.pixelToTilePosition(startPoint.pixelX, startPoint.pixelY);
            
            if (!tilePos || !this.pathfindingPointManager.isTileOcean(tilePos)) {
                this.pathfindingPointManager.startPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Check end point
        if (this.pathfindingPointManager.getEndPoint()) {
            const endPoint = this.pathfindingPointManager.getEndPoint();
            const tilePos = this.pathfindingPointManager.pixelToTilePosition(endPoint.pixelX, endPoint.pixelY);
            
            if (!tilePos || !this.pathfindingPointManager.isTileOcean(tilePos)) {
                this.pathfindingPointManager.endPoint = null;
                pointsRemoved = true;
            }
        }
        
        // Update UI if any points were removed
        if (pointsRemoved) {
            this.pathSegments = null; // Clear path when points are removed
            this.pathfindingUIController.resetSegments(); // Reset segment state when points are removed
            this.pathfindingUIController.updateAll(this.pathfindingPointManager);
            
            // Automatically generate new points if all were removed
            if (!this.pathfindingPointManager.getStartPoint() && !this.pathfindingPointManager.getEndPoint()) {
                this.generateRandomPathfindingPoints();
            }
        }
    }
    
    /**
     * RENDERS MAP
     */
    renderMap() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        const selectedPoint = this.inspector.getSelectedPoint();
        const hoveredPoint = this.inspector.getHoveredPoint();
        
        // Use hoveredPoint if no selectedPoint, or selectedPoint if exists
        const activePoint = selectedPoint || hoveredPoint;
        
        // Pass selectedPoint and hoveredPoint to renderer
        this.renderer.selectedPoint = selectedPoint;
        this.renderer.hoveredPoint = hoveredPoint;
        
        // Get calculated segments from PathfindingUIController
        const calculatedSegments = this.pathfindingUIController.getCalculatedSegments();
        
        this.renderer.renderMap(
            this.chunks, 
            this.chunkManager, 
            transitionPoints, 
            activePoint,
            this.pathfindingPointManager,
            this.gameDataManager,
            this.pathSegments,
            calculatedSegments
        );
    }
    
    /**
     * UPDATES SETTINGS IN COMPONENTS
     */
    updateComponentSettings() {
        this.mapGenerator.updateSettings(this.settings);
        this.mapGenerator.updateIslandSettings(this.islandSettings);
        this.pathfindingPointManager.updateSettings(this.settings);
        this.transitionPointManager.updatePathfindingSettings(this.pathfindingSettings);
        this.renderer.updateSettings(this.settings);
        this.renderer.updatePathfindingSettings(this.pathfindingSettings);
        
        // Update GameDataManager with new chunk dimensions
        this.gameDataManager = new GameDataManager(
            this.settings.chunkCols, 
            this.settings.chunkRows,
            this.settings.chunkSize,  // chunkWidth
            this.settings.chunkSize   // chunkHeight (for square chunks)
        );
        
        // Clear path and segments when settings change (they may be invalid now)
        this.pathSegments = null;
        this.pathfindingUIController.resetSegments(); // Reset segment state when settings change
    }
    
    /**
     * UPDATES STATISTICS
     */
    updateStats() {
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        this.uiController.updateStats(this.chunks, transitionPoints);
        
        // Update Active Point ID
        this.updateActivePointId();
    }
    
    /**
     * UPDATES ACTIVE POINT ID IN SECTION ABOVE MAP
     */
    updateActivePointId() {
        const activePointIdElement = document.getElementById('activePointId');
        if (!activePointIdElement) return;
        
        const selectedPoint = this.inspector.getSelectedPoint();
        const hoveredPoint = this.inspector.getHoveredPoint();
        // Priority for hovered point, then selected point
        const activePoint = hoveredPoint || selectedPoint;
        
        if (activePoint) {
            // Find point in GameDataManager to get correct ID
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
     * FINDS CORRESPONDING POINT IN GAMEDATA MANAGER
     */
    findGameDataPoint(point) {
        if (!this.gameDataManager || !this.gameDataManager.transitionPoints) {
            return null;
        }

        // Search for transition point in GameDataManager that corresponds to our point
        return this.gameDataManager.transitionPoints.find(gdPoint => {
            // Check if chunks match (in any order)
            const [gdChunkA, gdChunkB] = gdPoint.chunks;
            const pointMatches = (gdChunkA === point.chunkA && gdChunkB === point.chunkB) ||
                                (gdChunkA === point.chunkB && gdChunkB === point.chunkA);
            
            if (!pointMatches) return false;
            
            // Check position based on direction
            if (point.direction === 'horizontal') {
                // For horizontal points position is Y relative to chunk
                const localY = point.y % this.gameDataManager.chunkHeight;
                return gdPoint.position === localY;
            } else if (point.direction === 'vertical') {
                // For vertical points position is X relative to chunk  
                const localX = point.x % this.gameDataManager.chunkWidth;
                return gdPoint.position === localX;
            }
            
            return false;
        });
    }
    
    /**
     * UI CALLBACKS
     */
    onFullRegeneration() {
        this.generateMap();
        this.renderMap();
        this.updateStats();
    }
    
    onSmoothingOnly() {
        this.applySmoothingToExistingMap();
        this.pathfindingUIController.resetSegments(); // Reset segment state after smoothing
        this.renderMap();
        this.updateStats();
    }
    
    onRenderOnly() {
        this.updateComponentSettings();
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        this.pathfindingUIController.resetSegments(); // Reset segment state after render-only update
        this.renderMap();
    }
    
    onPathfindingUpdate() {
        this.transitionPointManager.generateTransitionPoints(this.chunks);
        this.transitionPointManager.calculateTransitionPointPixels(this.chunks);
        this.pathfindingUIController.resetSegments(); // Reset segment state after pathfinding update
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
     * RESETS TO DEFAULT SETTINGS
     */
    onReset() {
        // Reset pathfinding points and path
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null;
        this.pathfindingUIController.resetSegments(); // Reset segment state when resetting
        
        // Reset UI settings
        this.uiController.resetToDefaults();
        
        // Regenerate map (which will automatically generate new points)
        this.generateMap();
        this.renderMap();
        this.updateStats();
        
        // Update pathfinding UI after reset
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * SAVES CURRENT SETTINGS TO LOCALSTORAGE
     */
    saveSettings() {
        console.log('💾 Saving settings to localStorage:', {
            map: this.settings,
            island: this.islandSettings,
            pathfinding: this.pathfindingSettings
        });

        const success = saveSettingsToLocalStorage(
            this.settings, 
            this.islandSettings, 
            this.pathfindingSettings
        );
        
        if (success) {
            console.log('✅ Settings saved successfully');
            // Save timestamp
            localStorage.setItem('lastSavedTime', Date.now().toString());
            // Update UI status
            if (this.uiController && this.uiController.updateSettingsStatus) {
                this.uiController.updateSettingsStatus();
            }
            // Show success message in UI if available
            if (this.uiController && this.uiController.showSuccess) {
                this.uiController.showSuccess('Settings saved');
            }
        } else {
            console.error('❌ Failed to save settings');
            // Show error message in UI if available
            if (this.uiController && this.uiController.showError) {
                this.uiController.showError('Failed to save settings');
            }
        }
        
        return success;
    }

    /**
     * CLEARS ALL SETTINGS FROM LOCALSTORAGE
     */
    clearSettings() {
        const success = clearSettingsFromLocalStorage();
        
        if (success) {
            console.log('🗑️ Settings cleared successfully');
            // Update UI status
            if (this.uiController && this.uiController.updateSettingsStatus) {
                this.uiController.updateSettingsStatus();
            }
            // Show success message
            if (this.uiController && this.uiController.showSuccess) {
                this.uiController.showSuccess('Settings cleared');
            }
        } else {
            console.error('❌ Failed to clear settings');
            if (this.uiController && this.uiController.showError) {
                this.uiController.showError('Failed to clear settings');
            }
        }
        
        return success;
    }

    /**
     * EXPORTS SETTINGS AS JSON
     */
    exportSettings() {
        const jsonString = exportSettingsAsJSON(
            this.settings, 
            this.islandSettings, 
            this.pathfindingSettings
        );
        
        // Show export dialog
        const importExportArea = document.querySelector('.import-export-area');
        const settingsJson = document.getElementById('settingsJson');
        
        if (importExportArea && settingsJson) {
            importExportArea.style.display = 'block';
            settingsJson.value = jsonString;
            settingsJson.placeholder = 'Settings JSON (read-only)';
            settingsJson.readOnly = true;
        }
        
        console.log('📤 Settings exported');
        return jsonString;
    }

    /**
     * IMPORTS SETTINGS FROM JSON
     */
    importSettings(jsonString) {
        const importedSettings = importSettingsFromJSON(jsonString);
        
        if (importedSettings) {
            // Update current settings
            this.settings = { ...this.settings, ...importedSettings.mapSettings };
            this.islandSettings = { ...this.islandSettings, ...importedSettings.islandSettings };
            this.pathfindingSettings = { ...this.pathfindingSettings, ...importedSettings.pathfindingSettings };
            
            // Save to localStorage
            const success = this.saveSettings();
            
            if (success) {
                console.log('📥 Settings imported successfully');
                return true;
            } else {
                console.error('❌ Failed to save imported settings');
                return false;
            }
        } else {
            console.error('❌ Failed to parse imported settings');
            return false;
        }
    }

    /**
     * GENERATES RANDOM PATHFINDING POINTS
     */
    /**
     * AUTOMATICALLY GENERATES RANDOM PATHFINDING POINTS
     */
    generateRandomPathfindingPoints() {
        const success = this.pathfindingPointManager.generateRandomPoints(this.chunks);
        
        if (success) {
            // Clear any existing path when generating new points
            this.pathSegments = null;
            this.pathfindingUIController.resetSegments(); // Reset segment state when generating new points
            
            // Render map to show new points
            this.renderMap();
            
            // Update UI
            this.pathfindingUIController.updateAll(this.pathfindingPointManager);
            
            console.log('✅ Random points generated successfully');
        } else {
            console.log('⚠️ Cannot generate points - insufficient ocean');
        }
    }

    /**
     * CLEARS PATHFINDING POINTS
     */
    onClearPathfindingPoints() {
        this.pathfindingPointManager.clearPoints();
        this.pathSegments = null; // Also clear calculated path
        this.pathfindingUIController.resetSegments(); // Reset segment state when clearing points
        this.pathfindingUIController.showSuccess('Cleared points');
        this.renderMap();
        this.pathfindingUIController.updateAll(this.pathfindingPointManager);
    }

    /**
     * CALCULATES PATHFINDING PATH
     */
    onCalculatePathfindingPath() {
        
        if (!this.pathfindingPointManager.hasPoints()) {
            this.pathfindingUIController.showError('No points to calculate path');
            return;
        }

        // NEW IMPLEMENTATION - HierarchicalPathfinding
        try {
            // Create new HierarchicalPathfinding instance
            const pathfinder = new HierarchicalPathfinding();
            
            // Configuration with chunk dimensions from settings
            const config = {
                tileSize: this.settings.tileSize,
                gridWidth: this.gameDataManager.gridWidth,
                gridHeight: this.gameDataManager.gridHeight,
                chunkWidth: this.gameDataManager.chunkWidth,
                chunkHeight: this.gameDataManager.chunkHeight,
                getChunkData: (chunkId) => this.gameDataManager.getChunkData(chunkId),
                transitionPoints: this.gameDataManager.transitionPoints,
                
                // NEW: Algorithm and heuristic settings
                localAlgorithm: this.pathfindingSettings.localAlgorithm,
                localHeuristic: this.pathfindingSettings.localHeuristic,
                hierarchicalHeuristic: this.pathfindingSettings.hierarchicalHeuristic,
                heuristicWeight: this.pathfindingSettings.heuristicWeight
            };
            
            // Initialize pathfinder
            pathfinder.init(config);
            
            // Get start/end points from PathfindingPointManager
            const startPoint = this.pathfindingPointManager.getStartPoint();
            const endPoint = this.pathfindingPointManager.getEndPoint();
            
            // Convert tile positions to world positions (in world units)
            // PathfindingPointManager stores tile numbers, but library expects world positions
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
            

            
            // Find path
            const pathSegments = pathfinder.findPath(startPos, endPos);
            
            if (pathSegments) {

                console.log('--- Calculated path segments ---');
                const tableData = pathSegments.map(segment => ({
                    chunk: segment.chunk,
                    x: segment.position.x.toFixed(2),
                    y: segment.position.y.toFixed(2)
                }));
                console.table(tableData);
                console.log('------------------------------------');
                
                // Create complete path starting from start position
                const completePath = [];
                
                // Add start position as first point
                completePath.push({
                    chunk: 'start',
                    position: startPos
                });
                
                // Add path segments from library
                completePath.push(...pathSegments);
                
                // Save complete path for rendering
                this.pathSegments = completePath;
                

                
                // Initialize segment manager with hierarchical path
                this.pathfindingUIController.setHierarchicalPath(pathSegments, startPos, endPos);
                
                // Re-render map with drawn path
                this.renderMap();
                
                this.pathfindingUIController.showSuccess(`Found path with ${pathSegments.length} segments`);
            } else {
                // Clear previous path
                this.pathSegments = null;
                this.pathfindingUIController.resetSegments(); // Reset segment state when no path found
                this.renderMap();
                this.pathfindingUIController.showError('Cannot find path between points');
            }
            
        } catch (error) {
            console.error('❌ Error calculating path:', error);
            this.pathSegments = null; // Clear path on error
            this.pathfindingUIController.resetSegments(); // Reset segment state on error
            this.pathfindingUIController.showError(`Error: ${error.message}`);
        }
    }

    /**
     * CONFIGURES CANVAS INTERACTIVITY WITH PATHFINDING SUPPORT
     */
    setupCanvasInteractivity() {
        // Mouse movement handling
        this.canvas.addEventListener('mousemove', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas, this.renderer);
            
            // Update mouse position in UI
            this.uiController.updateMousePosition(mouseX, mouseY);
            
            // Handle pan dragging
            if (this.renderer.isDragging) {
                if (this.renderer.updatePan(mouseX, mouseY)) {
                    this.renderMap();
                }
                return;
            }
            
            // Update pathfinding point dragging
            if (this.pathfindingPointManager.isDraggingPoint()) {
                const success = this.pathfindingPointManager.updateDragging(mouseX, mouseY);
                if (success) {
                    // Clear calculated path because points changed
                    this.pathSegments = null;
                    this.pathfindingUIController.resetSegments(); // Reset segment state when points are moved
                    this.renderMap();
                    this.pathfindingUIController.updateAll(this.pathfindingPointManager);
                }
                return;
            }
            
            // Check if hovering over pathfinding point
            const pathfindingPoint = this.pathfindingPointManager.getPointAt(mouseX, mouseY);
            if (pathfindingPoint) {
                this.canvas.style.cursor = 'grab';
                return;
            }
            
            // Check transition points (existing logic)
            if (!this.pathfindingSettings.showTransitionPoints) {
                this.inspector.hideInspector();
                this.canvas.style.cursor = 'grab';
                return;
            }

            const hoveredPoint = this.transitionPointManager.getTransitionPointAt(mouseX, mouseY);
            const currentHoveredPoint = this.inspector.getHoveredPoint();
            
            // Check if hover changed (compare by point IDs)
            const getPointId = (point) => point ? `${point.chunkA}-${point.chunkB}-${point.x}-${point.y}` : null;
            const hoveredId = getPointId(hoveredPoint);
            const currentHoveredId = getPointId(currentHoveredPoint);
            const hoverChanged = hoveredId !== currentHoveredId;
            
            if (hoveredPoint) {
                this.inspector.setHoveredPoint(hoveredPoint);
                this.canvas.classList.add('pointer-cursor');
                this.inspector.showInspector(hoveredPoint, this.gameDataManager);
                this.canvas.style.cursor = 'pointer';
                
                // Render map only if hover changed
                if (hoverChanged) {
                    this.renderMap();
                    this.updateActivePointId();
                }
            } else {
                this.inspector.setHoveredPoint(null);
                this.canvas.classList.remove('pointer-cursor');
                this.canvas.style.cursor = 'grab';
                
                if (this.inspector.getSelectedPoint()) {
                    this.inspector.showInspector(this.inspector.getSelectedPoint(), this.gameDataManager);
                } else {
                    this.inspector.hideInspector();
                }
                
                // Render map only if hover changed
                if (hoverChanged) {
                    this.renderMap();
                    this.updateActivePointId();
                }
            }
        });

        // Mouse click handling
        this.canvas.addEventListener('mousedown', (e) => {
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas, this.renderer);
            
            // Check if clicked on pathfinding point
            const pathfindingPoint = this.pathfindingPointManager.getPointAt(mouseX, mouseY);
            if (pathfindingPoint) {
                this.pathfindingPointManager.startDragging(pathfindingPoint, mouseX, mouseY);
                this.pathfindingUIController.showDraggingMessage(pathfindingPoint.type);
                this.canvas.style.cursor = 'grabbing';
                return;
            }
            
            // Check transition points (existing logic)
            if (this.pathfindingSettings.showTransitionPoints) {
                const clickedPoint = this.transitionPointManager.getTransitionPointAt(mouseX, mouseY);
                if (clickedPoint) {
                    this.inspector.setSelectedPoint(clickedPoint);
                    this.inspector.showInspector(clickedPoint, this.gameDataManager);
                    // Render map with connection lines for selectedPoint
                    this.renderMap();
                    this.updateActivePointId();
                } else {
                    // Clicked outside transition point - start pan
                    this.inspector.setSelectedPoint(null);
                    this.inspector.hideInspector();
                    this.renderer.startPan(mouseX, mouseY);
                }
            } else {
                // Transition points are disabled - start pan
                this.inspector.setSelectedPoint(null);
                this.inspector.hideInspector();
                this.renderer.startPan(mouseX, mouseY);
            }
        });

        // Mouse release handling
        this.canvas.addEventListener('mouseup', () => {
            if (this.pathfindingPointManager.isDraggingPoint()) {
                this.pathfindingPointManager.stopDragging();
                this.pathfindingUIController.updateAll(this.pathfindingPointManager);
                this.canvas.style.cursor = this.pathfindingSettings.enablePanDragging ? 'grab' : 'default';
            }
            
            // Stop pan dragging
            if (this.renderer.isDragging) {
                this.renderer.stopPan();
            }
        });

        // Canvas leave handling
        this.canvas.addEventListener('mouseleave', () => {
            if (this.pathfindingPointManager.isDraggingPoint()) {
                this.pathfindingPointManager.stopDragging();
                this.pathfindingUIController.updateAll(this.pathfindingPointManager);
            }
            
            // Stop pan dragging
            if (this.renderer.isDragging) {
                this.renderer.stopPan();
            }
            
            // Clear mouse position
            const mousePositionElement = document.getElementById('mousePosition');
            if (mousePositionElement) {
                mousePositionElement.textContent = '-';
            }
            
            // Reset hover (but keep selected)
            this.inspector.setHoveredPoint(null);
            this.canvas.classList.remove('pointer-cursor');
            this.canvas.style.cursor = this.pathfindingSettings.enablePanDragging ? 'grab' : 'default';
            
            // Show selectedPoint if exists, otherwise hide inspector
            if (this.inspector.getSelectedPoint()) {
                this.inspector.showInspector(this.inspector.getSelectedPoint(), this.gameDataManager);
            } else {
                this.inspector.hideInspector();
            }
            
            // Render map (may hide hover lines, but keep selected lines)
            this.renderMap();
            this.updateActivePointId();
        });

        // Mouse wheel handling for zoom
        this.canvas.addEventListener('wheel', (e) => {
            // Check if mouse wheel zoom is enabled
            if (!this.renderer.isMouseWheelZoomEnabled()) {
                return; // Don't prevent default, let normal scrolling work
            }
            
            e.preventDefault();
            
            const { mouseX, mouseY } = getCanvasCoordinates(e, this.canvas, this.renderer);
            const delta = e.deltaY > 0 ? -1 : 1;
            
            // Zoom in/out
            if (delta > 0) {
                if (this.renderer.zoomIn()) {
                    this.renderMap();
                }
            } else {
                if (this.renderer.zoomOut()) {
                    this.renderMap();
                }
            }
        });
    }
    
    /**
     * UPDATES GAMEDATA MANAGER WITH TRANSITION POINTS AND BUILDS GRAPH
     */
    updateGameDataManager() {
        if (!this.gameDataManager || !this.transitionPointManager) {
            return;
        }
        
        // Clear previous transition points
        this.gameDataManager.transitionPoints = [];
        
        // Get transition points from TransitionPointManager
        const transitionPoints = this.transitionPointManager.getTransitionPoints();
        
        // Convert to new format and add to GameDataManager
        transitionPoints.forEach(point => {
            // Check if point has required properties
            if (point.chunkA && point.chunkB && point.x !== undefined && point.y !== undefined) {
                // Calculate local position based on direction
                let position;
                if (point.direction === 'vertical') {
                    position = point.x % this.settings.chunkSize;
                } else {
                    position = point.y % this.settings.chunkSize;
                }
                
                // Add point with ID and connections
                this.gameDataManager.addTransitionPoint(point.chunkA, point.chunkB, position);
            }
        });
        
        // Update gameDataManager reference in Inspector
        this.inspector.setGameDataManager(this.gameDataManager);
        
        // Connection graph will be built on demand by "Build Transition Graph" button
        // this.gameDataManager.buildConnections(this.chunks);
        

    }
    
    /**
     * BUILDS CONNECTION GRAPH BETWEEN TRANSITION POINTS
     */
    onBuildTransitionGraph() {
        // Make sure we have data in GameDataManager
        if (!this.gameDataManager || this.gameDataManager.transitionPoints.length === 0) {
            this.pathfindingUIController.showError('No transition points to build graph');
            return;
        }
        
        // Build connection graph
        this.gameDataManager.buildConnections(this.chunks);
        
        // Update gameDataManager reference in Inspector after building connections
        this.inspector.setGameDataManager(this.gameDataManager);
        
        // Show success
        this.pathfindingUIController.showSuccess('Built connection graph');
    }

    /**
     * PRINTS GAME DATA MANAGER DATA TO CONSOLE
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
        
        // Also show success in UI
        this.pathfindingUIController.showSuccess('Data printed to console');
    }

    /**
     * CALCULATES NEXT SEGMENT
     */
    onCalculateNextSegment() {
        if (!this.pathfindingUIController.canCalculateNext()) {
            this.pathfindingUIController.showError('No segments to calculate');
            return;
        }

        try {
            // Create new HierarchicalPathfinding instance
            const pathfinder = new HierarchicalPathfinding();
            
            // Configuration with chunk dimensions from settings
            const config = {
                tileSize: this.settings.tileSize,
                gridWidth: this.gameDataManager.gridWidth,
                gridHeight: this.gameDataManager.gridHeight,
                chunkWidth: this.gameDataManager.chunkWidth,
                chunkHeight: this.gameDataManager.chunkHeight,
                getChunkData: (chunkId) => this.gameDataManager.getChunkData(chunkId),
                transitionPoints: this.gameDataManager.transitionPoints,
                
                // Algorithm and heuristic settings
                localAlgorithm: this.pathfindingSettings.localAlgorithm,
                localHeuristic: this.pathfindingSettings.localHeuristic,
                hierarchicalHeuristic: this.pathfindingSettings.hierarchicalHeuristic,
                heuristicWeight: this.pathfindingSettings.heuristicWeight
            };
            
            // Initialize pathfinder
            pathfinder.init(config);
            
            // Calculate next segment
            const result = this.pathfindingUIController.calculateNextSegment(
                pathfinder,
                this.gameDataManager.getChunkData.bind(this.gameDataManager)
            );
            
            if (result) {
                // Re-render map to show new segment
                this.renderMap();
            }
            
        } catch (error) {
            console.error('❌ Error calculating segment:', error);
            this.pathfindingUIController.showError(`Error: ${error.message}`);
        }
    }

    /**
     * CONFIGURES "CALCULATE PATH" BUTTON
     */
    setupCalculatePathButton() {
        const calculatePathBtn = document.getElementById('calculatePath');
        if (calculatePathBtn) {
            calculatePathBtn.addEventListener('click', () => {
                this.onCalculatePathfindingPath();
            });
        }
    }

    /**
     * CONFIGURES ZOOM CONTROLS
     */
    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomResetBtn = document.getElementById('zoomResetBtn');
        const toggleMouseZoomBtn = document.getElementById('toggleMouseZoomBtn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (this.renderer.zoomIn()) {
                    this.renderMap();
                }
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (this.renderer.zoomOut()) {
                    this.renderMap();
                }
            });
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                if (this.renderer.resetZoom()) {
                    this.renderMap();
                }
            });
        }

        if (toggleMouseZoomBtn) {
            toggleMouseZoomBtn.addEventListener('click', () => {
                this.renderer.toggleMouseWheelZoom();
                this.updateControlsHint();
            });
        }

        // Initialize zoom button states
        this.renderer.updateZoomButtons();
        
        // Update controls hint
        this.updateControlsHint();
    }

    /**
     * UPDATES CONTROLS HINT BASED ON CURRENT SETTINGS
     */
    updateControlsHint() {
        const controlsHint = document.getElementById('mapControlsHint');
        if (!controlsHint) return;

        const hints = [];
        
        hints.push('🖱️ Drag to pan');
        
        if (this.renderer.isMouseWheelZoomEnabled()) {
            hints.push('🔍 Scroll to zoom');
        }
        
        hints.push('🔍+/- Buttons to zoom');
        hints.push('⌨️ Escape to reset');
        
        controlsHint.textContent = hints.join(' • ');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChunkMapGenerator();
}); 