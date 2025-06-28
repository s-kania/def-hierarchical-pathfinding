describe("Chunk Navigator", function()
    local chunk_navigator = require "src.chunk_navigator"
    local mock_data = require "spec.mock_data"
    
    describe("build_chunk_graph", function()
        it("should build graph from simple transition points", function()
            local graph = chunk_navigator.build_chunk_graph(mock_data.SIMPLE_TRANSITION_POINTS)
            
            assert.is_not_nil(graph)
            assert.is_not_nil(graph["0,0"])
            assert.is_not_nil(graph["1,0"])
            assert.is_not_nil(graph["0,1"])
            
            -- Check connections from 0,0
            local chunk_0_0 = graph["0,0"]
            assert.are.equal(2, #chunk_0_0.neighbors)  -- Should connect to 1,0 and 0,1
            
            local has_1_0 = false
            local has_0_1 = false
            for _, neighbor in ipairs(chunk_0_0.neighbors) do
                if neighbor.chunk_id == "1,0" then has_1_0 = true end
                if neighbor.chunk_id == "0,1" then has_0_1 = true end
            end
            assert.is_true(has_1_0 and has_0_1)
        end)
        
        it("should build graph from complex transition points", function()
            local graph = chunk_navigator.build_chunk_graph(mock_data.COMPLEX_TRANSITION_POINTS)
            
            -- Check that all chunks are present
            assert.is_not_nil(graph["0,0"])
            assert.is_not_nil(graph["1,0"])
            assert.is_not_nil(graph["0,1"])
            assert.is_not_nil(graph["1,1"])
            
            -- Check multiple connections between same chunks
            local chunk_0_0 = graph["0,0"]
            local connections_to_1_0 = 0
            local connections_to_0_1 = 0
            
            for _, neighbor in ipairs(chunk_0_0.neighbors) do
                if neighbor.chunk_id == "1,0" then
                    connections_to_1_0 = connections_to_1_0 + 1
                elseif neighbor.chunk_id == "0,1" then
                    connections_to_0_1 = connections_to_0_1 + 1
                end
            end
            
            assert.are.equal(2, connections_to_1_0)  -- Two transition points to 1,0
            assert.are.equal(2, connections_to_0_1)  -- Two transition points to 0,1
        end)
        
        it("should handle empty transition points", function()
            local graph = chunk_navigator.build_chunk_graph({})
            assert.is_not_nil(graph)
            assert.are.equal(0, #graph)
        end)
        
        it("should store transition point data", function()
            local graph = chunk_navigator.build_chunk_graph(mock_data.SIMPLE_TRANSITION_POINTS)
            
            local chunk_0_0 = graph["0,0"]
            local neighbor_1_0 = nil
            
            for _, neighbor in ipairs(chunk_0_0.neighbors) do
                if neighbor.chunk_id == "1,0" then
                    neighbor_1_0 = neighbor
                    break
                end
            end
            
            assert.is_not_nil(neighbor_1_0)
            assert.is_not_nil(neighbor_1_0.transition_point)
            assert.are.equal("0,0-1,0-3", neighbor_1_0.transition_point.id)
            assert.are.equal(3, neighbor_1_0.transition_point.position)
        end)
    end)
    
    describe("find_chunk_path", function()
        local graph
        
        before_each(function()
            graph = chunk_navigator.build_chunk_graph(mock_data.COMPLEX_TRANSITION_POINTS)
        end)
        
        it("should find direct path between adjacent chunks", function()
            local path = chunk_navigator.find_chunk_path(graph, "0,0", "1,0")
            
            assert.is_not_nil(path)
            assert.are.equal(2, #path)
            assert.are.equal("0,0", path[1])
            assert.are.equal("1,0", path[2])
        end)
        
        it("should find path through multiple chunks", function()
            local path = chunk_navigator.find_chunk_path(graph, "0,0", "1,1")
            
            assert.is_not_nil(path)
            assert.is_true(#path >= 3)  -- At least 3 chunks
            assert.are.equal("0,0", path[1])
            assert.are.equal("1,1", path[#path])
            
            -- Verify path is connected
            for i = 2, #path do
                local prev_chunk = path[i-1]
                local curr_chunk = path[i]
                local is_connected = false
                
                for _, neighbor in ipairs(graph[prev_chunk].neighbors) do
                    if neighbor.chunk_id == curr_chunk then
                        is_connected = true
                        break
                    end
                end
                
                assert.is_true(is_connected, 
                    string.format("Chunk %s should be connected to %s", prev_chunk, curr_chunk))
            end
        end)
        
        it("should return nil for disconnected chunks", function()
            -- Create a graph with disconnected islands
            local disconnected_points = {
                {
                    id = "0,0-1,0-3",
                    chunks = {"0,0", "1,0"},
                    position = 3,
                    connections = {}
                },
                {
                    id = "2,2-3,2-3",
                    chunks = {"2,2", "3,2"},
                    position = 3,
                    connections = {}
                }
            }
            
            local disconnected_graph = chunk_navigator.build_chunk_graph(disconnected_points)
            local path = chunk_navigator.find_chunk_path(disconnected_graph, "0,0", "2,2")
            
            assert.is_nil(path)
        end)
        
        it("should handle same start and end chunk", function()
            local path = chunk_navigator.find_chunk_path(graph, "0,0", "0,0")
            
            assert.is_not_nil(path)
            assert.are.equal(1, #path)
            assert.are.equal("0,0", path[1])
        end)
        
        it("should find optimal path with weights", function()
            -- Create a graph with different weighted paths
            local weighted_points = {
                -- Direct path with high weight
                {
                    id = "0,0-2,0-3",
                    chunks = {"0,0", "2,0"},
                    position = 3,
                    connections = {},
                    weight = 100
                },
                -- Indirect path with lower total weight
                {
                    id = "0,0-1,0-3",
                    chunks = {"0,0", "1,0"},
                    position = 3,
                    connections = {},
                    weight = 10
                },
                {
                    id = "1,0-2,0-3",
                    chunks = {"1,0", "2,0"},
                    position = 3,
                    connections = {},
                    weight = 10
                }
            }
            
            local weighted_graph = chunk_navigator.build_chunk_graph(weighted_points)
            local path = chunk_navigator.find_chunk_path(weighted_graph, "0,0", "2,0")
            
            assert.is_not_nil(path)
            assert.are.equal(3, #path)  -- Should take indirect path
            assert.are.equal("0,0", path[1])
            assert.are.equal("1,0", path[2])
            assert.are.equal("2,0", path[3])
        end)
        
        it("should handle invalid chunk IDs", function()
            assert.has_error(function()
                chunk_navigator.find_chunk_path(graph, "invalid", "0,0")
            end)
            
            assert.has_error(function()
                chunk_navigator.find_chunk_path(graph, "0,0", nil)
            end)
        end)
    end)
    
    describe("get_chunk_distance", function()
        it("should calculate Manhattan distance between chunks", function()
            local dist = chunk_navigator.get_chunk_distance("0,0", "3,4")
            assert.are.equal(7, dist)  -- |3-0| + |4-0| = 7
        end)
        
        it("should handle negative coordinates", function()
            local dist = chunk_navigator.get_chunk_distance("-2,-3", "1,1")
            assert.are.equal(7, dist)  -- |1-(-2)| + |1-(-3)| = 3 + 4 = 7
        end)
        
        it("should return 0 for same chunk", function()
            local dist = chunk_navigator.get_chunk_distance("5,5", "5,5")
            assert.are.equal(0, dist)
        end)
    end)
    
    describe("get_transition_points_between", function()
        it("should find all transition points between two chunks", function()
            local graph = chunk_navigator.build_chunk_graph(mock_data.COMPLEX_TRANSITION_POINTS)
            local points = chunk_navigator.get_transition_points_between(graph, "0,0", "1,0")
            
            assert.is_not_nil(points)
            assert.are.equal(2, #points)  -- Two transition points between 0,0 and 1,0
            
            -- Verify point IDs
            local has_pos_2 = false
            local has_pos_4 = false
            for _, point in ipairs(points) do
                if point.position == 2 then has_pos_2 = true end
                if point.position == 4 then has_pos_4 = true end
            end
            assert.is_true(has_pos_2 and has_pos_4)
        end)
        
        it("should return empty array for non-adjacent chunks", function()
            local graph = chunk_navigator.build_chunk_graph(mock_data.COMPLEX_TRANSITION_POINTS)
            local points = chunk_navigator.get_transition_points_between(graph, "0,0", "5,5")
            
            assert.is_not_nil(points)
            assert.are.equal(0, #points)
        end)
    end)
    
    describe("integration with map data", function()
        it("should work with simple map", function()
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            local graph = chunk_navigator.build_chunk_graph(config.transition_points)
            
            -- All chunks should be reachable
            local path = chunk_navigator.find_chunk_path(graph, "0,0", "1,1")
            assert.is_not_nil(path)
        end)
        
        it("should handle island map with no connections", function()
            local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
            local graph = chunk_navigator.build_chunk_graph(config.transition_points)
            
            -- No connections, so graph should be empty or disconnected
            local path = chunk_navigator.find_chunk_path(graph, "0,0", "2,2")
            assert.is_nil(path)
        end)
    end)
end) 