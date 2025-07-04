# Hierarchical Pathfinding

High-performance hierarchical pathfinding library for games and applications.

## Features
- 🚀 Ultra-fast hierarchical pathfinding
- 🎯 A* algorithm with pre-computed transition graph
- 🔧 Simple and flexible API
- 📱 Works in browser and Node.js
- 🎮 Game-ready with chunk-based navigation

## Installation
```bash
npm install hierarchical-pathfinding
```

## Quick Start
```javascript
import { HierarchicalPathfinding } from 'hierarchical-pathfinding';

const pathfinder = new HierarchicalPathfinding();

pathfinder.init({
    tileSize: 10,
    gridWidth: 10,
    gridHeight: 8,
    chunkWidth: 32,
    chunkHeight: 32,
    getChunkData: (chunkId) => chunks[chunkId],
    transitionPoints: transitionPoints
});

const path = pathfinder.findPath(
    { x: 10, y: 10 },
    { x: 500, y: 500 }
);
```

## API Reference

### Initialization
```javascript
pathfinder.init({
    tileSize: number,        // Tile size in world units
    gridWidth: number,       // Grid width in chunks
    gridHeight: number,      // Grid height in chunks
    chunkWidth: number,      // Chunk width in tiles
    chunkHeight: number,     // Chunk height in tiles
    getChunkData: function,  // Function returning chunk data
    transitionPoints: array  // Pre-computed transition points
});
```

### Pathfinding
```javascript
// Find path between two positions
const path = pathfinder.findPath(startPos, endPos);
// Returns: Array of segments [{chunk: "0,0", position: {x, y, z}}] or null

// Find path within a single chunk
const localPath = pathfinder.findLocalPath(chunkId, startPos, endPos);
```

### Data Format

#### Chunk Data
```javascript
// 2D array where 0 = walkable, 1 = blocked
[
    [0, 0, 0, 1, 1],  // 0 = walkable
    [0, 0, 0, 1, 1],  // 1 = blocked
    [0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 1, 0, 0, 0]
]
```

#### Transition Points
```javascript
{
    id: string,              // Unique identifier
    chunks: [string],        // Connected chunk IDs
    position: number,        // Position on chunk edge
    connections: [           // Pre-computed connections
        {
            id: string,      // Connected point ID
            weight: number   // Connection cost
            chunk: string    // ID of chunk on which connection occurs
        }
    ]
}
```

## Examples
See `examples/basic-usage.html` for complete working example.

## How It Works

1. **Chunk-based Navigation**: World is divided into chunks for efficient pathfinding
2. **Pre-computed Graph**: Transition points between chunks are pre-calculated
3. **Hierarchical Search**: 
   - Same chunk: Direct A* pathfinding
   - Different chunks: Find path through transition points, then local paths
4. **Optimization**: Redundant nodes are automatically removed

## Performance

- **Time Complexity**: O(n) where n is number of transition points
- **Space Complexity**: O(n) for transition graph
- **Local Pathfinding**: O(chunk_size²) for A* within chunks

## License
MIT License - see LICENSE file for details. 