describe("Hierarchical Pathfinding", function()
    local HierarchicalPathfinder = require "hierarchical_pathfinding"
    local mock_data = require "spec.mock_data"
    
    describe("init", function()
        it("should initialize with valid config", function()
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            
            assert.has_no_error(function()
                HierarchicalPathfinder.init(config)
            end)
        end)
        
        it("should validate required config fields", function()
            -- Missing chunk_size
            assert.has_error(function()
                HierarchicalPathfinder.init({
                    tile_size = 16,
                    map_width = 10,
                    map_height = 10,
                    get_chunk_data = function() end,
                    transition_points = {}
                })
            end)
            
            -- Missing get_chunk_data function
            assert.has_error(function()
                HierarchicalPathfinder.init({
                    chunk_size = 6,
                    tile_size = 16,
                    map_width = 10,
                    map_height = 10,
                    transition_points = {}
                })
            end)
        end)
        
        it("should validate config value ranges", function()
            -- Invalid chunk_size
            assert.has_error(function()
                HierarchicalPathfinder.init({
                    chunk_size = 0,
                    tile_size = 16,
                    map_width = 10,
                    map_height = 10,
                    get_chunk_data = function() end,
                    transition_points = {}
                })
            end)
            
            -- Negative map dimensions
            assert.has_error(function()
                HierarchicalPathfinder.init({
                    chunk_size = 6,
                    tile_size = 16,
                    map_width = -5,
                    map_height = 10,
                    get_chunk_data = function() end,
                    transition_points = {}
                })
            end)
        end)
        
        it("should store config internally", function()
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            HierarchicalPathfinder.init(config)
            
            -- Test by using find_path (which needs config)
            local start_pos = {x = 48, y = 48, z = 0}
            local end_pos = {x = 48, y = 48, z = 0}
            
            assert.has_no_error(function()
                HierarchicalPathfinder.find_path(start_pos, end_pos)
            end)
        end)
    end)
    
    describe("find_path", function()
        before_each(function()
            -- Initialize with simple map before each test
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            HierarchicalPathfinder.init(config)
        end)
        
        describe("single chunk paths", function()
            it("should find path within single chunk", function()
                local start_pos = mock_data.TEST_POSITIONS.center_0_0
                local end_pos = {x = 80, y = 80, z = 0}  -- Still in chunk 0,0
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                assert.are.equal(1, #segments)
                assert.are.equal("0,0", segments[1].chunk)
                assert.are.same(end_pos, segments[1].position)
            end)
            
            it("should handle same start and end position", function()
                local pos = mock_data.TEST_POSITIONS.center_0_0
                
                local segments = HierarchicalPathfinder.find_path(pos, pos)
                
                assert.is_not_nil(segments)
                assert.are.equal(1, #segments)
                assert.are.same(pos, segments[1].position)
            end)
        end)
        
        describe("multi-chunk paths", function()
            it("should find path between adjacent chunks", function()
                local start_pos = mock_data.TEST_POSITIONS.center_0_0
                local end_pos = mock_data.TEST_POSITIONS.center_1_1
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                assert.is_true(#segments >= 3)  -- At least 3 chunks in path
                
                -- Verify first and last segments
                assert.are.equal("0,0", segments[1].chunk)
                local last_segment = segments[#segments]
                assert.are.equal("1,1", last_segment.chunk)
                assert.are.same(end_pos, last_segment.position)
            end)
            
            it("should find optimal path through multiple chunks", function()
                -- Initialize with complex map
                local config = mock_data.create_test_config(mock_data.CORRIDOR_MAP)
                HierarchicalPathfinder.init(config)
                
                local start_pos = {x = 48, y = 48, z = 0}    -- Chunk 0,0
                local end_pos = {x = 240, y = 240, z = 0}    -- Chunk 2,2
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                assert.is_true(#segments > 1)
                
                -- Verify path continuity
                for i = 1, #segments do
                    assert.is_not_nil(segments[i].chunk)
                    assert.is_not_nil(segments[i].position)
                end
            end)
        end)
        
        describe("no path scenarios", function()
            it("should return nil when start is on land", function()
                local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
                HierarchicalPathfinder.init(config)
                
                local start_pos = mock_data.TEST_POSITIONS.on_land
                local end_pos = {x = 200, y = 200, z = 0}
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_nil(segments)
            end)
            
            it("should return nil when end is on land", function()
                local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
                HierarchicalPathfinder.init(config)
                
                local start_pos = {x = 8, y = 8, z = 0}  -- In water
                local end_pos = {x = 144, y = 144, z = 0}  -- Center of land chunk
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_nil(segments)
            end)
            
            it("should return nil for disconnected areas", function()
                local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
                HierarchicalPathfinder.init(config)
                
                local start_pos = {x = 8, y = 8, z = 0}      -- Top-left water
                local end_pos = {x = 280, y = 280, z = 0}    -- Bottom-right water
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_nil(segments)
            end)
        end)
        
        describe("edge cases", function()
            it("should handle positions at chunk boundaries", function()
                local start_pos = mock_data.TEST_POSITIONS.edge_0_0_to_1_0
                local end_pos = {x = 144, y = 144, z = 0}
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
            end)
            
            it("should handle very long paths", function()
                -- Create a large map config
                local large_map = {
                    chunks = {},
                    transition_points = {},
                    width = 10,
                    height = 10
                }
                
                -- Fill with water chunks
                for y = 0, 9 do
                    for x = 0, 9 do
                        large_map.chunks[x .. "," .. y] = mock_data.WATER_CHUNK
                    end
                end
                
                -- Add transition points for a connected path
                for y = 0, 8 do
                    for x = 0, 8 do
                        -- Horizontal connections
                        table.insert(large_map.transition_points, {
                            id = x .. "," .. y .. "-" .. (x+1) .. "," .. y .. "-3",
                            chunks = {x .. "," .. y, (x+1) .. "," .. y},
                            position = 3,
                            connections = {}
                        })
                        -- Vertical connections
                        table.insert(large_map.transition_points, {
                            id = x .. "," .. y .. "-" .. x .. "," .. (y+1) .. "-3",
                            chunks = {x .. "," .. y, x .. "," .. (y+1)},
                            position = 3,
                            connections = {}
                        })
                    end
                end
                
                local config = mock_data.create_test_config(large_map)
                HierarchicalPathfinder.init(config)
                
                local start_pos = {x = 8, y = 8, z = 0}        -- Top-left
                local end_pos = {x = 920, y = 920, z = 0}      -- Bottom-right
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                assert.is_true(#segments > 10)  -- Should have many segments
            end)
        end)
        
        describe("path validation", function()
            it("should return valid segment format", function()
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 144, y = 144, z = 0}
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                
                for i, segment in ipairs(segments) do
                    -- Check required fields
                    assert.is_string(segment.chunk, "Segment " .. i .. " chunk should be string")
                    assert.is_table(segment.position, "Segment " .. i .. " position should be table")
                    assert.is_number(segment.position.x)
                    assert.is_number(segment.position.y)
                    assert.is_number(segment.position.z)
                    
                    -- Check chunk ID format
                    assert.is_truthy(segment.chunk:match("^%-?%d+,%-?%d+$"), 
                        "Invalid chunk ID format: " .. segment.chunk)
                end
            end)
            
            it("should ensure path connectivity", function()
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 144, y = 144, z = 0}
                
                local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
                
                assert.is_not_nil(segments)
                
                -- Last segment should end at target position
                local last_segment = segments[#segments]
                assert.are.same(end_pos, last_segment.position)
            end)
        end)
    end)
    
    describe("helper functions", function()
        before_each(function()
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            HierarchicalPathfinder.init(config)
        end)
        
        describe("get_chunk_from_global", function()
            it("should return correct chunk ID", function()
                local pos = {x = 48, y = 48, z = 0}
                local chunk_id = HierarchicalPathfinder.get_chunk_from_global(pos)
                assert.are.equal("0,0", chunk_id)
                
                pos = {x = 144, y = 144, z = 0}
                chunk_id = HierarchicalPathfinder.get_chunk_from_global(pos)
                assert.are.equal("1,1", chunk_id)
            end)
        end)
        
        describe("global_to_local", function()
            it("should convert global to local coordinates", function()
                local global_pos = {x = 144, y = 144, z = 0}
                local local_pos = HierarchicalPathfinder.global_to_local(global_pos, "1,1")
                
                assert.are.same({x = 3, y = 3}, local_pos)
            end)
        end)
        
        describe("local_to_global", function()
            it("should convert local to global coordinates", function()
                local local_pos = {x = 3, y = 3}
                local global_pos = HierarchicalPathfinder.local_to_global(local_pos, "1,1")
                
                assert.are.same({x = 144, y = 144, z = 0}, global_pos)
            end)
        end)
        
        describe("is_position_walkable", function()
            it("should return true for water positions", function()
                local pos = {x = 48, y = 48, z = 0}
                assert.is_true(HierarchicalPathfinder.is_position_walkable(pos))
            end)
            
            it("should return false for land positions", function()
                local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
                HierarchicalPathfinder.init(config)
                
                -- Position in center of island chunk
                local pos = {x = 144, y = 144, z = 0}
                assert.is_false(HierarchicalPathfinder.is_position_walkable(pos))
            end)
        end)
        
        describe("can_reach", function()
            it("should return true for reachable positions", function()
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 144, y = 144, z = 0}
                
                assert.is_true(HierarchicalPathfinder.can_reach(start_pos, end_pos))
            end)
            
            it("should return false for unreachable positions", function()
                local config = mock_data.create_test_config(mock_data.ISLAND_MAP)
                HierarchicalPathfinder.init(config)
                
                local start_pos = {x = 8, y = 8, z = 0}      -- Top-left water
                local end_pos = {x = 280, y = 280, z = 0}    -- Bottom-right water (disconnected)
                
                assert.is_false(HierarchicalPathfinder.can_reach(start_pos, end_pos))
            end)
        end)
    end)
    
    describe("caching", function()
        before_each(function()
            local config = mock_data.create_test_config(mock_data.SIMPLE_MAP)
            config.enable_cache = true
            config.cache_size = 10
            HierarchicalPathfinder.init(config)
        end)
        
        it("should cache path results", function()
            local start_pos = {x = 48, y = 48, z = 0}
            local end_pos = {x = 144, y = 144, z = 0}
            
            -- First call
            local segments1 = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            -- Second call (should use cache)
            local segments2 = HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            assert.is_not_nil(segments1)
            assert.is_not_nil(segments2)
            assert.are.equal(#segments1, #segments2)
            
            -- Should be the same reference if cached
            for i = 1, #segments1 do
                assert.are.same(segments1[i], segments2[i])
            end
        end)
        
        it("should clear cache on demand", function()
            local start_pos = {x = 48, y = 48, z = 0}
            local end_pos = {x = 144, y = 144, z = 0}
            
            -- Cache a path
            HierarchicalPathfinder.find_path(start_pos, end_pos)
            
            -- Clear cache
            HierarchicalPathfinder.clear_cache()
            
            -- Should recalculate
            local segments = HierarchicalPathfinder.find_path(start_pos, end_pos)
            assert.is_not_nil(segments)
        end)
    end)
end) 