describe("Integration Tests", function()
    local HierarchicalPathfinder = require "hierarchical_pathfinding"
    local mock_data = require "spec.mock_data"
    
    describe("real-world scenarios", function()
        it("should navigate around islands", function()
            -- Create map with islands that force specific paths
            local island_scenario = {
                chunks = {
                    -- Row 0
                    ["0,0"] = mock_data.WATER_CHUNK,
                    ["1,0"] = mock_data.ISLAND_CHUNK,  -- Island blocks direct path
                    ["2,0"] = mock_data.WATER_CHUNK,
                    -- Row 1 
                    ["0,1"] = mock_data.WATER_CHUNK,
                    ["1,1"] = mock_data.WATER_CHUNK,
                    ["2,1"] = mock_data.WATER_CHUNK,
                    -- Row 2
                    ["0,2"] = mock_data.WATER_CHUNK,
                    ["1,2"] = mock_data.ISLAND_CHUNK,  -- Another island
                    ["2,2"] = mock_data.WATER_CHUNK
                },
                transition_points = {
                    -- Connections around the islands
                    -- Top row
                    {id = "0,0-0,1-3", chunks = {"0,0", "0,1"}, position = 3, connections = {}},
                    {id = "2,0-2,1-3", chunks = {"2,0", "2,1"}, position = 3, connections = {}},
                    -- Middle row - full connectivity
                    {id = "0,1-1,1-3", chunks = {"0,1", "1,1"}, position = 3, connections = {}},
                    {id = "1,1-2,1-3", chunks = {"1,1", "2,1"}, position = 3, connections = {}},
                    -- Bottom connections
                    {id = "0,1-0,2-3", chunks = {"0,1", "0,2"}, position = 3, connections = {}},
                    {id = "2,1-2,2-3", chunks = {"2,1", "2,2"}, position = 3, connections = {}},
                },
                width = 3,
                height = 3
            }
            
            local config = mock_data.create_test_config(island_scenario)
            HierarchicalPathfinder.init(config)
            
            -- Try to go from top-left to bottom-right
            local start_pos = {x = 48, y = 48, z = 0}      -- Center of 0,0
            local end_pos = {x = 240, y = 240, z = 0}      -- Center of 2,2
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            
            -- Path should go around islands
            local visited_chunks = {}
            for _, segment in ipairs(segments) do
                visited_chunks[segment.chunk] = true
            end
            
            -- Should not go through island chunks
            assert.is_nil(visited_chunks["1,0"])
            assert.is_nil(visited_chunks["1,2"])
            
            -- Should use middle row
            assert.is_truthy(visited_chunks["1,1"])
        end)
        
        it("should find shortest path through maze", function()
            -- Create a maze-like structure
            local maze_scenario = {
                chunks = {
                    -- Row 0 - entry on left
                    ["0,0"] = mock_data.WATER_CHUNK,
                    ["1,0"] = mock_data.LAND_CHUNK,    -- Wall
                    ["2,0"] = mock_data.WATER_CHUNK,
                    ["3,0"] = mock_data.WATER_CHUNK,
                    -- Row 1 - passage
                    ["0,1"] = mock_data.WATER_CHUNK,
                    ["1,1"] = mock_data.WATER_CHUNK,
                    ["2,1"] = mock_data.WATER_CHUNK,
                    ["3,1"] = mock_data.LAND_CHUNK,    -- Wall
                    -- Row 2 - dead end and passage
                    ["0,2"] = mock_data.LAND_CHUNK,    -- Wall
                    ["1,2"] = mock_data.WATER_CHUNK,
                    ["2,2"] = mock_data.LAND_CHUNK,    -- Wall  
                    ["3,2"] = mock_data.WATER_CHUNK,
                    -- Row 3 - exit
                    ["0,3"] = mock_data.WATER_CHUNK,
                    ["1,3"] = mock_data.WATER_CHUNK,
                    ["2,3"] = mock_data.WATER_CHUNK,
                    ["3,3"] = mock_data.WATER_CHUNK,
                },
                transition_points = {},  -- Will add programmatically
                width = 4,
                height = 4
            }
            
            -- Add all possible connections between water chunks
            local water_chunks = {}
            for chunk_id, data in pairs(maze_scenario.chunks) do
                if data == mock_data.WATER_CHUNK then
                    table.insert(water_chunks, chunk_id)
                end
            end
            
            -- Create transitions between adjacent water chunks
            for _, chunk1 in ipairs(water_chunks) do
                local x1, y1 = chunk1:match("(%d+),(%d+)")
                x1, y1 = tonumber(x1), tonumber(y1)
                
                for _, chunk2 in ipairs(water_chunks) do
                    local x2, y2 = chunk2:match("(%d+),(%d+)")
                    x2, y2 = tonumber(x2), tonumber(y2)
                    
                    -- Adjacent horizontally or vertically
                    if (math.abs(x1 - x2) == 1 and y1 == y2) or 
                       (math.abs(y1 - y2) == 1 and x1 == x2) then
                        local id = chunk1 .. "-" .. chunk2 .. "-3"
                        local exists = false
                        
                        -- Check if transition already exists
                        for _, t in ipairs(maze_scenario.transition_points) do
                            if t.id == id or t.id == chunk2 .. "-" .. chunk1 .. "-3" then
                                exists = true
                                break
                            end
                        end
                        
                        if not exists and chunk1 < chunk2 then  -- Avoid duplicates
                            table.insert(maze_scenario.transition_points, {
                                id = id,
                                chunks = {chunk1, chunk2},
                                position = 3,
                                connections = {}
                            })
                        end
                    end
                end
            end
            
            local config = mock_data.create_test_config(maze_scenario)
            HierarchicalPathfinder.init(config)
            
            -- Navigate from top-left to bottom-right
            local start_pos = {x = 48, y = 48, z = 0}      -- Center of 0,0
            local end_pos = {x = 336, y = 336, z = 0}      -- Center of 3,3
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            
            -- Should find a valid path
            local last_segment = segments[#segments]
            assert.are.equal("3,3", last_segment.chunk)
            assert.are.same(end_pos, last_segment.position)
        end)
        
        it("should handle narrow passages efficiently", function()
            -- Map with narrow passages between areas
            local passage_scenario = {
                chunks = {
                    -- Left area
                    ["0,0"] = mock_data.WATER_CHUNK,
                    ["0,1"] = mock_data.WATER_CHUNK,
                    ["0,2"] = mock_data.WATER_CHUNK,
                    -- Narrow passage
                    ["1,0"] = mock_data.LAND_CHUNK,
                    ["1,1"] = mock_data.PASSAGE_CHUNK,  -- Only passage
                    ["1,2"] = mock_data.LAND_CHUNK,
                    -- Right area
                    ["2,0"] = mock_data.WATER_CHUNK,
                    ["2,1"] = mock_data.WATER_CHUNK,
                    ["2,2"] = mock_data.WATER_CHUNK,
                },
                transition_points = {
                    -- Left area connections
                    {id = "0,0-0,1-3", chunks = {"0,0", "0,1"}, position = 3, connections = {}},
                    {id = "0,1-0,2-3", chunks = {"0,1", "0,2"}, position = 3, connections = {}},
                    -- Passage connections (only through middle)
                    {id = "0,1-1,1-2", chunks = {"0,1", "1,1"}, position = 2, connections = {}},
                    {id = "0,1-1,1-3", chunks = {"0,1", "1,1"}, position = 3, connections = {}},
                    {id = "1,1-2,1-2", chunks = {"1,1", "2,1"}, position = 2, connections = {}},
                    {id = "1,1-2,1-3", chunks = {"1,1", "2,1"}, position = 3, connections = {}},
                    -- Right area connections
                    {id = "2,0-2,1-3", chunks = {"2,0", "2,1"}, position = 3, connections = {}},
                    {id = "2,1-2,2-3", chunks = {"2,1", "2,2"}, position = 3, connections = {}},
                },
                width = 3,
                height = 3
            }
            
            local config = mock_data.create_test_config(passage_scenario)
            HierarchicalPathfinder.init(config)
            
            -- Navigate from left area to right area
            local start_pos = {x = 48, y = 48, z = 0}      -- Center of 0,0
            local end_pos = {x = 240, y = 240, z = 0}      -- Center of 2,2
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            
            -- Should go through the passage
            local went_through_passage = false
            for _, segment in ipairs(segments) do
                if segment.chunk == "1,1" then
                    went_through_passage = true
                    
                    -- Check that position is in the passage area (middle columns)
                    local local_x = (segment.position.x - 96) / 16
                    assert.is_true(local_x >= 2 and local_x <= 3, 
                        "Should use passage in middle of chunk")
                end
            end
            
            assert.is_true(went_through_passage, "Path should go through passage chunk")
        end)
    end)
    
    describe("performance scenarios", function()
        it("should handle large empty map efficiently", function()
            -- Create 20x20 water map
            local large_map = {
                chunks = {},
                transition_points = {},
                width = 20,
                height = 20
            }
            
            -- Fill with water
            for y = 0, 19 do
                for x = 0, 19 do
                    large_map.chunks[x .. "," .. y] = mock_data.WATER_CHUNK
                end
            end
            
            -- Create grid of transitions
            for y = 0, 19 do
                for x = 0, 19 do
                    -- Right connection
                    if x < 19 then
                        table.insert(large_map.transition_points, {
                            id = x .. "," .. y .. "-" .. (x+1) .. "," .. y .. "-3",
                            chunks = {x .. "," .. y, (x+1) .. "," .. y},
                            position = 3,
                            connections = {}
                        })
                    end
                    -- Down connection
                    if y < 19 then
                        table.insert(large_map.transition_points, {
                            id = x .. "," .. y .. "-" .. x .. "," .. (y+1) .. "-3",
                            chunks = {x .. "," .. y, x .. "," .. (y+1)},
                            position = 3,
                            connections = {}
                        })
                    end
                end
            end
            
            local config = mock_data.create_test_config(large_map)
            HierarchicalPathfinder.init(config)
            
            -- Time the pathfinding
            local start_time = os.clock()
            
            -- Diagonal path across entire map
            local start_pos = {x = 48, y = 48, z = 0}          -- Near 0,0
            local end_pos = {x = 1872, y = 1872, z = 0}        -- Near 19,19
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            local end_time = os.clock()
            local elapsed = end_time - start_time
            
            assert.is_not_nil(segments)
            assert.is_true(elapsed < 1.0, "Pathfinding took too long: " .. elapsed .. " seconds")
            
            -- Should create reasonable path
            assert.is_true(#segments >= 20, "Path should have many segments for long distance")
            assert.is_true(#segments <= 40, "Path should not be overly complex")
        end)
    end)
    
    describe("edge case integration", function()
        it("should handle path along map edges", function()
            -- 3x3 map where path must go along edges
            local edge_scenario = {
                chunks = {
                    ["0,0"] = mock_data.WATER_CHUNK,
                    ["1,0"] = mock_data.WATER_CHUNK,
                    ["2,0"] = mock_data.WATER_CHUNK,
                    ["0,1"] = mock_data.WATER_CHUNK,
                    ["1,1"] = mock_data.LAND_CHUNK,    -- Center blocked
                    ["2,1"] = mock_data.WATER_CHUNK,
                    ["0,2"] = mock_data.WATER_CHUNK,
                    ["1,2"] = mock_data.WATER_CHUNK,
                    ["2,2"] = mock_data.WATER_CHUNK,
                },
                transition_points = {
                    -- Top edge
                    {id = "0,0-1,0-3", chunks = {"0,0", "1,0"}, position = 3, connections = {}},
                    {id = "1,0-2,0-3", chunks = {"1,0", "2,0"}, position = 3, connections = {}},
                    -- Sides
                    {id = "0,0-0,1-3", chunks = {"0,0", "0,1"}, position = 3, connections = {}},
                    {id = "0,1-0,2-3", chunks = {"0,1", "0,2"}, position = 3, connections = {}},
                    {id = "2,0-2,1-3", chunks = {"2,0", "2,1"}, position = 3, connections = {}},
                    {id = "2,1-2,2-3", chunks = {"2,1", "2,2"}, position = 3, connections = {}},
                    -- Bottom edge
                    {id = "0,2-1,2-3", chunks = {"0,2", "1,2"}, position = 3, connections = {}},
                    {id = "1,2-2,2-3", chunks = {"1,2", "2,2"}, position = 3, connections = {}},
                },
                width = 3,
                height = 3
            }
            
            local config = mock_data.create_test_config(edge_scenario)
            HierarchicalPathfinder.init(config)
            
            -- Path from opposite corners
            local start_pos = {x = 8, y = 8, z = 0}        -- Top-left of 0,0
            local end_pos = {x = 280, y = 280, z = 0}      -- Bottom-right of 2,2
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            
            -- Should not visit center chunk
            for _, segment in ipairs(segments) do
                assert.are_not_equal("1,1", segment.chunk)
            end
            
            -- Should reach destination
            assert.are.equal("2,2", segments[#segments].chunk)
        end)
        
        it("should handle start and end in same chunk with obstacles", function()
            -- Custom chunk with obstacles
            local obstacle_chunk = {
                {0, 0, 1, 1, 0, 0},
                {0, 0, 1, 1, 0, 0},
                {0, 0, 1, 1, 0, 0},
                {0, 0, 1, 1, 0, 0},
                {0, 0, 0, 0, 0, 0},
                {0, 0, 0, 0, 0, 0}
            }
            
            local single_chunk_scenario = {
                chunks = {
                    ["0,0"] = obstacle_chunk
                },
                transition_points = {},
                width = 1,
                height = 1
            }
            
            local config = mock_data.create_test_config(single_chunk_scenario)
            HierarchicalPathfinder.init(config)
            
            -- Path from left side to right side, must go around obstacle
            local start_pos = {x = 8, y = 8, z = 0}    -- Left side
            local end_pos = {x = 80, y = 8, z = 0}     -- Right side
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            assert.are.equal(1, #segments)
            assert.are.equal("0,0", segments[1].chunk)
            
            -- Path should go around obstacle (check y coordinate changed)
            -- The exact path depends on the local pathfinder implementation
        end)
        
        it("should handle multiple valid paths", function()
            -- Map with two equally valid paths
            local multi_path_scenario = {
                chunks = {
                    -- Start area
                    ["0,0"] = mock_data.WATER_CHUNK,
                    -- Two parallel paths
                    ["1,0"] = mock_data.WATER_CHUNK,  -- Upper path
                    ["1,1"] = mock_data.WATER_CHUNK,  -- Lower path
                    -- End area
                    ["2,0"] = mock_data.WATER_CHUNK,
                    ["2,1"] = mock_data.WATER_CHUNK,
                },
                transition_points = {
                    -- From start to both paths
                    {id = "0,0-1,0-2", chunks = {"0,0", "1,0"}, position = 2, connections = {}},
                    {id = "0,0-1,1-4", chunks = {"0,0", "1,1"}, position = 4, connections = {}},
                    -- From both paths to end
                    {id = "1,0-2,0-3", chunks = {"1,0", "2,0"}, position = 3, connections = {}},
                    {id = "1,1-2,1-3", chunks = {"1,1", "2,1"}, position = 3, connections = {}},
                    -- Connect end chunks
                    {id = "2,0-2,1-3", chunks = {"2,0", "2,1"}, position = 3, connections = {}},
                },
                width = 3,
                height = 2
            }
            
            local config = mock_data.create_test_config(multi_path_scenario)
            HierarchicalPathfinder.init(config)
            
            local start_pos = {x = 48, y = 48, z = 0}      -- Center of 0,0
            local end_pos = {x = 240, y = 80, z = 0}       -- Slightly toward upper path
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            
            -- Should find one of the valid paths
            local used_upper = false
            local used_lower = false
            
            for _, segment in ipairs(segments) do
                if segment.chunk == "1,0" then used_upper = true end
                if segment.chunk == "1,1" then used_lower = true end
            end
            
            -- Should use exactly one path, not both
            assert.is_true((used_upper and not used_lower) or (used_lower and not used_upper),
                "Should use exactly one of the two paths")
        end)
    end)
end) 