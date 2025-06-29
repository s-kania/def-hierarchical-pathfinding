-- Path segment builder for hierarchical pathfinding
-- Builds movement segments through chunks with local pathfinding

local coord_utils = require "src.utils.coord_utils"
local local_pathfinder = require "src.local_pathfinder"
local transition_resolver = require "src.transition_resolver"

local M = {}

-- Build path segments from chunk path
-- @param chunk_path Array of chunk IDs
-- @param start_pos Global start position
-- @param end_pos Global end position
-- @param config Configuration with chunk_size, tile_size, get_chunk_data, transition_points
-- @return Array of segments {chunk, position} or nil if path cannot be built
function M.build_segments(chunk_path, start_pos, end_pos, config)
    -- Validate inputs
    if not chunk_path or #chunk_path == 0 then
        return nil
    end
    
    -- Allow dependency injection for testing
    local l_pathfinder = config._local_pathfinder or local_pathfinder
    local t_resolver = config._transition_resolver or transition_resolver
    local c_utils = config._coord_utils or coord_utils
    
    local segments = {}
    
    -- Single chunk case
    if #chunk_path == 1 then
        -- Path entirely within one chunk
        local chunk_id = chunk_path[1]
        local chunk_data = config.get_chunk_data(chunk_id)
        if not chunk_data then
            return nil
        end
        
        -- Convert to local coordinates
        local local_start = c_utils.global_to_local(start_pos, chunk_id, config.chunk_size, config.tile_size)
        local local_end = c_utils.global_to_local(end_pos, chunk_id, config.chunk_size, config.tile_size)
        
        -- Find local path
        local local_path = l_pathfinder.find_path(chunk_data, local_start, local_end)
        if not local_path then
            return nil
        end
        
        -- Only add final position as segment
        table.insert(segments, {
            chunk = chunk_id,
            position = end_pos
        })
        
        return segments
    end
    
    -- Multi-chunk path
    local current_pos = start_pos
    
    for i = 1, #chunk_path do
        local chunk_id = chunk_path[i]
        local chunk_data = config.get_chunk_data(chunk_id)
        if not chunk_data then
            return nil
        end
        
        -- Determine target position for this chunk
        local target_pos
        local local_target
        
        if i == #chunk_path then
            -- Last chunk - target is final destination
            target_pos = end_pos
            local_target = c_utils.global_to_local(
                target_pos, chunk_id, config.chunk_size, config.tile_size
            )
        else
            -- Intermediate chunk - find transition to next chunk
            local next_chunk = chunk_path[i + 1]
            
            -- Get available transition points
            local transitions = t_resolver.get_all_transition_points(
                chunk_id, next_chunk, config.transition_points
            )
            
            if #transitions == 0 then
                return nil  -- No transition available
            end
            
            -- Select optimal transition
            local transition = t_resolver.get_optimal_transition(
                current_pos, end_pos, transitions, 
                config.chunk_size, config.tile_size
            )
            
            if not transition then
                return nil
            end
            
            -- Calculate local target position based on direction
            local chunk_coords = c_utils.chunk_id_to_coords(chunk_id)
            local next_coords = c_utils.chunk_id_to_coords(next_chunk)
            
            if next_coords.x > chunk_coords.x then
                -- Moving right - target is rightmost column
                local_target = {x = config.chunk_size - 1, y = transition.position}
            elseif next_coords.x < chunk_coords.x then
                -- Moving left - target is leftmost column
                local_target = {x = 0, y = transition.position}
            elseif next_coords.y > chunk_coords.y then
                -- Moving down - target is bottom row
                local_target = {x = transition.position, y = config.chunk_size - 1}
            else  -- next_coords.y < chunk_coords.y
                -- Moving up - target is top row
                local_target = {x = transition.position, y = 0}
            end
            
            -- Calculate global position for segment
            target_pos = c_utils.tile_center_to_global(
                local_target.x, local_target.y, chunk_id,
                config.chunk_size, config.tile_size
            )
        end
        
        -- Convert current position to local coordinates
        local local_current = c_utils.global_to_local(
            current_pos, chunk_id, config.chunk_size, config.tile_size
        )
        
        -- Find local path
        local local_path = l_pathfinder.find_path(chunk_data, local_current, local_target)
        if not local_path then
            return nil  -- Cannot reach transition point
        end
        
        -- Add segment for this chunk
        table.insert(segments, {
            chunk = chunk_id,
            position = target_pos
        })
        
        -- Update current position for next iteration
        -- If there's a next chunk, position will be at the edge of next chunk
        if i < #chunk_path then
            local next_chunk = chunk_path[i + 1]
            local next_coords = c_utils.chunk_id_to_coords(next_chunk)
            local curr_coords = c_utils.chunk_id_to_coords(chunk_id)
            
            -- Calculate entry position in next chunk based on direction
            if next_coords.x > curr_coords.x then
                -- Entering from left
                current_pos = c_utils.tile_center_to_global(
                    0, local_target.y, next_chunk,
                    config.chunk_size, config.tile_size
                )
            elseif next_coords.x < curr_coords.x then
                -- Entering from right
                current_pos = c_utils.tile_center_to_global(
                    config.chunk_size - 1, local_target.y, next_chunk,
                    config.chunk_size, config.tile_size
                )
            elseif next_coords.y > curr_coords.y then
                -- Entering from top
                current_pos = c_utils.tile_center_to_global(
                    local_target.x, 0, next_chunk,
                    config.chunk_size, config.tile_size
                )
            else  -- next_coords.y < curr_coords.y
                -- Entering from bottom
                current_pos = c_utils.tile_center_to_global(
                    local_target.x, config.chunk_size - 1, next_chunk,
                    config.chunk_size, config.tile_size
                )
            end
        else
            current_pos = target_pos
        end
    end
    
    return segments
end

-- Optimize segments by merging consecutive segments in same chunk
-- @param segments Array of segments
-- @return Optimized segments
function M.optimize_segments(segments)
    if not segments or #segments <= 1 then
        return segments
    end
    
    local optimized = {}
    local current_chunk = segments[1].chunk
    local last_position = segments[1].position
    
    for i = 2, #segments do
        local segment = segments[i]
        
        if segment.chunk == current_chunk then
            -- Same chunk - update position
            last_position = segment.position
        else
            -- Different chunk - save previous and start new
            table.insert(optimized, {
                chunk = current_chunk,
                position = last_position
            })
            current_chunk = segment.chunk
            last_position = segment.position
        end
    end
    
    -- Don't forget last segment
    table.insert(optimized, {
        chunk = current_chunk,
        position = last_position
    })
    
    return optimized
end

return M 