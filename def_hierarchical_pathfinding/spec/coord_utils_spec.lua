-- Test suite dla modułu coord_utils
describe("Coordinate Utils", function()
    local coord_utils = require "src.utils.coord_utils"
    local mock_data = require "spec.mock_data"
    
    describe("chunk_id_to_coords", function()
        it("should parse simple chunk ID", function()
            local result = coord_utils.chunk_id_to_coords("2,3")
            assert.are.same({x = 2, y = 3}, result)
        end)
        
        it("should parse chunk ID with zeros", function()
            local result = coord_utils.chunk_id_to_coords("0,0")
            assert.are.same({x = 0, y = 0}, result)
        end)
        
        it("should parse negative chunk IDs", function()
            local result = coord_utils.chunk_id_to_coords("-1,2")
            assert.are.same({x = -1, y = 2}, result)
        end)
        
        it("should handle invalid format", function()
            assert.has_error(function()
                coord_utils.chunk_id_to_coords("invalid")
            end)
        end)
        
        it("should handle empty string", function()
            assert.has_error(function()
                coord_utils.chunk_id_to_coords("")
            end)
        end)
    end)
    
    describe("coords_to_chunk_id", function()
        it("should convert positive coords to chunk ID", function()
            local result = coord_utils.coords_to_chunk_id(2, 3)
            assert.are.equal("2,3", result)
        end)
        
        it("should convert zero coords to chunk ID", function()
            local result = coord_utils.coords_to_chunk_id(0, 0)
            assert.are.equal("0,0", result)
        end)
        
        it("should convert negative coords to chunk ID", function()
            local result = coord_utils.coords_to_chunk_id(-1, 2)
            assert.are.equal("-1,2", result)
        end)
        
        it("should handle nil coordinates", function()
            assert.has_error(function()
                coord_utils.coords_to_chunk_id(nil, 5)
            end)
        end)
    end)
    
    describe("global_to_chunk_id", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should convert global position to chunk 0,0", function()
            local pos = {x = 48, y = 48, z = 0}
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("0,0", result)
        end)
        
        it("should convert global position to chunk 1,0", function()
            local pos = {x = 96, y = 48, z = 0}  -- pierwszy kafelek chunka 1,0
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("1,0", result)
        end)
        
        it("should convert global position to chunk 2,3", function()
            local pos = {x = 192 + 48, y = 288 + 48, z = 0}  -- środek chunka 2,3
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("2,3", result)
        end)
        
        it("should handle edge case at chunk boundary", function()
            local pos = {x = 95, y = 95, z = 0}  -- ostatni piksel chunka 0,0
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("0,0", result)
        end)
        
        it("should handle positions at chunk origin", function()
            local pos = {x = 0, y = 0, z = 0}
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("0,0", result)
        end)
        
        it("should handle negative positions", function()
            local pos = {x = -16, y = -16, z = 0}
            local result = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
            assert.are.equal("-1,-1", result)
        end)
    end)
    
    describe("global_to_local", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should convert global to local in chunk 0,0", function()
            local global_pos = {x = 48, y = 48, z = 0}
            local result = coord_utils.global_to_local(global_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 3, y = 3}, result)  -- środek chunka
        end)
        
        it("should convert corner position", function()
            local global_pos = {x = 0, y = 0, z = 0}
            local result = coord_utils.global_to_local(global_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 0, y = 0}, result)
        end)
        
        it("should convert position in chunk 1,1", function()
            local global_pos = {x = 96 + 32, y = 96 + 32, z = 0}  -- (2,2) w chunku 1,1
            local result = coord_utils.global_to_local(global_pos, "1,1", chunk_size, tile_size)
            assert.are.same({x = 2, y = 2}, result)
        end)
        
        it("should handle edge positions correctly", function()
            local global_pos = {x = 95, y = 95, z = 0}  -- prawy dolny róg chunka 0,0
            local result = coord_utils.global_to_local(global_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 5, y = 5}, result)
        end)
        
        it("should throw error for position outside chunk", function()
            local global_pos = {x = 200, y = 200, z = 0}
            assert.has_error(function()
                coord_utils.global_to_local(global_pos, "0,0", chunk_size, tile_size)
            end)
        end)
    end)
    
    describe("local_to_global", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should convert local to global in chunk 0,0", function()
            local local_pos = {x = 3, y = 3}
            local result = coord_utils.local_to_global(local_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 48, y = 48, z = 0}, result)
        end)
        
        it("should convert corner position", function()
            local local_pos = {x = 0, y = 0}
            local result = coord_utils.local_to_global(local_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 0, y = 0, z = 0}, result)
        end)
        
        it("should convert position in chunk 2,1", function()
            local local_pos = {x = 2, y = 4}
            local result = coord_utils.local_to_global(local_pos, "2,1", chunk_size, tile_size)
            assert.are.same({x = 192 + 32, y = 96 + 64, z = 0}, result)
        end)
        
        it("should handle edge tile correctly", function()
            local local_pos = {x = 5, y = 5}
            local result = coord_utils.local_to_global(local_pos, "0,0", chunk_size, tile_size)
            assert.are.same({x = 80, y = 80, z = 0}, result)
        end)
        
        it("should throw error for invalid local position", function()
            local local_pos = {x = 6, y = 6}  -- poza zakresem 0-5
            assert.has_error(function()
                coord_utils.local_to_global(local_pos, "0,0", chunk_size, tile_size)
            end)
        end)
        
        it("should throw error for negative local position", function()
            local local_pos = {x = -1, y = 0}
            assert.has_error(function()
                coord_utils.local_to_global(local_pos, "0,0", chunk_size, tile_size)
            end)
        end)
    end)
    
    describe("tile_center_to_global", function()
        local chunk_size = 6
        local tile_size = 16
        
        it("should calculate center of tile in chunk 0,0", function()
            local result = coord_utils.tile_center_to_global(0, 0, "0,0", chunk_size, tile_size)
            assert.are.same({x = 8, y = 8, z = 0}, result)  -- środek pierwszego kafelka
        end)
        
        it("should calculate center of middle tile", function()
            local result = coord_utils.tile_center_to_global(3, 3, "0,0", chunk_size, tile_size)
            assert.are.same({x = 56, y = 56, z = 0}, result)
        end)
        
        it("should calculate center in different chunk", function()
            local result = coord_utils.tile_center_to_global(2, 2, "1,1", chunk_size, tile_size)
            assert.are.same({x = 96 + 40, y = 96 + 40, z = 0}, result)
        end)
        
        it("should handle edge tiles", function()
            local result = coord_utils.tile_center_to_global(5, 5, "0,0", chunk_size, tile_size)
            assert.are.same({x = 88, y = 88, z = 0}, result)
        end)
        
        it("should throw error for invalid tile coordinates", function()
            assert.has_error(function()
                coord_utils.tile_center_to_global(6, 0, "0,0", chunk_size, tile_size)
            end)
        end)
    end)
    
    describe("integration tests", function()
        it("should correctly convert back and forth", function()
            local chunk_size = 6
            local tile_size = 16
            local global_pos = {x = 128, y = 96, z = 0}
            
            -- Global -> chunk ID
            local chunk_id = coord_utils.global_to_chunk_id(global_pos, chunk_size, tile_size)
            
            -- Global -> local
            local local_pos = coord_utils.global_to_local(global_pos, chunk_id, chunk_size, tile_size)
            
            -- Local -> global
            local converted_back = coord_utils.local_to_global(local_pos, chunk_id, chunk_size, tile_size)
            
            -- Should be the same
            assert.are.same(global_pos, converted_back)
        end)
        
        it("should handle all test positions correctly", function()
            local chunk_size = 6
            local tile_size = 16
            
            for name, pos in pairs(mock_data.TEST_POSITIONS) do
                local chunk_id = coord_utils.global_to_chunk_id(pos, chunk_size, tile_size)
                assert.is_not_nil(chunk_id, "Failed for position: " .. name)
            end
        end)
    end)
end)

-- Test pomocniczy - przykład testowania z mockami
describe("Coordinate Utils with mocks", function()
    it("should call math functions correctly", function()
        -- Przykład użycia spy do śledzenia wywołań funkcji
        local math_floor_spy = spy.on(math, "floor")
        
        -- Tu byłoby wywołanie funkcji używającej math.floor
        -- np. coord_utils.global_to_chunk_id(...)
        
        -- Przywracamy oryginalną funkcję
        math_floor_spy:revert()
    end)
end) 