describe("Local Pathfinder", function()
    local local_pathfinder = require "src.local_pathfinder"
    local mock_data = require "spec.mock_data"
    
    describe("find_path", function()
        describe("basic pathfinding", function()
            it("should find simple horizontal path", function()
                local chunk_data = {
                    {0, 0, 0, 0, 0, 0},
                    {0, 0, 0, 0, 0, 0},
                    {0, 0, 0, 0, 0, 0},
                    {0, 0, 0, 0, 0, 0},
                    {0, 0, 0, 0, 0, 0},
                    {0, 0, 0, 0, 0, 0}
                }
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 0}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                assert.is_true(#path >= 6)  -- At least 6 steps
                
                -- Verify start and end
                assert.are.same(start_pos, path[1])
                assert.are.same(end_pos, path[#path])
            end)
            
            it("should find simple vertical path", function()
                local chunk_data = mock_data.WATER_CHUNK
                
                local start_pos = {x = 2, y = 0}
                local end_pos = {x = 2, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                assert.is_true(#path >= 6)
                
                -- All positions should have x = 2
                for _, pos in ipairs(path) do
                    assert.are.equal(2, pos.x)
                end
            end)
            
            it("should find diagonal path", function()
                local chunk_data = mock_data.WATER_CHUNK
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                assert.is_true(#path >= 11)  -- Manhattan distance is 10
            end)
        end)
        
        describe("obstacle avoidance", function()
            it("should navigate around island", function()
                local chunk_data = mock_data.ISLAND_CHUNK
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                
                -- Path should go around the island
                for _, pos in ipairs(path) do
                    local tile = chunk_data[pos.y + 1][pos.x + 1]
                    assert.are.equal(0, tile, "Path should only go through water")
                end
            end)
            
            it("should find path through narrow passage", function()
                local chunk_data = mock_data.PASSAGE_CHUNK
                
                local start_pos = {x = 0, y = 2}  -- Left side
                local end_pos = {x = 5, y = 3}    -- Right side
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                
                -- Should pass through center (x=2 or x=3)
                local passed_center = false
                for _, pos in ipairs(path) do
                    if pos.x == 2 or pos.x == 3 then
                        passed_center = true
                        break
                    end
                end
                assert.is_true(passed_center, "Path should go through center passage")
            end)
            
            it("should solve maze", function()
                local chunk_data = mock_data.MAZE_CHUNK
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                
                -- Verify path validity
                for i = 2, #path do
                    local prev = path[i-1]
                    local curr = path[i]
                    local dx = math.abs(curr.x - prev.x)
                    local dy = math.abs(curr.y - prev.y)
                    assert.is_true(dx + dy == 1, "Path should be continuous")
                end
            end)
        end)
        
        describe("no path scenarios", function()
            it("should return nil when no path exists", function()
                local chunk_data = mock_data.LAND_CHUNK  -- All land
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_nil(path)
            end)
            
            it("should return nil when start is on land", function()
                local chunk_data = mock_data.ISLAND_CHUNK
                
                local start_pos = {x = 2, y = 2}  -- On island
                local end_pos = {x = 0, y = 0}    -- In water
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_nil(path)
            end)
            
            it("should return nil when end is on land", function()
                local chunk_data = mock_data.ISLAND_CHUNK
                
                local start_pos = {x = 0, y = 0}   -- In water
                local end_pos = {x = 2, y = 2}     -- On island
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_nil(path)
            end)
            
            it("should return nil for disconnected areas", function()
                -- Custom chunk with two separate water areas
                local chunk_data = {
                    {0, 0, 1, 0, 0, 0},
                    {0, 0, 1, 0, 0, 0},
                    {1, 1, 1, 1, 1, 1},
                    {0, 0, 1, 0, 0, 0},
                    {0, 0, 1, 0, 0, 0},
                    {0, 0, 1, 0, 0, 0}
                }
                
                local start_pos = {x = 0, y = 0}  -- Top left water
                local end_pos = {x = 5, y = 5}    -- Bottom right water
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_nil(path)
            end)
        end)
        
        describe("edge cases", function()
            it("should handle same start and end position", function()
                local chunk_data = mock_data.WATER_CHUNK
                
                local pos = {x = 3, y = 3}
                local path = local_pathfinder.find_path(chunk_data, pos, pos)
                
                assert.is_not_nil(path)
                assert.are.equal(1, #path)
                assert.are.same(pos, path[1])
            end)
            
            it("should handle adjacent positions", function()
                local chunk_data = mock_data.WATER_CHUNK
                
                local start_pos = {x = 2, y = 2}
                local end_pos = {x = 2, y = 3}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos)
                assert.is_not_nil(path)
                assert.are.equal(2, #path)
            end)
            
            it("should validate positions within bounds", function()
                local chunk_data = mock_data.WATER_CHUNK
                
                -- Out of bounds
                assert.has_error(function()
                    local_pathfinder.find_path(chunk_data, {x = -1, y = 0}, {x = 3, y = 3})
                end)
                
                assert.has_error(function()
                    local_pathfinder.find_path(chunk_data, {x = 0, y = 0}, {x = 6, y = 3})
                end)
            end)
        end)
        
        describe("path optimization", function()
            it("should optimize straight lines", function()
                local chunk_data = mock_data.WATER_CHUNK
                local config = {optimize_path = true}
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 0}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos, config)
                assert.is_not_nil(path)
                
                -- Optimized path should have only start and end for straight line
                if config.optimize_path then
                    assert.are.equal(2, #path)
                end
            end)
            
            it("should smooth diagonal paths", function()
                local chunk_data = mock_data.WATER_CHUNK
                local config = {optimize_path = true}
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 3, y = 3}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos, config)
                assert.is_not_nil(path)
                
                -- Should be optimized
                if config.optimize_path then
                    assert.is_true(#path < 7)  -- Less than Manhattan distance
                end
            end)
        end)
        
        describe("heuristics", function()
            it("should support Manhattan distance", function()
                local chunk_data = mock_data.WATER_CHUNK
                local config = {heuristic = "manhattan"}
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos, config)
                assert.is_not_nil(path)
            end)
            
            it("should support Euclidean distance", function()
                local chunk_data = mock_data.WATER_CHUNK
                local config = {heuristic = "euclidean"}
                
                local start_pos = {x = 0, y = 0}
                local end_pos = {x = 5, y = 5}
                
                local path = local_pathfinder.find_path(chunk_data, start_pos, end_pos, config)
                assert.is_not_nil(path)
            end)
        end)
    end)
    
    describe("get_neighbors", function()
        it("should return 4 neighbors for center tile", function()
            local chunk_data = mock_data.WATER_CHUNK
            local pos = {x = 3, y = 3}
            
            local neighbors = local_pathfinder.get_neighbors(chunk_data, pos)
            assert.are.equal(4, #neighbors)
            
            -- Check all 4 directions
            local has_up = false
            local has_down = false
            local has_left = false
            local has_right = false
            
            for _, n in ipairs(neighbors) do
                if n.x == 3 and n.y == 2 then has_up = true end
                if n.x == 3 and n.y == 4 then has_down = true end
                if n.x == 2 and n.y == 3 then has_left = true end
                if n.x == 4 and n.y == 3 then has_right = true end
            end
            
            assert.is_true(has_up and has_down and has_left and has_right)
        end)
        
        it("should return only valid neighbors for corner", function()
            local chunk_data = mock_data.WATER_CHUNK
            local pos = {x = 0, y = 0}
            
            local neighbors = local_pathfinder.get_neighbors(chunk_data, pos)
            assert.are.equal(2, #neighbors)  -- Only right and down
        end)
        
        it("should exclude land tiles", function()
            local chunk_data = mock_data.ISLAND_CHUNK
            local pos = {x = 0, y = 1}  -- Next to island
            
            local neighbors = local_pathfinder.get_neighbors(chunk_data, pos)
            
            -- Should not include the island tile at (1,1)
            for _, n in ipairs(neighbors) do
                assert.is_false(n.x == 1 and n.y == 1)
            end
        end)
    end)
    
    describe("is_walkable", function()
        it("should return true for water", function()
            local chunk_data = mock_data.WATER_CHUNK
            assert.is_true(local_pathfinder.is_walkable(chunk_data, {x = 0, y = 0}))
        end)
        
        it("should return false for land", function()
            local chunk_data = mock_data.ISLAND_CHUNK
            assert.is_false(local_pathfinder.is_walkable(chunk_data, {x = 2, y = 2}))
        end)
        
        it("should return false for out of bounds", function()
            local chunk_data = mock_data.WATER_CHUNK
            assert.is_false(local_pathfinder.is_walkable(chunk_data, {x = -1, y = 0}))
            assert.is_false(local_pathfinder.is_walkable(chunk_data, {x = 6, y = 0}))
        end)
    end)
end) 