local coord_utils = require("def_hierarchical_pathfinding.src.coord_utils")

-- Builder for path segments in hierarchical pathfinding
-- Single function approach following KISS principle

local PathSegmentBuilder = {}
PathSegmentBuilder.__index = PathSegmentBuilder

-- Constructor
-- @param config table - Configuration object
-- @param pathfinder table|nil - Pathfinder instance
-- @returns table - New PathSegmentBuilder instance
function PathSegmentBuilder.new(config, pathfinder)
    local self = setmetatable({}, PathSegmentBuilder)
    self.config = config
    self.pathfinder = pathfinder
    return self
end

-- Build path segments from transition path
-- Single function that handles everything in a clear, linear way
-- @param start_pos table - Start position
-- @param end_pos table - End position
-- @param transition_path table - Array of transition point IDs
-- @returns table - Array of path segments
function PathSegmentBuilder:build_segments(start_pos, end_pos, transition_path)
    local start_chunk = coord_utils.global_to_chunk_id(start_pos, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)
    local end_chunk = coord_utils.global_to_chunk_id(end_pos, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)
    
    -- Direct path - no transitions needed
    if #transition_path == 0 then
        return {{ chunk = start_chunk, position = end_pos }}
    end
    
    local segments = {}
    local effective_path = {}
    
    -- Copy transition_path to effective_path
    for i, v in ipairs(transition_path) do
        effective_path[i] = v
    end
    
    -- FIRST NODE VERIFICATION - remove redundant first node
    if #effective_path >= 2 then
        local first_point = self:get_point(effective_path[1])
        local second_point = self:get_point(effective_path[2])
        
        if first_point and second_point then
            local connection_chunk = self:find_connection_chunk(first_point, second_point)
            if self:chunks_contains(second_point.chunks, start_chunk) and connection_chunk == start_chunk then
                table.remove(effective_path, 1) -- Remove first, redundant node
            end
        end
    end
    
    -- Add start segment (from start_pos to first transition point)
    if #effective_path > 0 then
        local first_point = self:get_point(effective_path[1])
        if first_point then
            local first_point_pos = coord_utils.get_transition_global_position(
                first_point, start_chunk, self.config.chunk_width, self.config.chunk_height, self.config.tile_size
            )
            
            if first_point_pos then
                table.insert(segments, { chunk = start_chunk, position = first_point_pos })
            end
        end
    end
    
    -- Build segments between transition points
    for i = 1, #effective_path - 1 do
        local current_point = self:get_point(effective_path[i])
        local next_point = self:get_point(effective_path[i + 1])
        
        if current_point and next_point then
            local connection_chunk = self:find_connection_chunk(current_point, next_point)
            if connection_chunk then
                local next_point_pos = coord_utils.get_transition_global_position(
                    next_point, connection_chunk, self.config.chunk_width, self.config.chunk_height, self.config.tile_size
                )
                if next_point_pos then
                    table.insert(segments, { chunk = connection_chunk, position = next_point_pos })
                end
            end
        end
    end
    
    -- Add end segment (from last transition point to end_pos)
    if #effective_path > 0 then
        table.insert(segments, { chunk = end_chunk, position = end_pos })
    end

    -- PENULTIMATE SEGMENT VERIFICATION - remove duplicate end segments
    if #segments >= 2 then
        local penultimate_segment = segments[#segments - 1]
        if penultimate_segment.chunk == end_chunk then
            table.remove(segments, #segments - 1)
        end
    end
    
    return segments
end

-- Helper function to check if chunks table contains value
-- @param chunks table - Array of chunk IDs
-- @param chunk_id string - Chunk ID to find
-- @returns boolean - True if found
function PathSegmentBuilder:chunks_contains(chunks, chunk_id)
    for _, v in ipairs(chunks) do
        if v == chunk_id then
            return true
        end
    end
    return false
end

-- Get transition point by ID using HierarchicalPathfinder
-- @param point_id string - Point ID
-- @returns table|nil - Transition point or nil
function PathSegmentBuilder:get_point(point_id)
    if self.pathfinder and self.pathfinder.get_transition_points_map then
        local points_map = self.pathfinder:get_transition_points_map()
        return points_map[point_id]
    end
    return nil
end

-- Find chunk for connection between two transition points
-- @param from_point table - Start point
-- @param to_point table - Target point  
-- @returns string|nil - Chunk ID or nil if no connection
function PathSegmentBuilder:find_connection_chunk(from_point, to_point)
    if not from_point.connections then
        return nil
    end
    
    for _, connection in ipairs(from_point.connections) do
        if connection.id == to_point.id then
            return connection.chunk
        end
    end
    
    return nil
end

return PathSegmentBuilder 