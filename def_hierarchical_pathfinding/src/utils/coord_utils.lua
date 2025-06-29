-- Coordinate utilities for hierarchical pathfinding
-- Handles conversions between global, chunk, and local coordinate systems

local M = {}

-- Parse chunk ID string to coordinates
-- @param chunk_id String in format "x,y" (e.g., "2,3" or "-1,5")
-- @return Table with x and y fields
function M.chunk_id_to_coords(chunk_id)
    if type(chunk_id) ~= "string" or chunk_id == "" then
        error("Invalid chunk_id: must be non-empty string")
    end
    
    local x, y = chunk_id:match("^(%-?%d+),(%-?%d+)$")
    if not x or not y then
        error("Invalid chunk_id format: " .. tostring(chunk_id))
    end
    
    return {x = tonumber(x), y = tonumber(y)}
end

-- Convert chunk coordinates to chunk ID string
-- @param x Chunk X coordinate
-- @param y Chunk Y coordinate
-- @return String in format "x,y"
function M.coords_to_chunk_id(x, y)
    if type(x) ~= "number" or type(y) ~= "number" then
        error("Invalid coordinates: x and y must be numbers")
    end
    
    return string.format("%d,%d", x, y)
end

-- Convert global position to chunk ID
-- @param global_pos Global position with x, y, z fields
-- @param chunk_size Size of chunk in tiles
-- @param tile_size Size of tile in world units
-- @return Chunk ID string
function M.global_to_chunk_id(global_pos, chunk_size, tile_size)
    local chunk_size_world = chunk_size * tile_size
    
    -- Calculate chunk coordinates
    local chunk_x = math.floor(global_pos.x / chunk_size_world)
    local chunk_y = math.floor(global_pos.y / chunk_size_world)
    
    return M.coords_to_chunk_id(chunk_x, chunk_y)
end

-- Convert global position to local position within chunk
-- @param global_pos Global position
-- @param chunk_id Chunk ID where the position is
-- @param chunk_size Size of chunk in tiles
-- @param tile_size Size of tile in world units
-- @return Local position {x, y} in tile coordinates (0 to chunk_size-1)
function M.global_to_local(global_pos, chunk_id, chunk_size, tile_size)
    local chunk_coords = M.chunk_id_to_coords(chunk_id)
    local chunk_size_world = chunk_size * tile_size
    
    -- Calculate chunk origin in world coordinates
    local chunk_origin_x = chunk_coords.x * chunk_size_world
    local chunk_origin_y = chunk_coords.y * chunk_size_world
    
    -- Calculate local position within chunk
    local local_x = math.floor((global_pos.x - chunk_origin_x) / tile_size)
    local local_y = math.floor((global_pos.y - chunk_origin_y) / tile_size)
    
    -- Validate that position is within chunk bounds
    if local_x < 0 or local_x >= chunk_size or local_y < 0 or local_y >= chunk_size then
        error(string.format("Position (%d, %d) outside chunk %s bounds", 
            global_pos.x, global_pos.y, chunk_id))
    end
    
    return {x = local_x, y = local_y}
end

-- Convert local position to global position
-- @param local_pos Local position within chunk {x, y}
-- @param chunk_id Chunk ID
-- @param chunk_size Size of chunk in tiles
-- @param tile_size Size of tile in world units
-- @return Global position {x, y, z}
function M.local_to_global(local_pos, chunk_id, chunk_size, tile_size)
    -- Validate local position
    if local_pos.x < 0 or local_pos.x >= chunk_size or 
       local_pos.y < 0 or local_pos.y >= chunk_size then
        error(string.format("Local position (%d, %d) outside chunk bounds", 
            local_pos.x, local_pos.y))
    end
    
    local chunk_coords = M.chunk_id_to_coords(chunk_id)
    local chunk_size_world = chunk_size * tile_size
    
    -- Calculate chunk origin
    local chunk_origin_x = chunk_coords.x * chunk_size_world
    local chunk_origin_y = chunk_coords.y * chunk_size_world
    
    -- Calculate global position (top-left corner of tile)
    local global_x = chunk_origin_x + local_pos.x * tile_size
    local global_y = chunk_origin_y + local_pos.y * tile_size
    
    return {x = global_x, y = global_y, z = 0}
end

-- Calculate global position of tile center
-- @param tile_x Local tile X coordinate (0-based)
-- @param tile_y Local tile Y coordinate (0-based)
-- @param chunk_id Chunk ID
-- @param chunk_size Size of chunk in tiles
-- @param tile_size Size of tile in world units
-- @return Global position of tile center {x, y, z}
function M.tile_center_to_global(tile_x, tile_y, chunk_id, chunk_size, tile_size)
    -- Validate tile coordinates
    if tile_x < 0 or tile_x >= chunk_size or tile_y < 0 or tile_y >= chunk_size then
        error(string.format("Tile coordinates (%d, %d) outside chunk bounds", 
            tile_x, tile_y))
    end
    
    -- Get top-left corner of tile
    local tile_pos = M.local_to_global({x = tile_x, y = tile_y}, chunk_id, chunk_size, tile_size)
    
    -- Add half tile size to get center
    tile_pos.x = tile_pos.x + tile_size / 2
    tile_pos.y = tile_pos.y + tile_size / 2
    
    return tile_pos
end

return M 