-- Island Generator in Lua using Fengari
-- This module provides island generation functions for JavaScript

print("Island Generator Lua module loaded!")
js = require "js"
-- Island generation module
local IslandGenerator = {}

-- Generate tiles for a single chunk using cellular automata
function IslandGenerator.generateChunkTiles(chunkSize)
    local size = chunkSize or 6
    local tiles = {}
    
    -- Initial random generation - 45% chance for island
    for i = 1, size * size do
        tiles[i] = math.random() < 0.45 and 1 or 0
    end
    
    -- Apply cellular automata for 4 iterations
    for iteration = 1, 4 do
        tiles = IslandGenerator.applyCellularAutomata(tiles, size)
    end
    
    return tiles
end

-- Apply cellular automata rules
function IslandGenerator.applyCellularAutomata(tiles, size)
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

-- Convert Lua array to JavaScript array (for easier interop)
function IslandGenerator.tilesToJSArray(tiles)
    local jsArray = js.new(js.global.Array)
    for i, tile in ipairs(tiles) do
        jsArray[i - 1] = tile  -- Convert to 0-based indexing for JS
    end
    return jsArray
end

-- Main function to generate chunk tiles and return as JS array
function IslandGenerator.generateChunkTilesForJS(chunkSize)
    local tiles = IslandGenerator.generateChunkTiles(chunkSize)
    return IslandGenerator.tilesToJSArray(tiles)
end

-- Initialize random seed
math.randomseed(js.global.Date.now())

-- Export to global scope for JavaScript access
js.global.LuaIslandGenerator = IslandGenerator

print("Island Generator functions exported to JavaScript as 'LuaIslandGenerator'")
print("Available functions:")
print("- LuaIslandGenerator.generateChunkTilesForJS(chunkSize)")
print("- LuaIslandGenerator.generateChunkTiles(chunkSize)")
print("- LuaIslandGenerator.applyCellularAutomata(tiles, size)")
print("- LuaIslandGenerator.countNeighbors(tiles, x, y, size)") 