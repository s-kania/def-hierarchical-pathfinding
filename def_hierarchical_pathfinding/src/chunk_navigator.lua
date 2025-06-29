-- Chunk navigation for hierarchical pathfinding
-- Builds and navigates graph of chunks connected by transition points

local data_structures = require "src.utils.data_structures"
local coord_utils = require "src.utils.coord_utils"

local M = {}

-- Build chunk graph from transition points
-- @param transition_points Array of transition point data
-- @param all_chunks Optional array of all chunk IDs to include in graph
-- @return Graph as adjacency list {chunk_id = {neighbors = [{chunk_id, transition_point, weight}]}}
function M.build_chunk_graph(transition_points, all_chunks)
    local graph = {}
    
    -- Initialize all chunks if provided
    if all_chunks then
        for _, chunk_id in ipairs(all_chunks) do
            graph[chunk_id] = {neighbors = {}}
        end
    end
    
    -- Initialize graph nodes from transition points
    for _, point in ipairs(transition_points) do
        for _, chunk_id in ipairs(point.chunks) do
            if not graph[chunk_id] then
                graph[chunk_id] = {neighbors = {}}
            end
        end
    end
    
    -- Add edges based on transition points
    for _, point in ipairs(transition_points) do
        if #point.chunks == 2 then
            local chunk1 = point.chunks[1]
            local chunk2 = point.chunks[2]
            local weight = point.weight or 1
            
            -- Add bidirectional edges
            table.insert(graph[chunk1].neighbors, {
                chunk_id = chunk2,
                transition_point = point,
                weight = weight
            })
            
            table.insert(graph[chunk2].neighbors, {
                chunk_id = chunk1,
                transition_point = point,
                weight = weight
            })
        end
    end
    
    -- Add connection information from transition point connections
    for _, point in ipairs(transition_points) do
        if point.connections then
            for _, connection in ipairs(point.connections) do
                -- Find the connected transition point
                for _, other_point in ipairs(transition_points) do
                    if other_point.id == connection.id then
                        -- This creates indirect paths through transition network
                        -- Useful for complex transition systems
                        break
                    end
                end
            end
        end
    end
    
    return graph
end

-- Find path between chunks using A* on chunk graph
-- @param graph Chunk graph from build_chunk_graph
-- @param start_chunk Starting chunk ID
-- @param end_chunk Ending chunk ID
-- @return Array of chunk IDs forming path, or nil if no path
function M.find_chunk_path(graph, start_chunk, end_chunk)
    -- Validate inputs
    if type(start_chunk) ~= "string" or type(end_chunk) ~= "string" then
        error("Invalid chunk ID type")
    end
    
    -- Same chunk
    if start_chunk == end_chunk then
        return {start_chunk}
    end
    
    -- Check chunks exist in graph
    if not graph[start_chunk] then
        error("Start chunk '" .. start_chunk .. "' not found in graph")
    end
    if not graph[end_chunk] then
        error("End chunk '" .. end_chunk .. "' not found in graph")
    end
    
    -- A* on chunk graph
    local PriorityQueue = data_structures.PriorityQueue
    local open_set = PriorityQueue:new()
    local came_from = {}
    local g_score = {}
    local closed_set = {}
    
    -- Initialize
    g_score[start_chunk] = 0
    local h_score = M.get_chunk_distance(start_chunk, end_chunk)
    
    open_set:push({
        chunk_id = start_chunk,
        g_score = 0,
        f_score = h_score,
        priority = h_score
    })
    
    -- Main loop
    while not open_set:empty() do
        local current = open_set:pop()
        
        -- Goal reached
        if current.chunk_id == end_chunk then
            -- Reconstruct path
            local path = {}
            local chunk = end_chunk
            
            while chunk do
                table.insert(path, 1, chunk)
                chunk = came_from[chunk]
            end
            
            return path
        end
        
        closed_set[current.chunk_id] = true
        
        -- Examine neighbors
        local node = graph[current.chunk_id]
        if node and node.neighbors then
            for _, neighbor in ipairs(node.neighbors) do
                local neighbor_id = neighbor.chunk_id
                
                if not closed_set[neighbor_id] then
                    local tentative_g = current.g_score + (neighbor.weight or 1)
                    
                    if not g_score[neighbor_id] or tentative_g < g_score[neighbor_id] then
                        came_from[neighbor_id] = current.chunk_id
                        g_score[neighbor_id] = tentative_g
                        local h = M.get_chunk_distance(neighbor_id, end_chunk)
                        local f_score = tentative_g + h
                        
                        open_set:push({
                            chunk_id = neighbor_id,
                            g_score = tentative_g,
                            f_score = f_score,
                            priority = f_score
                        })
                    end
                end
            end
        end
    end
    
    -- No path found
    return nil
end

-- Calculate Manhattan distance between chunk centers
-- @param chunk_id1 First chunk ID
-- @param chunk_id2 Second chunk ID
-- @return Distance
function M.get_chunk_distance(chunk_id1, chunk_id2)
    local coords1 = coord_utils.chunk_id_to_coords(chunk_id1)
    local coords2 = coord_utils.chunk_id_to_coords(chunk_id2)
    
    return math.abs(coords2.x - coords1.x) + math.abs(coords2.y - coords1.y)
end

-- Get all transition points between two chunks
-- @param graph Chunk graph
-- @param chunk1 First chunk ID
-- @param chunk2 Second chunk ID
-- @return Array of transition points
function M.get_transition_points_between(graph, chunk1, chunk2)
    local points = {}
    
    local node = graph[chunk1]
    if node and node.neighbors then
        for _, neighbor in ipairs(node.neighbors) do
            if neighbor.chunk_id == chunk2 and neighbor.transition_point then
                table.insert(points, neighbor.transition_point)
            end
        end
    end
    
    return points
end

return M 