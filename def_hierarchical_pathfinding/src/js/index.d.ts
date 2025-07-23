/**
 * TypeScript declarations for Hierarchical Pathfinding Library
 * This file provides type definitions for better TypeScript integration
 */

// Basic types
export interface Point {
    x: number;
    y: number;
}

export interface PathSegment {
    chunk: string;
    position: Point;
}

export interface TransitionPoint {
    id: string;
    position: Point;
    chunks: string[];
    connections: Array<{
        id: string;
        chunk: string;
        weight?: number;
    }>;
}

// Chunk data type (2D array where 0 = walkable, 1 = blocked)
export type ChunkData = number[][];

// Injectable algorithm types
export type LocalAlgorithmFn = (chunkData: ChunkData, startPos: Point, endPos: Point, config?: AlgorithmConfig) => Point[] | null;
export type HierarchicalAlgorithmFn = (graphData: { nodes: Map<string, any>; connections: Map<string, any[]> }, startId: string, endId: string, config?: AlgorithmConfig) => string[] | null;

export interface Config {
    // Grid configuration
    gridWidth: number;
    gridHeight: number;
    chunkWidth: number;
    chunkHeight: number;
    tileSize: number;
    
    // Algorithm injection
    localAlgorithmFn: LocalAlgorithmFn;
    hierarchicalAlgorithmFn: HierarchicalAlgorithmFn;
    
    // Data providers
    getChunkData: (chunkId: string) => ChunkData | null;
    transitionPoints: TransitionPoint[];
}

// Algorithm configuration
export interface AlgorithmConfig {
    allowDiagonal?: boolean;
    [key: string]: any;
}

// Main pathfinding classes
export declare class HierarchicalPathfinder {
    constructor();
    
    config: Config | null;
    localAlgorithmFn: LocalAlgorithmFn | null;
    hierarchicalAlgorithmFn: HierarchicalAlgorithmFn | null;
    segmentBuilder: PathSegmentBuilder | null;
    
    init(config: Config): void;
     findPath(startPos: Point, endPos: Point): PathSegment[] | null;
    findLocalPath(chunkId: string, startPos: Point, endPos: Point): PathSegment[] | null;
    findTransitionPath(startId: string, endId: string): string[] | null;
    findNearestTransition(pos: Point, chunkId: string): TransitionPoint | null;
    validateConfig(config: Config): void;
    validatePositions(startPos: Point, endPos: Point): void;
    arePositionsInBounds(startPos: Point, endPos: Point): boolean;
    getTransitionPointsMap(): Map<string, TransitionPoint>;
    getTransitionConnectionsMap(): Map<string, Array<{id: string; weight?: number}>>;
    getPointsInChunk(chunkId: string): TransitionPoint[];
    getConfig(): Config | null;
    getLocalAlgorithmFn(): LocalAlgorithmFn | null;
    getHierarchicalAlgorithmFn(): HierarchicalAlgorithmFn | null;
}

export declare class PathSegmentBuilder {
    constructor(config: Config, pathfinder?: HierarchicalPathfinder | null);
    
    config: Config;
    pathfinder: HierarchicalPathfinder | null;
    
    buildSegments(startPos: Point, endPos: Point, transitionPath: string[]): PathSegment[];
    findConnectionChunk(fromPoint: TransitionPoint, toPoint: TransitionPoint): string | null;
}

// Utility functions
export declare class CoordUtils {
    static globalToChunkId(globalPos: Point, chunkWidth: number, chunkHeight: number, tileSize: number): string;
    static globalToLocal(globalPos: Point, chunkId: string, chunkWidth: number, chunkHeight: number, tileSize: number): Point;
    static localToGlobal(localPos: Point, chunkId: string, chunkWidth: number, chunkHeight: number, tileSize: number): Point;
    static chunkIdToCoords(chunkId: string): Point;
    static getTransitionLocalPosition(point: TransitionPoint, chunkId: string, chunkWidth: number, chunkHeight: number): Point | null;
    static getTransitionGlobalPosition(point: TransitionPoint, chunkId: string, chunkWidth: number, chunkHeight: number, tileSize: number): Point | null;
}

 