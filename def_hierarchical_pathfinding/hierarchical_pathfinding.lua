-- Hierarchical Pathfinding Library for Defold
-- Main module that orchestrates chunk-based pathfinding

local coord_utils = require "src.utils.coord_utils"
local chunk_navigator = require "src.chunk_navigator"
local path_segment_builder = require "src.path_segment_builder"
local local_pathfinder = require "src.local_pathfinder"

local M = {}

-- Module state
local config = nil
local chunk_graph = nil
local path_cache = nil

-- Initialize the pathfinding system
-- @param init_config Configuration table with required fields:
--   chunk_size: Size of chunk in tiles
--   tile_size: Size of tile in world units
--   map_width: Map width in chunks
--   map_height: Map height in chunks
--   get_chunk_data: Function(chunk_id) -> chunk_data
--   transition_points: Array of transition point data
function M.init(init_config)
    -- Validate required fields
    assert(init_config, "Configuration required")
    assert(type(init_config.chunk_size) == "number" and init_config.chunk_size > 0, 
        "Invalid chunk_size")
    assert(type(init_config.tile_size) == "number" and init_config.tile_size > 0, 
        "Invalid tile_size")
    assert(type(init_config.map_width) == "number" and init_config.map_width > 0, 
        "Invalid map_width")
    assert(type(init_config.map_height) == "number" and init_config.map_height > 0, 
        "Invalid map_height")
    assert(type(init_config.get_chunk_data) == "function", 
        "get_chunk_data must be a function")
    assert(type(init_config.transition_points) == "table", 
        "transition_points must be a table")
    
    -- Store configuration
    config = init_config
    
    -- Generate list of all chunk IDs
    local all_chunks = {}
    for y = 0, config.map_height - 1 do
        for x = 0, config.map_width - 1 do
            table.insert(all_chunks, coord_utils.coords_to_chunk_id(x, y))
        end
    end
    
    -- Build chunk navigation graph
    chunk_graph = chunk_navigator.build_chunk_graph(config.transition_points, all_chunks)
    
    -- Initialize cache if enabled
    if config.enable_cache then
        path_cache = {}
        config.cache_size = config.cache_size or 100
    end
end

-- Find path from start to end position
-- @param start_pos Global start position {x, y, z}
-- @param end_pos Global end position {x, y, z}
-- @return Array of segments {chunk, position} or nil if no path
function M.find_path(start_pos, end_pos)
    assert(config, "Pathfinder not initialized. Call init() first.")
    assert(start_pos and start_pos.x and start_pos.y, "Invalid start position")
    assert(end_pos and end_pos.x and end_pos.y, "Invalid end position")
    
    -- Check cache
    if path_cache then
        local cache_key = string.format("%d,%d_%d,%d", 
            start_pos.x, start_pos.y, end_pos.x, end_pos.y)
        local cached = path_cache[cache_key]
        if cached then
            return cached.segments
        end
    end
    
    -- Get chunk IDs
    local start_chunk = coord_utils.global_to_chunk_id(start_pos, config.chunk_size, config.tile_size)
    local end_chunk = coord_utils.global_to_chunk_id(end_pos, config.chunk_size, config.tile_size)
    
    -- Check if positions are walkable
    local start_local = coord_utils.global_to_local(start_pos, start_chunk, config.chunk_size, config.tile_size)
    local end_local = coord_utils.global_to_local(end_pos, end_chunk, config.chunk_size, config.tile_size)
    
    local start_chunk_data = config.get_chunk_data(start_chunk)
    local end_chunk_data = config.get_chunk_data(end_chunk)
    
    if not start_chunk_data or not end_chunk_data then
        return nil
    end
    
    if not local_pathfinder.is_walkable(start_chunk_data, start_local) or
       not local_pathfinder.is_walkable(end_chunk_data, end_local) then
        return nil
    end
    
    -- Find chunk path
    local chunk_path = chunk_navigator.find_chunk_path(chunk_graph, start_chunk, end_chunk)
    if not chunk_path then
        return nil
    end
    
    -- Build path segments
    local segments = path_segment_builder.build_segments(
        chunk_path, start_pos, end_pos, config
    )
    
    -- Cache result
    if path_cache and segments then
        local cache_key = string.format("%d,%d_%d,%d", 
            start_pos.x, start_pos.y, end_pos.x, end_pos.y)
        
        -- Simple LRU: remove oldest if cache full
        local cache_count = 0
        for _ in pairs(path_cache) do
            cache_count = cache_count + 1
        end
        
        if cache_count >= config.cache_size then
            -- Remove first found (simple eviction)
            for k in pairs(path_cache) do
                path_cache[k] = nil
                break
            end
        end
        
        path_cache[cache_key] = {
            segments = segments,
            timestamp = os.time()
        }
    end
    
    return segments
end

-- Helper function to get chunk ID from global position
-- @param global_pos Global position
-- @return Chunk ID string
function M.get_chunk_from_global(global_pos)
    assert(config, "Pathfinder not initialized")
    return coord_utils.global_to_chunk_id(global_pos, config.chunk_size, config.tile_size)
end

-- Convert global position to local within chunk
-- @param global_pos Global position
-- @param chunk_id Chunk ID
-- @return Local position {x, y}
function M.global_to_local(global_pos, chunk_id)
    assert(config, "Pathfinder not initialized")
    return coord_utils.global_to_local(global_pos, chunk_id, config.chunk_size, config.tile_size)
end

-- Convert local position to global
-- @param local_pos Local position within chunk
-- @param chunk_id Chunk ID
-- @return Global position {x, y, z}
function M.local_to_global(local_pos, chunk_id)
    assert(config, "Pathfinder not initialized")
    return coord_utils.local_to_global(local_pos, chunk_id, config.chunk_size, config.tile_size)
end

-- Check if position is walkable
-- @param global_pos Global position
-- @return boolean
function M.is_position_walkable(global_pos)
    assert(config, "Pathfinder not initialized")
    
    local chunk_id = M.get_chunk_from_global(global_pos)
    local chunk_data = config.get_chunk_data(chunk_id)
    
    if not chunk_data then
        return false
    end
    
    local local_pos = M.global_to_local(global_pos, chunk_id)
    return local_pathfinder.is_walkable(chunk_data, local_pos)
end

-- Check if two positions can reach each other
-- @param start_pos Start position
-- @param end_pos End position
-- @return boolean
function M.can_reach(start_pos, end_pos)
    local segments = M.find_path(start_pos, end_pos)
    return segments ~= nil
end

-- Clear path cache
function M.clear_cache()
    if path_cache then
        path_cache = {}
    end
end

return M 