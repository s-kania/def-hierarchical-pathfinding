/**
 * Configuration class for hierarchical pathfinding
 * Centralizes all pathfinding parameters
 */
export class PathfindingConfig {
    constructor(options = {}) {
        // Algorithm settings
        this.localAlgorithm = options.localAlgorithm || 'astar';
        this.localHeuristic = options.localHeuristic || 'manhattan';
        this.hierarchicalHeuristic = options.hierarchicalHeuristic || 'manhattan';
        this.heuristicWeight = options.heuristicWeight || 1.0;

        // Grid settings
        this.tileSize = options.tileSize || 16;
        this.gridWidth = options.gridWidth || 8;
        this.gridHeight = options.gridHeight || 6;
        this.chunkWidth = options.chunkWidth || 11;
        this.chunkHeight = options.chunkHeight || 11;

        // Data providers
        this.getChunkData = options.getChunkData || (() => null);
        this.transitionPoints = options.transitionPoints || [];

        // Validation
        this.validate();
    }

    /**
     * Validate configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        if (!this.tileSize || this.tileSize <= 0) {
            throw new Error('tileSize must be positive');
        }

        if (!this.gridWidth || this.gridWidth <= 0) {
            throw new Error('gridWidth must be positive');
        }

        if (!this.gridHeight || this.gridHeight <= 0) {
            throw new Error('gridHeight must be positive');
        }

        if (!this.chunkWidth || this.chunkWidth <= 0) {
            throw new Error('chunkWidth must be positive');
        }

        if (!this.chunkHeight || this.chunkHeight <= 0) {
            throw new Error('chunkHeight must be positive');
        }

        if (typeof this.getChunkData !== 'function') {
            throw new Error('getChunkData must be a function');
        }

        if (!Array.isArray(this.transitionPoints)) {
            throw new Error('transitionPoints must be an array');
        }

        if (this.heuristicWeight <= 0) {
            throw new Error('heuristicWeight must be positive');
        }
    }

    /**
     * Get world dimensions
     * @returns {Object} - World width and height
     */
    getWorldDimensions() {
        return {
            width: this.gridWidth * this.chunkWidth * this.tileSize,
            height: this.gridHeight * this.chunkHeight * this.tileSize
        };
    }

    /**
     * Get chunk world size
     * @returns {number} - Chunk size in world units
     */
    getChunkWorldSize() {
        return this.chunkWidth * this.tileSize;
    }

    /**
     * Clone configuration with overrides
     * @param {Object} overrides - Configuration overrides
     * @returns {PathfindingConfig} - New configuration instance
     */
    clone(overrides = {}) {
        return new PathfindingConfig({
            ...this.toObject(),
            ...overrides
        });
    }

    /**
     * Convert to plain object
     * @returns {Object} - Configuration object
     */
    toObject() {
        return {
            localAlgorithm: this.localAlgorithm,
            localHeuristic: this.localHeuristic,
            hierarchicalHeuristic: this.hierarchicalHeuristic,
            heuristicWeight: this.heuristicWeight,
            tileSize: this.tileSize,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            chunkWidth: this.chunkWidth,
            chunkHeight: this.chunkHeight,
            getChunkData: this.getChunkData,
            transitionPoints: this.transitionPoints
        };
    }
} 