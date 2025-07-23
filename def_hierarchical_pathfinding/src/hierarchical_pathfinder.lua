local coord_utils = require("def_hierarchical_pathfinding.src.coord_utils")
local PathSegmentBuilder = require("def_hierarchical_pathfinding.src.path_segment_builder")

-- Main hierarchical pathfinding class
-- Orchestrates local and hierarchical pathfinding using injected algorithms

local HierarchicalPathfinder = {}
HierarchicalPathfinder.__index = HierarchicalPathfinder

-- Constructor
-- @returns table - New HierarchicalPathfinder instance
function HierarchicalPathfinder.new()
    local self = setmetatable({}, HierarchicalPathfinder)
    self.config = nil
    self.local_algorithm_fn = nil
    self.hierarchical_algorithm_fn = nil
    self.segment_builder = nil
    return self
end

-- Initialize the pathfinding system
-- @param config table - Configuration object
function HierarchicalPathfinder:init(config)
    -- Validate configuration
    self:validate_config(config)
    
    self.config = config
    self.local_algorithm_fn = config.local_algorithm_fn
    self.hierarchical_algorithm_fn = config.hierarchical_algorithm_fn
    
    -- Create segment builder
    self.segment_builder = PathSegmentBuilder.new(config, self)
end

-- Validate configuration
-- @param config table - Configuration object
-- @throws error if configuration is invalid
function HierarchicalPathfinder:validate_config(config)
    if not config then
        error("Configuration is required")
    end
    
    if not config.tile_size or config.tile_size <= 0 then
        error("tile_size must be positive")
    end
    
    if not config.grid_width or config.grid_width <= 0 then
        error("grid_width must be positive")
    end
    
    if not config.grid_height or config.grid_height <= 0 then
        error("grid_height must be positive")
    end
    
    if not config.chunk_width or config.chunk_width <= 0 then
        error("chunk_width must be positive")
    end
    
    if not config.chunk_height or config.chunk_height <= 0 then
        error("chunk_height must be positive")
    end
    
    if type(config.get_chunk_data) ~= "function" then
        error("get_chunk_data must be a function")
    end
    
    if type(config.transition_points) ~= "table" then
        error("transition_points must be a table")
    end
    
    if type(config.local_algorithm_fn) ~= "function" then
        error("local_algorithm_fn must be a function")
    end
    
    if type(config.hierarchical_algorithm_fn) ~= "function" then
        error("hierarchical_algorithm_fn must be a function")
    end
end

-- Find path from start position to end position
-- @param start_pos table - Start position {x, y} in world units
-- @param end_pos table - End position {x, y} in world units
-- @returns table|nil - Array of segments {{chunk, position}} or nil
function HierarchicalPathfinder:find_path(start_pos, end_pos)
    if not self.config then
        error("Pathfinder has not been initialized")
    end

    -- Validate input parameters
    self:validate_positions(start_pos, end_pos)

    -- Check if positions are within world bounds
    if not self:are_positions_in_bounds(start_pos, end_pos) then
        return nil
    end

    -- Determine which chunks contain start and end
    local start_chunk = coord_utils.global_to_chunk_id(start_pos, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)
    local end_chunk = coord_utils.global_to_chunk_id(end_pos, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)

    -- If same chunk - try local pathfinding first
    if start_chunk == end_chunk then
        local local_path = self:find_local_path(start_chunk, start_pos, end_pos)
        if local_path then
            return local_path
        end
        -- If not, allow continuation to hierarchical search.
        -- It may happen that points are in the same chunk, but in separate,
        -- unconnected areas, so we need to go outside.
    end

    -- Different chunks (or same chunk without local path) - search through transition points
    local start_point = self:find_nearest_transition(start_pos, start_chunk)
    local end_point = self:find_nearest_transition(end_pos, end_chunk)

    if not start_point or not end_point then
        return nil -- No available transition points
    end
    
    local transition_path = self:find_transition_path(start_point.id, end_point.id)

    if not transition_path then
        return nil -- No path between chunks
    end

    -- Build final path segments
    local segments = self.segment_builder:build_segments(start_pos, end_pos, transition_path)
    
    return segments
end

-- Validate input positions
-- @param start_pos table - Start position
-- @param end_pos table - End position
-- @throws error if positions are invalid
function HierarchicalPathfinder:validate_positions(start_pos, end_pos)
    if not start_pos or type(start_pos.x) ~= "number" or type(start_pos.y) ~= "number" then
        error("Invalid start_pos: must be {x: number, y: number}")
    end
    if not end_pos or type(end_pos.x) ~= "number" or type(end_pos.y) ~= "number" then
        error("Invalid end_pos: must be {x: number, y: number}")
    end
end

-- Check if positions are within world bounds
-- @param start_pos table - Start position
-- @param end_pos table - End position
-- @returns boolean - True if positions are in bounds
function HierarchicalPathfinder:are_positions_in_bounds(start_pos, end_pos)
    local world_width = self.config.grid_width * self.config.chunk_width * self.config.tile_size
    local world_height = self.config.grid_height * self.config.chunk_height * self.config.tile_size
    
    return start_pos.x >= 0 and start_pos.x < world_width and
           start_pos.y >= 0 and start_pos.y < world_height and
           end_pos.x >= 0 and end_pos.x < world_width and
           end_pos.y >= 0 and end_pos.y < world_height
end

-- Find local path within a single chunk
-- @param chunk_id string - Chunk ID
-- @param start_pos table - Start position (global)
-- @param end_pos table - End position (global)
-- @returns table|nil - Path segment or nil
function HierarchicalPathfinder:find_local_path(chunk_id, start_pos, end_pos)
    -- Get chunk data (2D array)
    local chunk_data = self.config.get_chunk_data(chunk_id)
    if not chunk_data then
        print("🔍 No chunk data for chunk " .. chunk_id)
        return nil
    end

    -- Convert global positions to local positions in chunk
    local local_start = coord_utils.global_to_local(start_pos, chunk_id, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)
    local local_end = coord_utils.global_to_local(end_pos, chunk_id, self.config.chunk_width, self.config.chunk_height, self.config.tile_size)

    -- Find path with injected local algorithm
    local local_path = self.local_algorithm_fn(chunk_data, local_start, local_end)

    if local_path then
        -- Return as single segment
        return {{
            chunk = chunk_id,
            position = end_pos
        }}
    end

    return nil
end

-- Find path between transition points using injected hierarchical algorithm
-- @param start_id string - Start point ID
-- @param end_id string - End point ID
-- @returns table|nil - Array of point IDs or nil
function HierarchicalPathfinder:find_transition_path(start_id, end_id)
    local graph_data = {
        nodes = self:get_transition_points_map(),
        connections = self:get_transition_connections_map()
    }
    
    return self.hierarchical_algorithm_fn(graph_data, start_id, end_id, {
        max_iterations = 1000
    })
end

-- Get transition points as table
-- @returns table - Table of transition points indexed by ID
function HierarchicalPathfinder:get_transition_points_map()
    local points = {}
    for _, point in ipairs(self.config.transition_points) do
        points[point.id] = point
    end
    return points
end

-- Get transition connections as table
-- @returns table - Table of connections indexed by point ID
function HierarchicalPathfinder:get_transition_connections_map()
    local connections = {}
    for _, point in ipairs(self.config.transition_points) do
        connections[point.id] = point.connections or {}
    end
    return connections
end

-- Find nearest transition point in a given chunk
-- @param pos table - Position for which we're looking for a point
-- @param chunk_id string - Chunk ID
-- @returns table|nil - Nearest available transition point
function HierarchicalPathfinder:find_nearest_transition(pos, chunk_id)
    -- Get all transition points in this chunk
    local points = self:get_points_in_chunk(chunk_id)
    
    if #points == 0 then
        return nil
    end

    local nearest = nil
    local min_distance = math.huge

    -- Find nearest point that can be reached
    for _, point in ipairs(points) do
        -- Calculate global position of transition point
        local point_pos = coord_utils.get_transition_global_position(
            point, chunk_id, self.config.chunk_width, self.config.chunk_height, self.config.tile_size
        )

        if point_pos then
            -- Check if we can reach this point with local path
            local success, local_path = pcall(function()
                return self:find_local_path(chunk_id, pos, point_pos)
            end)

            if success and local_path then
                -- Calculate Euclidean distance
                local dx = point_pos.x - pos.x
                local dy = point_pos.y - pos.y
                local distance = math.sqrt(dx * dx + dy * dy)
                
                if distance < min_distance then
                    min_distance = distance
                    nearest = point
                end
            elseif not success then
                print("⚠️ Error checking local path to transition point " .. point.id .. ": " .. tostring(local_path))
                -- Continue with next point instead of crashing
            end
        end
    end

    return nearest
end

-- Get all transition points in a chunk
-- @param chunk_id string - Chunk ID
-- @returns table - Array of transition points
function HierarchicalPathfinder:get_points_in_chunk(chunk_id)
    local points = {}
    for _, point in ipairs(self.config.transition_points) do
        for _, chunk in ipairs(point.chunks) do
            if chunk == chunk_id then
                table.insert(points, point)
                break
            end
        end
    end
    return points
end

-- Get configuration
-- @returns table - Current configuration
function HierarchicalPathfinder:get_config()
    return self.config
end

-- Get local algorithm function
-- @returns function - Local algorithm function
function HierarchicalPathfinder:get_local_algorithm_fn()
    return self.local_algorithm_fn
end

-- Get hierarchical algorithm function
-- @returns function - Hierarchical algorithm function
function HierarchicalPathfinder:get_hierarchical_algorithm_fn()
    return self.hierarchical_algorithm_fn
end

return HierarchicalPathfinder 