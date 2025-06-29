describe("Transition Resolver", function()
    local transition_resolver = require "src.transition_resolver"
    local mock_data = require "spec.mock_data"
    local coord_utils = require "src.utils.coord_utils"
    
    describe("get_transition_point", function()
        it("should find transition point between adjacent chunks", function()
            local point = transition_resolver.get_transition_point(
                "0,0", "1,0", mock_data.SIMPLE_TRANSITION_POINTS
            )
            
            assert.is_not_nil(point)
            assert.are.equal("0,0-1,0-3", point.id)
            assert.are.equal(3, point.position)
        end)
        
        it("should find transition in reverse order", function()
            local point = transition_resolver.get_transition_point(
                "1,0", "0,0", mock_data.SIMPLE_TRANSITION_POINTS
            )
            
            assert.is_not_nil(point)
            assert.are.equal("0,0-1,0-3", point.id)  -- Same point
        end)
        
        it("should return nil for non-adjacent chunks", function()
            local point = transition_resolver.get_transition_point(
                "0,0", "2,2", mock_data.SIMPLE_TRANSITION_POINTS
            )
            
            assert.is_nil(point)
        end)
        
        it("should handle multiple transition points", function()
            -- Get all points between 0,0 and 1,0
            local points = transition_resolver.get_all_transition_points(
                "0,0", "1,0", mock_data.COMPLEX_TRANSITION_POINTS
            )
            
            assert.is_not_nil(points)
            assert.are.equal(2, #points)
            
            -- Both positions should be found
            local positions = {}
            for _, p in ipairs(points) do
                table.insert(positions, p.position)
            end
            table.sort(positions)
            assert.are.same({2, 4}, positions)
        end)
    end)
    
    describe("get_optimal_transition", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should choose closest transition to destination", function()
            local from_pos = {x = 0, y = 0, z = 0}       -- Top-left of chunk 0,0
            local to_pos = {x = 200, y = 32, z = 0}      -- Somewhere in chunk 2,0, lower
            
            -- Multiple transition points between 0,0 and 1,0
            local available_points = {
                {
                    id = "0,0-1,0-2",
                    chunks = {"0,0", "1,0"},
                    position = 2,  -- Lower position
                    connections = {}
                },
                {
                    id = "0,0-1,0-4",
                    chunks = {"0,0", "1,0"},
                    position = 4,  -- Higher position
                    connections = {}
                }
            }
            
            local optimal = transition_resolver.get_optimal_transition(
                from_pos, to_pos, available_points, chunk_size, tile_size
            )
            
            assert.is_not_nil(optimal)
            assert.are.equal(2, optimal.position)  -- Should choose lower position
        end)
        
        it("should consider path distance from start", function()
            local from_pos = {x = 80, y = 80, z = 0}     -- Bottom-right of chunk 0,0
            local to_pos = {x = 200, y = 200, z = 0}     -- Far away
            
            local available_points = {
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
            
            local optimal = transition_resolver.get_optimal_transition(
                from_pos, to_pos, available_points, chunk_size, tile_size
            )
            
            assert.is_not_nil(optimal)
            assert.are.equal(5, optimal.position)  -- Should choose bottom (closer to start)
        end)
        
        it("should handle single transition point", function()
            local from_pos = {x = 0, y = 0, z = 0}
            local to_pos = {x = 200, y = 200, z = 0}
            
            local available_points = {mock_data.SIMPLE_TRANSITION_POINTS[1]}
            
            local optimal = transition_resolver.get_optimal_transition(
                from_pos, to_pos, available_points, chunk_size, tile_size
            )
            
            assert.is_not_nil(optimal)
            assert.are.equal("0,0-1,0-3", optimal.id)
        end)
        
        it("should return nil for empty points", function()
            local from_pos = {x = 0, y = 0, z = 0}
            local to_pos = {x = 200, y = 200, z = 0}
            
            local optimal = transition_resolver.get_optimal_transition(
                from_pos, to_pos, {}, chunk_size, tile_size
            )
            
            assert.is_nil(optimal)
        end)
    end)
    
    describe("get_transition_position", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should calculate position for horizontal transition", function()
            local point = {
                id = "0,0-1,0-3",
                chunks = {"0,0", "1,0"},
                position = 3
            }
            
            -- From chunk 0,0 to 1,0
            local pos = transition_resolver.get_transition_position(
                point, "0,0", "1,0", chunk_size, tile_size
            )
            
            assert.is_not_nil(pos)
            assert.are.equal(88, pos.x)   -- Center of rightmost tile (5 * 16 + 8)
            assert.are.equal(56, pos.y)   -- Center of position 3 tile (3 * 16 + 8)
            assert.are.equal(0, pos.z)
        end)
        
        it("should calculate position for vertical transition", function()
            local point = {
                id = "0,0-0,1-2",
                chunks = {"0,0", "0,1"},
                position = 2
            }
            
            -- From chunk 0,0 to 0,1
            local pos = transition_resolver.get_transition_position(
                point, "0,0", "0,1", chunk_size, tile_size
            )
            
            assert.is_not_nil(pos)
            assert.are.equal(40, pos.x)   -- Center of position 2 tile (2 * 16 + 8)
            assert.are.equal(88, pos.y)   -- Center of bottommost tile (5 * 16 + 8)
            assert.are.equal(0, pos.z)
        end)
        
        it("should handle reverse direction", function()
            local point = {
                id = "0,0-1,0-3",
                chunks = {"0,0", "1,0"},
                position = 3
            }
            
            -- From chunk 1,0 to 0,0 (reverse)
            local pos = transition_resolver.get_transition_position(
                point, "1,0", "0,0", chunk_size, tile_size
            )
            
            assert.is_not_nil(pos)
            assert.are.equal(104, pos.x)  -- Center of leftmost tile of chunk 1,0 (96 + 8)
            assert.are.equal(56, pos.y)   -- Center of position 3 tile (3 * 16 + 8)
            assert.are.equal(0, pos.z)
        end)
    end)
    
    describe("validate_transition_point", function()
        it("should validate accessible transition point", function()
            local point = {
                id = "0,0-1,0-3",
                chunks = {"0,0", "1,0"},
                position = 3
            }
            
            local chunk_data_getter = function(chunk_id)
                return mock_data.WATER_CHUNK  -- All water
            end
            
            local is_valid = transition_resolver.validate_transition_point(
                point, chunk_data_getter
            )
            
            assert.is_true(is_valid)
        end)
        
        it("should invalidate blocked transition point", function()
            local point = {
                id = "0,0-1,0-2",
                chunks = {"0,0", "1,0"},
                position = 2
            }
            
            local chunk_data_getter = function(chunk_id)
                if chunk_id == "0,0" then
                    -- Custom chunk with blocked edge
                    local chunk = {}
                    for y = 1, 6 do
                        chunk[y] = {}
                        for x = 1, 6 do
                            -- Block right edge at position 2
                            if x == 6 and y == 3 then  -- position 2 is row 3 (0-indexed)
                                chunk[y][x] = 1  -- Land
                            else
                                chunk[y][x] = 0  -- Water
                            end
                        end
                    end
                    return chunk
                end
                return mock_data.WATER_CHUNK
            end
            
            local is_valid = transition_resolver.validate_transition_point(
                point, chunk_data_getter
            )
            
            assert.is_false(is_valid)
        end)
    end)
    
    describe("filter_valid_transitions", function()
        it("should filter out blocked transitions", function()
            local transitions = {
                {
                    id = "0,0-1,0-2",
                    chunks = {"0,0", "1,0"},
                    position = 2
                },
                {
                    id = "0,0-1,0-4",
                    chunks = {"0,0", "1,0"},
                    position = 4
                }
            }
            
            local chunk_data_getter = function(chunk_id)
                -- Block position 2, keep position 4 open
                local chunk = {}
                for y = 1, 6 do
                    chunk[y] = {}
                    for x = 1, 6 do
                        if x == 6 and y == 3 then  -- Block position 2
                            chunk[y][x] = 1
                        else
                            chunk[y][x] = 0
                        end
                    end
                end
                return chunk
            end
            
            local valid = transition_resolver.filter_valid_transitions(
                transitions, chunk_data_getter
            )
            
            assert.are.equal(1, #valid)
            assert.are.equal(4, valid[1].position)
        end)
        
        it("should return empty array if all blocked", function()
            local transitions = mock_data.SIMPLE_TRANSITION_POINTS
            
            local chunk_data_getter = function(chunk_id)
                return mock_data.LAND_CHUNK  -- All land
            end
            
            local valid = transition_resolver.filter_valid_transitions(
                transitions, chunk_data_getter
            )
            
            assert.are.equal(0, #valid)
        end)
    end)
    
    describe("find_alternative_transition", function()
        it("should find alternative when primary is blocked", function()
            local primary_point = {
                id = "0,0-1,0-2",
                chunks = {"0,0", "1,0"},
                position = 2
            }
            
            local all_transitions = mock_data.COMPLEX_TRANSITION_POINTS
            
            local chunk_data_getter = function(chunk_id)
                -- Block position 2
                local chunk = {}
                for y = 1, 6 do
                    chunk[y] = {}
                    for x = 1, 6 do
                        if x == 6 and y == 3 then
                            chunk[y][x] = 1
                        else
                            chunk[y][x] = 0
                        end
                    end
                end
                return chunk
            end
            
            local alternative = transition_resolver.find_alternative_transition(
                primary_point, all_transitions, chunk_data_getter
            )
            
            assert.is_not_nil(alternative)
            assert.are.not_equal(2, alternative.position)
            assert.are.equal("0,0", alternative.chunks[1])
            assert.are.equal("1,0", alternative.chunks[2])
        end)
        
        it("should return nil if no alternatives exist", function()
            local primary_point = mock_data.SIMPLE_TRANSITION_POINTS[1]
            
            local chunk_data_getter = function(chunk_id)
                return mock_data.LAND_CHUNK  -- All blocked
            end
            
            local alternative = transition_resolver.find_alternative_transition(
                primary_point, mock_data.SIMPLE_TRANSITION_POINTS, chunk_data_getter
            )
            
            assert.is_nil(alternative)
        end)
    end)
end) 