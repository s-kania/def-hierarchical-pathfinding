-- Simplified coordinate utilities for hierarchical pathfinding
-- Contains only essential functions following KISS principle

local M = {}

-- Convert global position to chunk ID
-- @param global_pos table - Global position {x, y}
-- @param chunk_width number - Chunk width in tiles
-- @param chunk_height number - Chunk height in tiles
-- @param tile_size number - Tile size in world units
-- @returns string - Chunk ID "x,y"
function M.global_to_chunk_id(global_pos, chunk_width, chunk_height, tile_size)
    local chunk_world_width = chunk_width * tile_size
    local chunk_world_height = chunk_height * tile_size
    local chunk_x = math.floor(global_pos.x / chunk_world_width)
    local chunk_y = math.floor(global_pos.y / chunk_world_height)
    return chunk_x .. "," .. chunk_y
end

-- Convert global position to local position within chunk
-- @param global_pos table - Global position {x, y}
-- @param chunk_id string - Chunk ID
-- @param chunk_width number - Chunk width in tiles
-- @param chunk_height number - Chunk height in tiles
-- @param tile_size number - Tile size in world units
-- @returns table - Local position {x, y}
function M.global_to_local(global_pos, chunk_id, chunk_width, chunk_height, tile_size)
    local chunk_coords = M.chunk_id_to_coords(chunk_id)
    local chunk_world_width = chunk_width * tile_size
    local chunk_world_height = chunk_height * tile_size
    local local_x = math.floor((global_pos.x - chunk_coords.x * chunk_world_width) / tile_size)
    local local_y = math.floor((global_pos.y - chunk_coords.y * chunk_world_height) / tile_size)
    
    -- Clamp to chunk boundaries (Lua uses 0-based indexing for grid coordinates)
    return {
        x = math.max(0, math.min(chunk_width - 1, local_x)),
        y = math.max(0, math.min(chunk_height - 1, local_y))
    }
end

-- Convert local position to global position
-- @param local_pos table - Local position {x, y}
-- @param chunk_id string - Chunk ID
-- @param chunk_width number - Chunk width in tiles
-- @param chunk_height number - Chunk height in tiles
-- @param tile_size number - Tile size in world units
-- @returns table - Global position {x, y}
function M.local_to_global(local_pos, chunk_id, chunk_width, chunk_height, tile_size)
    local chunk_coords = M.chunk_id_to_coords(chunk_id)
    local chunk_world_width = chunk_width * tile_size
    local chunk_world_height = chunk_height * tile_size
    
    return {
        x = chunk_coords.x * chunk_world_width + local_pos.x * tile_size + tile_size / 2,
        y = chunk_coords.y * chunk_world_height + local_pos.y * tile_size + tile_size / 2
    }
end

-- Convert chunk ID to coordinates
-- @param chunk_id string - Chunk ID "x,y"
-- @returns table - Chunk coordinates {x, y}
function M.chunk_id_to_coords(chunk_id)
    local x_str, y_str = chunk_id:match("([^,]+),([^,]+)")
    return {
        x = tonumber(x_str),
        y = tonumber(y_str)
    }
end

-- Helper function to check if table contains value
-- @param table_to_check table - Table to search in
-- @param value any - Value to find
-- @returns boolean - True if found
local function table_contains(table_to_check, value)
    for _, v in ipairs(table_to_check) do
        if v == value then
            return true
        end
    end
    return false
end

-- Calculate transition point position in chunk
-- @param point table - Transition point
-- @param chunk_id string - Chunk ID
-- @param chunk_width number - Chunk width in tiles
-- @param chunk_height number - Chunk height in tiles
-- @returns table|nil - Local position {x, y} or nil
function M.get_transition_local_position(point, chunk_id, chunk_width, chunk_height)
    if not table_contains(point.chunks, chunk_id) then
        return nil
    end
    
    local other_chunk_id = nil
    for _, id in ipairs(point.chunks) do
        if id ~= chunk_id then
            other_chunk_id = id
            break
        end
    end
    
    if not other_chunk_id then
        return nil
    end
    
    local coords = M.chunk_id_to_coords(chunk_id)
    local other_coords = M.chunk_id_to_coords(other_chunk_id)
    
    -- Determine position on chunk edge based on direction
    local dx = other_coords.x - coords.x
    local dy = other_coords.y - coords.y
    
    if dx > 0 then 
        return { x = chunk_width - 1, y = point.position }
    elseif dx < 0 then 
        return { x = 0, y = point.position }
    elseif dy > 0 then 
        return { x = point.position, y = chunk_height - 1 }
    elseif dy < 0 then 
        return { x = point.position, y = 0 }
    end
    
    return nil
end

-- Calculate global position of transition point
-- @param point table - Transition point
-- @param chunk_id string - Chunk ID
-- @param chunk_width number - Chunk width in tiles
-- @param chunk_height number - Chunk height in tiles
-- @param tile_size number - Tile size in world units
-- @returns table|nil - Global position {x, y} or nil
function M.get_transition_global_position(point, chunk_id, chunk_width, chunk_height, tile_size)
    local local_pos = M.get_transition_local_position(point, chunk_id, chunk_width, chunk_height)
    if not local_pos then
        return nil
    end
    
    return M.local_to_global(local_pos, chunk_id, chunk_width, chunk_height, tile_size)
end

return M 