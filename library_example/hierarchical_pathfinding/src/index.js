/**
 * Hierarchical Pathfinding Library - Simplified Architecture
 * Main entry point with all exports
 */

// Main pathfinding classes
export { HierarchicalPathfinder } from './pathfinders/HierarchicalPathfinder.js';
export { LocalPathfinder } from './pathfinders/LocalPathfinder.js';
export { TransitionPathfinder } from './pathfinders/TransitionPathfinder.js';

// Algorithms
export { PathfindingAlgorithm } from './algorithms/PathfindingAlgorithm.js';
export { AStarAlgorithm } from './algorithms/AStarAlgorithm.js';
export { JPSAlgorithm } from './algorithms/JPSAlgorithm.js';

// Heuristics
export { Heuristic } from './heuristics/Heuristic.js';
export { ManhattanHeuristic } from './heuristics/ManhattanHeuristic.js';
export { EuclideanHeuristic } from './heuristics/EuclideanHeuristic.js';

// Builders
export { PathSegmentBuilder } from './builders/PathSegmentBuilder.js';

// Utils
export { CoordUtils } from './utils/CoordUtils.js';

// Legacy compatibility - export old class name
export { HierarchicalPathfinder as HierarchicalPathfinding } from './pathfinders/HierarchicalPathfinder.js'; 