import { PathfindingConfig } from './PathfindingConfig.js';

/**
 * Builder pattern for PathfindingConfig
 * Provides fluent interface for configuration
 */
export class ConfigBuilder {
    constructor() {
        this.options = {};
    }

    /**
     * Set local algorithm
     * @param {string} algorithm - Algorithm type
     * @returns {ConfigBuilder} - This builder instance
     */
    withLocalAlgorithm(algorithm) {
        this.options.localAlgorithm = algorithm;
        return this;
    }

    /**
     * Set local heuristic
     * @param {string} heuristic - Heuristic name
     * @returns {ConfigBuilder} - This builder instance
     */
    withLocalHeuristic(heuristic) {
        this.options.localHeuristic = heuristic;
        return this;
    }

    /**
     * Set hierarchical heuristic
     * @param {string} heuristic - Heuristic name
     * @returns {ConfigBuilder} - This builder instance
     */
    withHierarchicalHeuristic(heuristic) {
        this.options.hierarchicalHeuristic = heuristic;
        return this;
    }

    /**
     * Set heuristic weight
     * @param {number} weight - Heuristic weight
     * @returns {ConfigBuilder} - This builder instance
     */
    withHeuristicWeight(weight) {
        this.options.heuristicWeight = weight;
        return this;
    }

    /**
     * Set tile size
     * @param {number} tileSize - Tile size in world units
     * @returns {ConfigBuilder} - This builder instance
     */
    withTileSize(tileSize) {
        this.options.tileSize = tileSize;
        return this;
    }

    /**
     * Set grid dimensions
     * @param {number} width - Grid width in chunks
     * @param {number} height - Grid height in chunks
     * @returns {ConfigBuilder} - This builder instance
     */
    withGridDimensions(width, height) {
        this.options.gridWidth = width;
        this.options.gridHeight = height;
        return this;
    }

    /**
     * Set chunk dimensions
     * @param {number} width - Chunk width in tiles
     * @param {number} height - Chunk height in tiles
     * @returns {ConfigBuilder} - This builder instance
     */
    withChunkDimensions(width, height) {
        this.options.chunkWidth = width;
        this.options.chunkHeight = height;
        return this;
    }

    /**
     * Set chunk data provider
     * @param {Function} getChunkData - Function to get chunk data
     * @returns {ConfigBuilder} - This builder instance
     */
    withChunkDataProvider(getChunkData) {
        this.options.getChunkData = getChunkData;
        return this;
    }

    /**
     * Set transition points
     * @param {Array} transitionPoints - Array of transition points
     * @returns {ConfigBuilder} - This builder instance
     */
    withTransitionPoints(transitionPoints) {
        this.options.transitionPoints = transitionPoints;
        return this;
    }

    /**
     * Build configuration
     * @returns {PathfindingConfig} - Configuration instance
     */
    build() {
        return new PathfindingConfig(this.options);
    }

    /**
     * Create default configuration
     * @returns {ConfigBuilder} - Builder with default values
     */
    static createDefault() {
        return new ConfigBuilder()
            .withLocalAlgorithm('astar')
            .withLocalHeuristic('manhattan')
            .withHierarchicalHeuristic('manhattan')
            .withHeuristicWeight(1.0)
            .withTileSize(16)
            .withGridDimensions(8, 6)
            .withChunkDimensions(11, 11);
    }
} 