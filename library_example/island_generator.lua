-- Island Generator in Lua using Fengari
-- This module provides island generation functions for JavaScript

local js = require "js"

-- Island generation module
local IslandGenerator = {}

-- Simple test function to verify Lua-JS communication works
function IslandGenerator.testFunction(size)
    -- Convert JS argument to Lua number
    local luaSize = tonumber(size) or 3
    print("testFunction called with size:", size, "converted to:", luaSize)
    
    -- Create proper JavaScript Array
    local jsArray = js.new(js.global.Array)
    for i = 0, (luaSize * luaSize) - 1 do
        local value = i % 2  -- Simple pattern: 0,1,0,1...
        jsArray:push(value)
    end
    
    print("testFunction returning array with length:", jsArray.length)
    return jsArray
end

-- Generate tiles for a single chunk using cellular automata
function IslandGenerator.generateChunkTiles(chunkSize)
    local size = chunkSize or 6
    local tiles = {}
    
    -- Debug: ensure we have a valid size
    if size <= 0 or size > 20 then
        print("Invalid chunk size:", size)
        return nil
    end
    
    -- Initial random generation - 45% chance for island
    for i = 1, size * size do
        local randomValue = math.random()
        tiles[i] = randomValue < 0.45 and 1 or 0
    end
    
    -- Debug: check if tiles were created
    if #tiles == 0 then
        print("No tiles generated!")
        return nil
    end
    
    -- Apply cellular automata for 4 iterations
    for iteration = 1, 4 do
        tiles = IslandGenerator.applyCellularAutomata(tiles, size)
        if not tiles then
            print("applyCellularAutomata returned nil at iteration", iteration)
            return nil
        end
    end
    
    return tiles
end

-- Apply cellular automata rules
function IslandGenerator.applyCellularAutomata(tiles, size)
    if not tiles or size <= 0 then
        print("Invalid parameters for applyCellularAutomata")
        return nil
    end
    
    local newTiles = {}
    
    for y = 0, size - 1 do
        for x = 0, size - 1 do
            local index = y * size + x + 1  -- Lua arrays are 1-indexed
            local neighbors = IslandGenerator.countNeighbors(tiles, x, y, size)
            
            if neighbors >= 4 then
                newTiles[index] = 1  -- Island
            elseif neighbors <= 3 then
                newTiles[index] = 0  -- Ocean
            else
                newTiles[index] = tiles[index]  -- Keep current state
            end
        end
    end
    
    return newTiles
end

-- Count neighbors for cellular automata
function IslandGenerator.countNeighbors(tiles, x, y, size)
    local count = 0
    
    for dy = -1, 1 do
        for dx = -1, 1 do
            if not (dx == 0 and dy == 0) then
                local nx = x + dx
                local ny = y + dy
                
                -- Treat out-of-bounds as ocean
                if nx >= 0 and nx < size and ny >= 0 and ny < size then
                    local index = ny * size + nx + 1  -- Lua arrays are 1-indexed
                    if tiles[index] == 1 then
                        count = count + 1
                    end
                end
            end
        end
    end
    
    return count
end

-- Simple version without math.random for testing
function IslandGenerator.generateChunkTilesSimple(chunkSize)
    -- Convert JS argument to Lua number
    local size = tonumber(chunkSize) or 6
    print("generateChunkTilesSimple called with chunkSize:", chunkSize, "converted to:", size)
    
    -- Create proper JavaScript Array
    local jsArray = js.new(js.global.Array)
    
    -- Create a simple pattern instead of random
    for i = 0, (size * size) - 1 do
        -- Create checkerboard pattern
        local row = math.floor(i / size)
        local col = i % size
        local value = (row + col) % 2
        jsArray:push(value)
    end
    
    print("generateChunkTilesSimple returning array with length:", jsArray.length)
    return jsArray
end

-- Main function to generate chunk tiles and return as JS array
function IslandGenerator.generateChunkTilesForJS(chunkSize)
    -- Convert JS argument to Lua number
    local size = tonumber(chunkSize) or 6
    print("generateChunkTilesForJS called with chunkSize:", chunkSize, "converted to:", size)
    
    -- Use simple version that creates proper JS array
    local result = IslandGenerator.generateChunkTilesSimple(size)
    
    print("generateChunkTilesForJS returning:", result)
    return result
end

-- Initialize random seed
math.randomseed(js.global.Date.now())

-- Export functions directly to global scope for JavaScript access
-- This approach ensures that functions are properly accessible from JS
js.global.LuaIslandGenerator = js.new(js.global.Object)
js.global.LuaIslandGenerator.testFunction = IslandGenerator.testFunction
js.global.LuaIslandGenerator.generateChunkTilesSimple = IslandGenerator.generateChunkTilesSimple
js.global.LuaIslandGenerator.generateChunkTilesForJS = IslandGenerator.generateChunkTilesForJS
js.global.LuaIslandGenerator.generateChunkTiles = IslandGenerator.generateChunkTiles
js.global.LuaIslandGenerator.applyCellularAutomata = IslandGenerator.applyCellularAutomata
js.global.LuaIslandGenerator.countNeighbors = IslandGenerator.countNeighbors
js.global.LuaIslandGenerator.ready = true

print("Island Generator Lua module loaded!")
print("Island Generator functions exported to JavaScript as 'LuaIslandGenerator'") 