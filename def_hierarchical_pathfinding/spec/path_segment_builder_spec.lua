describe("Path Segment Builder", function()
    local path_segment_builder = require "src.path_segment_builder"
    local mock_data = require "spec.mock_data"
    
    -- Mock dependencies
    local mock_local_pathfinder = {
        find_path = function(chunk_data, start_pos, end_pos)
            -- Simple mock: return direct path
            local path = {}
            -- Add intermediate steps for testing
            table.insert(path, start_pos)
            if start_pos.x ~= end_pos.x or start_pos.y ~= end_pos.y then
                table.insert(path, {x = math.floor((start_pos.x + end_pos.x) / 2), 
                                  y = math.floor((start_pos.y + end_pos.y) / 2)})
            end
            table.insert(path, end_pos)
            return path
        end
    }
    
    local mock_transition_resolver = {
        get_optimal_transition = function(from_pos, to_pos, points, chunk_size, tile_size)
            -- Return first available point
            return points[1]
        end,
        get_transition_position = function(point, from_chunk, to_chunk, chunk_size, tile_size)
            -- Mock position calculation
            local from_coords = {x = tonumber(from_chunk:match("([^,]+)")), 
                               y = tonumber(from_chunk:match(",(.+)"))}
            local to_coords = {x = tonumber(to_chunk:match("([^,]+)")), 
                             y = tonumber(to_chunk:match(",(.+)"))}
            
            if to_coords.x > from_coords.x then
                -- Moving right
                return {x = 95, y = point.position * 16, z = 0}
            elseif to_coords.x < from_coords.x then
                -- Moving left
                return {x = 0, y = point.position * 16, z = 0}
            elseif to_coords.y > from_coords.y then
                -- Moving down
                return {x = point.position * 16, y = 95, z = 0}
            else
                -- Moving up
                return {x = point.position * 16, y = 0, z = 0}
            end
        end
    }
    
    local mock_coord_utils = {
        global_to_local = function(global_pos, chunk_id, chunk_size, tile_size)
            -- Simple mock conversion
            local chunk_coords = {x = tonumber(chunk_id:match("([^,]+)")), 
                                y = tonumber(chunk_id:match(",(.+)"))}
            return {
                x = math.floor((global_pos.x - chunk_coords.x * chunk_size * tile_size) / tile_size),
                y = math.floor((global_pos.y - chunk_coords.y * chunk_size * tile_size) / tile_size)
            }
        end,
        tile_center_to_global = function(x, y, chunk_id, chunk_size, tile_size)
            local chunk_coords = {x = tonumber(chunk_id:match("([^,]+)")), 
                                y = tonumber(chunk_id:match(",(.+)"))}
            return {
                x = chunk_coords.x * chunk_size * tile_size + x * tile_size + tile_size / 2,
                y = chunk_coords.y * chunk_size * tile_size + y * tile_size + tile_size / 2,
                z = 0
            }
        end
    }
    
    local config = {
        chunk_size = 6,
        tile_size = 16,
        get_chunk_data = function(chunk_id) return mock_data.WATER_CHUNK end,
        transition_points = mock_data.COMPLEX_TRANSITION_POINTS,
        -- Inject mocked dependencies
        _local_pathfinder = mock_local_pathfinder,
        _transition_resolver = mock_transition_resolver,
        _coord_utils = mock_coord_utils
    }
    
    describe("build_segments", function()
        describe("single chunk paths", function()
            it("should build segment for path within single chunk", function()
                local chunk_path = {"0,0"}
                local start_pos = {x = 16, y = 16, z = 0}
                local end_pos = {x = 64, y = 64, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(1, #segments)
                assert.are.equal("0,0", segments[1].chunk)
                assert.are.same(end_pos, segments[1].position)
            end)
            
            it("should handle start and end at same position", function()
                local chunk_path = {"0,0"}
                local pos = {x = 48, y = 48, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, pos, pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(1, #segments)
                assert.are.same(pos, segments[1].position)
            end)
        end)
        
        describe("multi-chunk paths", function()
            it("should build segments for two-chunk path", function()
                local chunk_path = {"0,0", "1,0"}
                local start_pos = {x = 48, y = 48, z = 0}    -- Middle of 0,0
                local end_pos = {x = 144, y = 48, z = 0}     -- Middle of 1,0
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(2, #segments)
                
                -- First segment: transition point from 0,0 to 1,0
                assert.are.equal("0,0", segments[1].chunk)
                assert.are.equal(95, segments[1].position.x)  -- Edge of chunk
                
                -- Second segment: final destination in 1,0
                assert.are.equal("1,0", segments[2].chunk)
                assert.are.same(end_pos, segments[2].position)
            end)
            
            it("should build segments for three-chunk path", function()
                local chunk_path = {"0,0", "1,0", "1,1"}
                local start_pos = {x = 16, y = 16, z = 0}
                local end_pos = {x = 160, y = 160, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(3, #segments)
                
                -- Verify chunk sequence
                assert.are.equal("0,0", segments[1].chunk)
                assert.are.equal("1,0", segments[2].chunk)
                assert.are.equal("1,1", segments[3].chunk)
                
                -- Last segment should be the end position
                assert.are.same(end_pos, segments[3].position)
            end)
            
            it("should handle complex path through multiple chunks", function()
                local chunk_path = {"0,0", "1,0", "1,1", "0,1"}
                local start_pos = {x = 8, y = 8, z = 0}
                local end_pos = {x = 88, y = 136, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(4, #segments)
                
                -- Each segment should correspond to a chunk in the path
                for i, segment in ipairs(segments) do
                    assert.are.equal(chunk_path[i], segment.chunk)
                end
            end)
        end)
        
        describe("transition point selection", function()
            it("should use optimal transition points", function()
                -- Create custom transition points for testing
                local custom_transitions = {
                    {
                        id = "0,0-1,0-1",
                        chunks = {"0,0", "1,0"},
                        position = 1,  -- Top
                        connections = {}
                    },
                    {
                        id = "0,0-1,0-5",
                        chunks = {"0,0", "1,0"},
                        position = 5,  -- Bottom
                        connections = {}
                    }
                }
                
                local custom_config = {
                    chunk_size = 6,
                    tile_size = 16,
                    get_chunk_data = config.get_chunk_data,
                    transition_points = custom_transitions,
                    _local_pathfinder = mock_local_pathfinder,
                    _transition_resolver = mock_transition_resolver,
                    _coord_utils = mock_coord_utils
                }
                
                local chunk_path = {"0,0", "1,0"}
                local start_pos = {x = 48, y = 80, z = 0}  -- Lower part of chunk
                local end_pos = {x = 144, y = 80, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, custom_config
                )
                
                assert.is_not_nil(segments)
                -- Should have selected a transition point
                assert.is_not_nil(segments[1].position)
            end)
        end)
        
        describe("error handling", function()
            it("should return nil for empty chunk path", function()
                local segments = path_segment_builder.build_segments(
                    {}, {x = 0, y = 0}, {x = 100, y = 100}, config
                )
                
                assert.is_nil(segments)
            end)
            
            it("should handle missing transition points", function()
                local no_transition_config = {
                    chunk_size = 6,
                    tile_size = 16,
                    get_chunk_data = config.get_chunk_data,
                    transition_points = {},  -- No transitions
                    _local_pathfinder = mock_local_pathfinder,
                    _transition_resolver = mock_transition_resolver,
                    _coord_utils = mock_coord_utils
                }
                
                local chunk_path = {"0,0", "1,0"}
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 144, y = 48, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, no_transition_config
                )
                
                -- Should return nil or handle gracefully
                assert.is_nil(segments)
            end)
            
            it("should handle unreachable local paths", function()
                -- Mock pathfinder that returns nil
                local failing_pathfinder = {
                    find_path = function() return nil end
                }
                
                local fail_config = {
                    chunk_size = 6,
                    tile_size = 16,
                    get_chunk_data = config.get_chunk_data,
                    transition_points = config.transition_points,
                    _local_pathfinder = failing_pathfinder,
                    _transition_resolver = mock_transition_resolver,
                    _coord_utils = mock_coord_utils
                }
                
                local chunk_path = {"0,0", "1,0"}
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 144, y = 48, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, fail_config
                )
                
                assert.is_nil(segments)
            end)
        end)
        
        describe("segment validation", function()
            it("should ensure all segments have required fields", function()
                local chunk_path = {"0,0", "1,0", "1,1"}
                local start_pos = {x = 16, y = 16, z = 0}
                local end_pos = {x = 160, y = 160, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                
                for i, segment in ipairs(segments) do
                    assert.is_not_nil(segment.chunk, "Segment " .. i .. " missing chunk")
                    assert.is_not_nil(segment.position, "Segment " .. i .. " missing position")
                    assert.is_number(segment.position.x, "Segment " .. i .. " position.x not a number")
                    assert.is_number(segment.position.y, "Segment " .. i .. " position.y not a number")
                    assert.is_number(segment.position.z, "Segment " .. i .. " position.z not a number")
                end
            end)
            
            it("should maintain path continuity", function()
                local chunk_path = {"0,0", "1,0", "2,0"}
                local start_pos = {x = 48, y = 48, z = 0}
                local end_pos = {x = 240, y = 48, z = 0}
                
                local segments = path_segment_builder.build_segments(
                    chunk_path, start_pos, end_pos, config
                )
                
                assert.is_not_nil(segments)
                assert.are.equal(#chunk_path, #segments)
                
                -- Each segment should be in the corresponding chunk
                for i = 1, #segments do
                    assert.are.equal(chunk_path[i], segments[i].chunk)
                end
            end)
        end)
    end)
    
    describe("optimize_segments", function()
        it("should merge consecutive segments in same chunk", function()
            local segments = {
                {chunk = "0,0", position = {x = 16, y = 16, z = 0}},
                {chunk = "0,0", position = {x = 32, y = 32, z = 0}},
                {chunk = "0,0", position = {x = 48, y = 48, z = 0}},
                {chunk = "1,0", position = {x = 112, y = 48, z = 0}}
            }
            
            local optimized = path_segment_builder.optimize_segments(segments)
            
            assert.is_not_nil(optimized)
            assert.are.equal(2, #optimized)  -- Should merge first 3 segments
            assert.are.equal("0,0", optimized[1].chunk)
            assert.are.same({x = 48, y = 48, z = 0}, optimized[1].position)
            assert.are.equal("1,0", optimized[2].chunk)
        end)
        
        it("should not merge segments from different chunks", function()
            local segments = {
                {chunk = "0,0", position = {x = 48, y = 48, z = 0}},
                {chunk = "1,0", position = {x = 112, y = 48, z = 0}},
                {chunk = "1,1", position = {x = 144, y = 144, z = 0}}
            }
            
            local optimized = path_segment_builder.optimize_segments(segments)
            
            assert.is_not_nil(optimized)
            assert.are.equal(3, #optimized)  -- No merging should occur
        end)
    end)
end) 