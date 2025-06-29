-- Local pathfinding within a single chunk using A* algorithm
-- Finds paths on water tiles (value 0) avoiding land tiles (value 1)

local data_structures = require "src.utils.data_structures"

local M = {}

-- Check if position is walkable (water tile)
-- @param chunk_data 2D array of tiles
-- @param pos Position {x, y}
-- @return boolean
function M.is_walkable(chunk_data, pos)
    if pos.x < 0 or pos.y < 0 then
        return false
    end
    
    local row = chunk_data[pos.y + 1]  -- Lua arrays are 1-indexed
    if not row then
        return false
    end
    
    local tile = row[pos.x + 1]
    return tile == 0  -- 0 = water (walkable)
end

-- Get valid neighbors for 4-directional movement
-- @param chunk_data 2D array of tiles
-- @param pos Current position {x, y}
-- @return Array of neighbor positions
function M.get_neighbors(chunk_data, pos)
    local neighbors = {}
    local directions = {
        {x = 0, y = -1},  -- Up
        {x = 0, y = 1},   -- Down
        {x = -1, y = 0},  -- Left
        {x = 1, y = 0}    -- Right
    }
    
    for _, dir in ipairs(directions) do
        local neighbor = {x = pos.x + dir.x, y = pos.y + dir.y}
        if M.is_walkable(chunk_data, neighbor) then
            table.insert(neighbors, neighbor)
        end
    end
    
    return neighbors
end

-- Calculate heuristic distance (Manhattan by default)
-- @param a Position {x, y}
-- @param b Position {x, y}
-- @param heuristic "manhattan" or "euclidean"
-- @return Distance
local function calculate_heuristic(a, b, heuristic)
    if heuristic == "euclidean" then
        local dx = b.x - a.x
        local dy = b.y - a.y
        return math.sqrt(dx * dx + dy * dy)
    else  -- manhattan (default)
        return math.abs(b.x - a.x) + math.abs(b.y - a.y)
    end
end

-- Find path using A* algorithm
-- @param chunk_data 2D array of tiles (0 = water, 1 = land)
-- @param start_pos Start position {x, y} in local coordinates
-- @param end_pos End position {x, y} in local coordinates
-- @param config Optional configuration {heuristic = "manhattan"|"euclidean", optimize_path = boolean}
-- @return Array of positions forming path, or nil if no path exists
function M.find_path(chunk_data, start_pos, end_pos, config)
    config = config or {}
    local heuristic = config.heuristic or "manhattan"
    
    -- Validate positions
    if start_pos.x < 0 or start_pos.y < 0 or end_pos.x < 0 or end_pos.y < 0 then
        error("Invalid position: negative coordinates")
    end
    
    local chunk_size = #chunk_data
    if chunk_size == 0 or #chunk_data[1] == 0 then
        error("Invalid chunk data: empty")
    end
    
    if start_pos.x >= chunk_size or start_pos.y >= chunk_size or
       end_pos.x >= chunk_size or end_pos.y >= chunk_size then
        error("Position outside chunk bounds")
    end
    
    -- Check if start and end are walkable
    if not M.is_walkable(chunk_data, start_pos) or not M.is_walkable(chunk_data, end_pos) then
        return nil
    end
    
    -- Handle same position
    if start_pos.x == end_pos.x and start_pos.y == end_pos.y then
        return {start_pos}
    end
    
    -- A* implementation
    local PriorityQueue = data_structures.PriorityQueue
    local open_set = PriorityQueue:new()
    local came_from = {}
    local g_score = {}
    local closed_set = {}
    
    -- Helper to create position key
    local function pos_key(pos)
        return pos.x .. "," .. pos.y
    end
    
    -- Initialize start node
    local start_key = pos_key(start_pos)
    g_score[start_key] = 0
    
    open_set:push({
        pos = start_pos,
        g_score = 0,
        f_score = calculate_heuristic(start_pos, end_pos, heuristic),
        priority = calculate_heuristic(start_pos, end_pos, heuristic)
    })
    
    -- Main A* loop
    while not open_set:empty() do
        local current = open_set:pop()
        local current_key = pos_key(current.pos)
        
        -- Check if we reached the goal
        if current.pos.x == end_pos.x and current.pos.y == end_pos.y then
            -- Reconstruct path
            local path = {}
            local pos = end_pos
            
            while pos do
                table.insert(path, 1, {x = pos.x, y = pos.y})
                local key = pos_key(pos)
                pos = came_from[key]
            end
            
            -- Optimize path if requested
            if config.optimize_path then
                path = M.optimize_path(path, chunk_data)
            end
            
            return path
        end
        
        closed_set[current_key] = true
        
        -- Examine neighbors
        local neighbors = M.get_neighbors(chunk_data, current.pos)
        
        for _, neighbor in ipairs(neighbors) do
            local neighbor_key = pos_key(neighbor)
            
            if not closed_set[neighbor_key] then
                local tentative_g = current.g_score + 1  -- Cost is 1 for adjacent tiles
                
                if not g_score[neighbor_key] or tentative_g < g_score[neighbor_key] then
                    -- Update scores
                    came_from[neighbor_key] = current.pos
                    g_score[neighbor_key] = tentative_g
                    local f_score = tentative_g + calculate_heuristic(neighbor, end_pos, heuristic)
                    
                    -- Add to open set
                    open_set:push({
                        pos = neighbor,
                        g_score = tentative_g,
                        f_score = f_score,
                        priority = f_score
                    })
                end
            end
        end
    end
    
    -- No path found
    return nil
end

-- Optimize path by removing unnecessary waypoints
-- @param path Array of positions
-- @param chunk_data Chunk data for line-of-sight checks
-- @return Optimized path
function M.optimize_path(path, chunk_data)
    if #path <= 2 then
        return path
    end
    
    local optimized = {path[1]}
    local current_index = 1
    
    while current_index < #path do
        local furthest_visible = current_index + 1
        
        -- Find furthest point we can see in straight line
        for i = current_index + 2, #path do
            if M.has_line_of_sight(path[current_index], path[i], chunk_data) then
                furthest_visible = i
            else
                break
            end
        end
        
        table.insert(optimized, path[furthest_visible])
        current_index = furthest_visible
    end
    
    return optimized
end

-- Check if there's a clear line of sight between two points
-- @param from Start position
-- @param to End position
-- @param chunk_data Chunk data
-- @return boolean
function M.has_line_of_sight(from, to, chunk_data)
    -- Bresenham's line algorithm
    local x0, y0 = from.x, from.y
    local x1, y1 = to.x, to.y
    
    local dx = math.abs(x1 - x0)
    local dy = math.abs(y1 - y0)
    local sx = x0 < x1 and 1 or -1
    local sy = y0 < y1 and 1 or -1
    local err = dx - dy
    
    while true do
        if not M.is_walkable(chunk_data, {x = x0, y = y0}) then
            return false
        end
        
        if x0 == x1 and y0 == y1 then
            break
        end
        
        local e2 = 2 * err
        if e2 > -dy then
            err = err - dy
            x0 = x0 + sx
        end
        if e2 < dx then
            err = err + dx
            y0 = y0 + sy
        end
    end
    
    return true
end

return M 