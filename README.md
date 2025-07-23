# def_hierarchical_pathfinding

A hierarchical pathfinding library for Defold engine, written in Lua. Enables efficient pathfinding in large worlds by dividing them into chunks and using transition points.

## Overview

The library implements a hierarchical approach to pathfinding that divides the game world into smaller chunks connected by transition points. This allows for efficient pathfinding in large environments by combining local algorithms (within chunks) with hierarchical algorithms (between chunks).

## Features

- **Hierarchical pathfinding** - divides the problem into smaller parts
- **Custom algorithm support** - ability to inject local and hierarchical algorithms
- **Flexible configuration** - adaptable to different world and chunk sizes
- **Path optimization** - automatic removal of redundant segments
- **Data validation** - verification of configuration and position correctness

## Architecture

### Main Components

- **HierarchicalPathfinder** - main class managing the pathfinding process
- **PathSegmentBuilder** - builds path segments between transition points
- **coord_utils** - coordinate conversion utilities

### Concepts

- **Chunk** - rectangular world area of fixed size
- **Transition Point** - point connecting two adjacent chunks
- **Local Pathfinding** - pathfinding within a single chunk
- **Hierarchical Pathfinding** - pathfinding between chunks

## Installation

1. Add the `def_hierarchical_pathfinding` folder to your Defold project
2. Include the extension in your `game.project` file:

```
[library]
include_dirs = def_hierarchical_pathfinding
```

## Usage

### Basic Configuration

```lua
local HierarchicalPathfinder = require("def_hierarchical_pathfinding.src.hierarchical_pathfinder")

-- Create pathfinder instance
local pathfinder = HierarchicalPathfinder.new()

-- Configuration
local config = {
    tile_size = 32,           -- Size of one cell in world units
    grid_width = 10,          -- World width in chunks
    grid_height = 10,         -- World height in chunks
    chunk_width = 16,         -- Chunk width in cells
    chunk_height = 16,        -- Chunk height in cells
    
    -- Function to get chunk data (2D array)
    get_chunk_data = function(chunk_id)
        -- Return 2D array representing passable/impassable tiles
        return your_chunk_data[chunk_id]
    end,
    
    -- Transition points between chunks
    transition_points = {
        {
            id = "tp1",
            chunks = {"0,0", "1,0"},  -- Chunks it connects
            position = 8,             -- Position on edge (0-15)
            connections = {           -- Connections to other points
                {id = "tp2", chunk = "1,0"}
            }
        }
        -- ... more points
    },
    
    -- Local pathfinding algorithm (e.g., A*)
    local_algorithm_fn = function(chunk_data, start_pos, end_pos)
        -- Implement your algorithm (A*, Dijkstra, etc.)
        -- Return true if path exists, false otherwise
        return your_local_pathfinding(chunk_data, start_pos, end_pos)
    end,
    
    -- Hierarchical algorithm (transition point graph)
    hierarchical_algorithm_fn = function(graph_data, start_id, end_id, options)
        -- Implement pathfinding algorithm on graph
        -- Return array of transition point IDs or nil
        return your_hierarchical_pathfinding(graph_data, start_id, end_id)
    end
}

-- Initialize pathfinder
pathfinder:init(config)
```

### Finding Paths

```lua
-- Positions in world units
local start_pos = {x = 100, y = 200}
local end_pos = {x = 800, y = 600}

-- Find path
local path_segments = pathfinder:find_path(start_pos, end_pos)

if path_segments then
    print("Path found!")
    for i, segment in ipairs(path_segments) do
        print("Segment " .. i .. ": chunk=" .. segment.chunk .. 
              ", position=(" .. segment.position.x .. "," .. segment.position.y .. ")")
    end
else
    print("Path not found")
end
```

## API Reference

### HierarchicalPathfinder

#### `HierarchicalPathfinder.new()`
Creates a new pathfinder instance.

**Returns:** `table` - New instance

#### `pathfinder:init(config)`
Initializes pathfinder with given configuration.

**Parameters:**
- `config` (`table`) - Configuration object

#### `pathfinder:find_path(start_pos, end_pos)`
Finds path between two positions.

**Parameters:**
- `start_pos` (`table`) - Start position `{x, y}`
- `end_pos` (`table`) - Target position `{x, y}`

**Returns:** `table|nil` - Array of path segments or `nil`

#### `pathfinder:validate_config(config)`
Validates configuration object.

**Parameters:**
- `config` (`table`) - Configuration to validate

**Throws:** Error if configuration is invalid

#### `pathfinder:find_local_path(chunk_id, start_pos, end_pos)`
Finds local path within a single chunk.

**Parameters:**
- `chunk_id` (`string`) - Chunk ID
- `start_pos` (`table`) - Start position (global)
- `end_pos` (`table`) - End position (global)

**Returns:** `table|nil` - Path segment or nil

#### `pathfinder:find_nearest_transition(pos, chunk_id)`
Finds nearest reachable transition point in given chunk.

**Parameters:**
- `pos` (`table`) - Position to find transition point for
- `chunk_id` (`string`) - Chunk ID

**Returns:** `table|nil` - Nearest available transition point

### PathSegmentBuilder

#### `PathSegmentBuilder.new(config, pathfinder)`
Creates new segment builder.

**Parameters:**
- `config` (`table`) - Configuration object
- `pathfinder` (`table`) - Pathfinder instance

**Returns:** `table` - New PathSegmentBuilder instance

#### `builder:build_segments(start_pos, end_pos, transition_path)`
Builds path segments from transition path.

**Parameters:**
- `start_pos` (`table`) - Start position
- `end_pos` (`table`) - End position
- `transition_path` (`table`) - Array of transition point IDs

**Returns:** `table` - Array of path segments

### coord_utils

#### `coord_utils.global_to_chunk_id(global_pos, chunk_width, chunk_height, tile_size)`
Converts global position to chunk ID.

**Parameters:**
- `global_pos` (`table`) - Global position `{x, y}`
- `chunk_width` (`number`) - Chunk width in tiles
- `chunk_height` (`number`) - Chunk height in tiles
- `tile_size` (`number`) - Tile size in world units

**Returns:** `string` - Chunk ID "x,y"

#### `coord_utils.global_to_local(global_pos, chunk_id, chunk_width, chunk_height, tile_size)`
Converts global position to local position within chunk.

**Parameters:**
- `global_pos` (`table`) - Global position `{x, y}`
- `chunk_id` (`string`) - Chunk ID
- `chunk_width` (`number`) - Chunk width in tiles
- `chunk_height` (`number`) - Chunk height in tiles
- `tile_size` (`number`) - Tile size in world units

**Returns:** `table` - Local position `{x, y}`

#### `coord_utils.local_to_global(local_pos, chunk_id, chunk_width, chunk_height, tile_size)`
Converts local position to global position.

**Parameters:**
- `local_pos` (`table`) - Local position `{x, y}`
- `chunk_id` (`string`) - Chunk ID
- `chunk_width` (`number`) - Chunk width in tiles
- `chunk_height` (`number`) - Chunk height in tiles
- `tile_size` (`number`) - Tile size in world units

**Returns:** `table` - Global position `{x, y}`

#### `coord_utils.get_transition_global_position(point, chunk_id, chunk_width, chunk_height, tile_size)`
Calculates global position of transition point.

**Parameters:**
- `point` (`table`) - Transition point
- `chunk_id` (`string`) - Chunk ID
- `chunk_width` (`number`) - Chunk width in tiles
- `chunk_height` (`number`) - Chunk height in tiles
- `tile_size` (`number`) - Tile size in world units

**Returns:** `table|nil` - Global position `{x, y}` or nil

## Algorithm Implementation Examples

### Local Algorithm (A*)

```lua
local function a_star_local(chunk_data, start_pos, end_pos)
    -- Simple A* implementation for 2D grid
    -- Return true if path exists
    -- ... A* implementation ...
    return true  -- or false
end
```

### Hierarchical Algorithm

```lua
local function dijkstra_hierarchical(graph_data, start_id, end_id, options)
    -- Dijkstra implementation for transition point graph
    -- graph_data.nodes - transition points map
    -- graph_data.connections - connections map
    -- ... implementation ...
    return {"tp1", "tp2", "tp3"}  -- or nil
end
```

## Configuration Example

### Transition Points Setup

```lua
local transition_points = {
    {
        id = "tp_0_0_to_1_0",
        chunks = {"0,0", "1,0"},
        position = 8,  -- Middle of right edge of chunk 0,0
        connections = {
            {id = "tp_1_0_to_1_1", chunk = "1,0"},
            {id = "tp_1_0_to_2_0", chunk = "1,0"}
        }
    },
    {
        id = "tp_1_0_to_1_1",
        chunks = {"1,0", "1,1"},
        position = 8,  -- Middle of bottom edge of chunk 1,0
        connections = {
            {id = "tp_0_0_to_1_0", chunk = "1,0"},
            {id = "tp_1_1_to_2_1", chunk = "1,1"}
        }
    }
    -- ... more transition points
}
```

## Optimization

- The library automatically optimizes paths by removing redundant segments
- For positions in the same chunk, it tries local pathfinding first
- Efficient search for nearest transition points
- Path segment verification and cleanup

## Requirements

- Defold 1.2.165+
- Lua 5.1+

## License

Check LICENSE.md file for license details.

## Support

For issues or questions, create an issue in the project repository.
