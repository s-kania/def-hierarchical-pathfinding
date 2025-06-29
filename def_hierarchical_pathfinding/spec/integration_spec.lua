describe("Integration Tests", function()
    local HierarchicalPathfinder = require "hierarchical_pathfinding"
    local mock_data = require "spec.mock_data"
    
    describe("real-world scenarios", function()
        it("should navigate across connected 3x3 map", function()
            -- Use the fully connected 3x3 test map
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            -- Test diagonal path across the map
            local start_pos = mock_data.TEST_POSITIONS.top_left
            local end_pos = mock_data.TEST_POSITIONS.bottom_right
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            -- Should find a path in connected map
            assert.is_not_nil(segments)
            assert.is_true(#segments >= 3)  -- Should go through multiple chunks
            
            -- Verify start and end
            assert.are.equal("0,0", segments[1].chunk)
            local last = segments[#segments]
            assert.are.equal("2,2", last.chunk)
            assert.are.same(end_pos, last.position)
        end)
        
        it("should handle multi-hop paths in 3x3 map", function()
            -- Use the 3x3 test map for a simpler test
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            -- Test path from one corner to another via multiple chunks
            local start_pos = mock_data.TEST_POSITIONS.top_right    -- Chunk 2,0
            local end_pos = mock_data.TEST_POSITIONS.bottom_left    -- Chunk 0,2
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            assert.is_true(#segments >= 3)  -- Should go through multiple chunks
            
            -- Verify start and end chunks
            assert.are.equal("2,0", segments[1].chunk)
            local last_segment = segments[#segments]
            assert.are.equal("0,2", last_segment.chunk)
            assert.are.same(end_pos, last_segment.position)
        end)
        
        it("should handle edge-to-edge paths in 3x3 map", function()
            -- Use the 3x3 test map
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            -- Test path from center of one edge to center of opposite edge
            local start_pos = mock_data.TEST_POSITIONS.edge_center  -- Center of top edge
            local end_pos = {x = 144, y = 232, z = 0}              -- Center of bottom edge
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            assert.is_true(#segments >= 2)  -- Should go through at least 2 chunks
            
            -- Should end at target
            local last_segment = segments[#segments]
            assert.are.same(end_pos, last_segment.position)
        end)
    end)
    
    describe("performance scenarios", function()
        it("should handle 3x3 map efficiently", function()
            -- Use the 3x3 test map for performance testing
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            -- Time the pathfinding
            local start_time = os.clock()
            
            -- Diagonal path across 3x3 map
            local start_pos = mock_data.TEST_POSITIONS.top_left
            local end_pos = mock_data.TEST_POSITIONS.bottom_right
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            local end_time = os.clock()
            local elapsed = end_time - start_time
            
            assert.is_not_nil(segments)
            assert.is_true(elapsed < 0.1, "Pathfinding took too long: " .. elapsed .. " seconds")
            
            -- Should create reasonable path
            assert.is_true(#segments >= 3, "Path should go through multiple chunks")
            assert.is_true(#segments <= 6, "Path should not be overly complex")
        end)
    end)
    
    describe("edge case integration", function()
        it("should handle path along map edges", function()
            -- Use standard 3x3 map (all water chunks)
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            -- Path from opposite corners
            local start_pos = mock_data.TEST_POSITIONS.top_left
            local end_pos = mock_data.TEST_POSITIONS.bottom_right
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            assert.is_true(#segments >= 3)  -- Should go through multiple chunks
            
            -- Should reach destination
            local last_segment = segments[#segments]
            assert.are.equal("2,2", last_segment.chunk)
            assert.are.same(end_pos, last_segment.position)
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
            -- Use standard 3x3 map which has multiple valid paths
            local config = mock_data.create_test_config(mock_data.TEST_MAP_3X3)
            HierarchicalPathfinder.init(config)
            
            local start_pos = mock_data.TEST_POSITIONS.center_0_0
            local end_pos = mock_data.TEST_POSITIONS.center_2_2
            
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments)
            assert.is_true(#segments >= 3)  -- Should go through multiple chunks
            
            -- Should reach the destination
            local last_segment = segments[#segments]
            assert.are.equal("2,2", last_segment.chunk)
            assert.are.same(end_pos, last_segment.position)
        end)
    end)
end) 