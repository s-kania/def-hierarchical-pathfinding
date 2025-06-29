-- Transition point resolver for hierarchical pathfinding
-- Manages selection and validation of transition points between chunks

local coord_utils = require "src.utils.coord_utils"

local M = {}

-- Get a transition point between two chunks
-- @param from_chunk Source chunk ID
-- @param to_chunk Destination chunk ID
-- @param transition_points Array of all transition points
-- @return Transition point or nil
function M.get_transition_point(from_chunk, to_chunk, transition_points)
    for _, point in ipairs(transition_points) do
        local chunks = point.chunks
        if (#chunks == 2) and 
           ((chunks[1] == from_chunk and chunks[2] == to_chunk) or
            (chunks[1] == to_chunk and chunks[2] == from_chunk)) then
            return point
        end
    end
    return nil
end

-- Get all transition points between two chunks
-- @param from_chunk Source chunk ID
-- @param to_chunk Destination chunk ID
-- @param transition_points Array of all transition points
-- @return Array of transition points
function M.get_all_transition_points(from_chunk, to_chunk, transition_points)
    local points = {}
    
    for _, point in ipairs(transition_points) do
        local chunks = point.chunks
        if (#chunks == 2) and 
           ((chunks[1] == from_chunk and chunks[2] == to_chunk) or
            (chunks[1] == to_chunk and chunks[2] == from_chunk)) then
            table.insert(points, point)
        end
    end
    
    return points
end

-- Select optimal transition point based on positions
-- @param from_pos Starting position (global)
-- @param to_pos Target position (global)
-- @param available_points Array of transition points to choose from
-- @param chunk_size Chunk size in tiles
-- @param tile_size Tile size in world units
-- @return Best transition point or nil
function M.get_optimal_transition(from_pos, to_pos, available_points, chunk_size, tile_size)
    if #available_points == 0 then
        return nil
    end
    
    if #available_points == 1 then
        return available_points[1]
    end
    
    -- Find transition point that minimizes total distance
    local best_point = nil
    local best_score = math.huge
    
    for _, point in ipairs(available_points) do
        -- Get position of this transition point
        local trans_pos = M.get_transition_position(
            point, 
            point.chunks[1], 
            point.chunks[2], 
            chunk_size, 
            tile_size
        )
        
        -- Calculate combined distance: from start to transition + heuristic to end
        local dist_to_trans = math.abs(from_pos.x - trans_pos.x) + 
                             math.abs(from_pos.y - trans_pos.y)
        local dist_to_end = math.abs(trans_pos.x - to_pos.x) + 
                           math.abs(trans_pos.y - to_pos.y)
        
        local score = dist_to_trans + dist_to_end * 0.5  -- Weight future distance less
        
        if score < best_score then
            best_score = score
            best_point = point
        end
    end
    
    return best_point
end

-- Calculate global position of a transition point
-- @param point Transition point
-- @param from_chunk Chunk we're transitioning from
-- @param to_chunk Chunk we're transitioning to
-- @param chunk_size Chunk size in tiles
-- @param tile_size Tile size in world units
-- @return Global position {x, y, z}
function M.get_transition_position(point, from_chunk, to_chunk, chunk_size, tile_size)
    local from_coords = coord_utils.chunk_id_to_coords(from_chunk)
    local to_coords = coord_utils.chunk_id_to_coords(to_chunk)
    
    local position = point.position
    local chunk_world_size = chunk_size * tile_size
    
    -- Determine transition direction and calculate position
    -- Position should be at the last tile of from_chunk, not at the edge pixel
    if to_coords.x > from_coords.x then
        -- Moving right - position at rightmost tile center of from_chunk
        return {
            x = from_coords.x * chunk_world_size + (chunk_size - 1) * tile_size + tile_size / 2,
            y = from_coords.y * chunk_world_size + position * tile_size + tile_size / 2,
            z = 0
        }
    elseif to_coords.x < from_coords.x then
        -- Moving left - position at leftmost tile center of from_chunk
        return {
            x = from_coords.x * chunk_world_size + tile_size / 2,
            y = from_coords.y * chunk_world_size + position * tile_size + tile_size / 2,
            z = 0
        }
    elseif to_coords.y > from_coords.y then
        -- Moving down - position at bottommost tile center of from_chunk
        return {
            x = from_coords.x * chunk_world_size + position * tile_size + tile_size / 2,
            y = from_coords.y * chunk_world_size + (chunk_size - 1) * tile_size + tile_size / 2,
            z = 0
        }
    else  -- to_coords.y < from_coords.y
        -- Moving up - position at topmost tile center of from_chunk
        return {
            x = from_coords.x * chunk_world_size + position * tile_size + tile_size / 2,
            y = from_coords.y * chunk_world_size + tile_size / 2,
            z = 0
        }
    end
end

-- Validate if transition point is accessible
-- @param point Transition point
-- @param chunk_data_getter Function to get chunk data
-- @return boolean
function M.validate_transition_point(point, chunk_data_getter)
    local chunks = point.chunks
    if #chunks ~= 2 then
        return false
    end
    
    -- Check both sides of transition
    for _, chunk_id in ipairs(chunks) do
        local chunk_data = chunk_data_getter(chunk_id)
        if not chunk_data then
            return false
        end
        
        -- Determine which edge to check based on chunk positions
        local other_chunk = chunk_id == chunks[1] and chunks[2] or chunks[1]
        local coords = coord_utils.chunk_id_to_coords(chunk_id)
        local other_coords = coord_utils.chunk_id_to_coords(other_chunk)
        
        local tile_x, tile_y
        
        if other_coords.x > coords.x then
            -- Check right edge
            tile_x = #chunk_data[1] - 1  -- Rightmost column (0-indexed)
            tile_y = point.position
        elseif other_coords.x < coords.x then
            -- Check left edge
            tile_x = 0
            tile_y = point.position
        elseif other_coords.y > coords.y then
            -- Check bottom edge
            tile_x = point.position
            tile_y = #chunk_data - 1  -- Bottom row (0-indexed)
        else
            -- Check top edge
            tile_x = point.position
            tile_y = 0
        end
        
        -- Check if tile is walkable (water = 0)
        local row = chunk_data[tile_y + 1]  -- Convert to 1-indexed
        if not row or row[tile_x + 1] ~= 0 then
            return false
        end
    end
    
    return true
end

-- Filter valid transition points
-- @param transition_points Array of transition points
-- @param chunk_data_getter Function to get chunk data
-- @return Array of valid transition points
function M.filter_valid_transitions(transition_points, chunk_data_getter)
    local valid = {}
    
    for _, point in ipairs(transition_points) do
        if M.validate_transition_point(point, chunk_data_getter) then
            table.insert(valid, point)
        end
    end
    
    return valid
end

-- Find alternative transition when primary is blocked
-- @param primary_point Primary transition point (blocked)
-- @param all_transitions All available transition points
-- @param chunk_data_getter Function to get chunk data
-- @return Alternative transition point or nil
function M.find_alternative_transition(primary_point, all_transitions, chunk_data_getter)
    local chunks = primary_point.chunks
    if #chunks ~= 2 then
        return nil
    end
    
    -- Find all transitions between same chunks
    local alternatives = M.get_all_transition_points(chunks[1], chunks[2], all_transitions)
    
    -- Filter out the blocked one and validate others
    local valid_alternatives = {}
    for _, point in ipairs(alternatives) do
        if point.id ~= primary_point.id and 
           M.validate_transition_point(point, chunk_data_getter) then
            table.insert(valid_alternatives, point)
        end
    end
    
    -- Return first valid alternative
    return valid_alternatives[1]
end

return M 