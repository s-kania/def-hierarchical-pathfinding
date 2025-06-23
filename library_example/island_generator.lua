-- Island Generator in Lua using Fengari
-- This module provides island generation functions for JavaScript

local js = require "js"

-- Island generation module
local IslandGenerator = {}

-- Configuration presets for different island types
IslandGenerator.presets = {
    oceanic = {
        landDensity = 0.25,      -- 25% szansy na ląd
        iterations = 3,          -- Mniej iteracji = więcej małych wysp
        neighborThreshold = 4,   -- Próg sąsiadów dla tworzenia lądu
        archipelagoMode = true,  -- Tryb archipelagu
        islandSize = "small"     -- Małe wyspy
    },
    continental = {
        landDensity = 0.55,      -- 55% szansy na ląd
        iterations = 5,          -- Więcej iteracji = większe masy lądu
        neighborThreshold = 3,   -- Niższy próg = łatwiejsze tworzenie lądu
        archipelagoMode = false, -- Duże kontynenty
        islandSize = "large"     -- Duże wyspy
    },
    archipelago = {
        landDensity = 0.35,      -- 35% szansy na ląd
        iterations = 4,          -- Średnie iteracje
        neighborThreshold = 4,   -- Standardowy próg
        archipelagoMode = true,  -- Tryb archipelagu
        islandSize = "medium"    -- Średnie wyspy
    },
    scattered = {
        landDensity = 0.15,      -- 15% szansy na ląd
        iterations = 2,          -- Mało iteracji = rozproszone wyspy
        neighborThreshold = 5,   -- Wysoki próg = trudniejsze tworzenie lądu
        archipelagoMode = true,  -- Rozproszone wyspy
        islandSize = "small"     -- Małe wyspy
    }
}

-- Simple test function to verify Lua-JS communication works
function IslandGenerator.testFunction(size)
    -- Convert JS argument to Lua number
    local luaSize = tonumber(size) or 3
    
    -- Create proper JavaScript Array
    local jsArray = js.new(js.global.Array)
    for i = 0, (luaSize * luaSize) - 1 do
        local value = i % 2  -- Simple pattern: 0,1,0,1...
        jsArray:push(value)
    end
    
    return jsArray
end

-- Generate tiles for a single chunk using cellular automata with parameters
function IslandGenerator.generateChunkTiles(chunkSize)
    local size = tonumber(chunkSize) or 6
    local config = IslandGenerator.presets.archipelago -- Default preset
    
    return IslandGenerator.generateChunkTilesWithConfig(size, config)
end

-- Generate tiles with custom configuration
function IslandGenerator.generateChunkTilesWithConfig(chunkSize, config)
    local size = tonumber(chunkSize) or 6
    local tiles = {}
    
    -- Debug: ensure we have a valid size
    if size <= 0 or size > 20 then
        return nil
    end
    
    -- Use config or defaults
    local landDensity = config.landDensity or 0.45
    local iterations = config.iterations or 4
    local archipelagoMode = config.archipelagoMode or false
    
    -- Initial random generation based on landDensity
    for i = 1, size * size do
        local randomValue = math.random()
        tiles[i] = randomValue < landDensity and 1 or 0
    end
    
    -- Apply archipelago clustering if enabled
    if archipelagoMode then
        tiles = IslandGenerator.applyArchipelagoPattern(tiles, size)
    end
    
    -- Debug: check if tiles were created
    if #tiles == 0 then
        return nil
    end
    
    -- Apply cellular automata for specified iterations
    for iteration = 1, iterations do
        tiles = IslandGenerator.applyCellularAutomataWithConfig(tiles, size, config)
        if not tiles then
            return nil
        end
    end
    
    -- Apply island size modifications
    if config.islandSize == "large" then
        tiles = IslandGenerator.expandIslands(tiles, size)
    elseif config.islandSize == "small" then
        tiles = IslandGenerator.shrinkIslands(tiles, size)
    end
    
    return tiles
end

-- Apply archipelago pattern by creating clusters of islands
function IslandGenerator.applyArchipelagoPattern(tiles, size)
    local newTiles = {}
    
    -- Create 2-3 cluster centers
    local clusterCount = math.random(2, 3)
    local clusters = {}
    
    for i = 1, clusterCount do
        clusters[i] = {
            x = math.random(0, size - 1),
            y = math.random(0, size - 1),
            radius = math.random(2, math.floor(size / 2))
        }
    end
    
    -- Apply cluster influence
    for y = 0, size - 1 do
        for x = 0, size - 1 do
            local index = y * size + x + 1
            local baseValue = tiles[index]
            local clusterInfluence = 0
            
            -- Check distance to clusters
            for _, cluster in ipairs(clusters) do
                local distance = math.sqrt((x - cluster.x)^2 + (y - cluster.y)^2)
                if distance <= cluster.radius then
                    clusterInfluence = clusterInfluence + (1 - distance / cluster.radius) * 0.4
                end
            end
            
            -- Apply cluster influence
            local finalChance = (baseValue == 1 and 0.8 or 0.2) + clusterInfluence
            newTiles[index] = math.random() < finalChance and 1 or 0
        end
    end
    
    return newTiles
end

-- Apply cellular automata rules with configuration
function IslandGenerator.applyCellularAutomataWithConfig(tiles, size, config)
    if not tiles or size <= 0 then
        return nil
    end
    
    local neighborThreshold = config.neighborThreshold or 4
    local newTiles = {}
    
    for y = 0, size - 1 do
        for x = 0, size - 1 do
            local index = y * size + x + 1  -- Lua arrays are 1-indexed
            local neighbors = IslandGenerator.countNeighbors(tiles, x, y, size)
            
            if neighbors >= neighborThreshold then
                newTiles[index] = 1  -- Island
            elseif neighbors <= (neighborThreshold - 2) then
                newTiles[index] = 0  -- Ocean
            else
                newTiles[index] = tiles[index]  -- Keep current state
            end
        end
    end
    
    return newTiles
end

-- Apply cellular automata rules (original function for compatibility)
function IslandGenerator.applyCellularAutomata(tiles, size)
    local config = { neighborThreshold = 4 }
    return IslandGenerator.applyCellularAutomataWithConfig(tiles, size, config)
end

-- Expand islands for "large" island size
function IslandGenerator.expandIslands(tiles, size)
    local newTiles = {}
    
    for y = 0, size - 1 do
        for x = 0, size - 1 do
            local index = y * size + x + 1
            local neighbors = IslandGenerator.countNeighbors(tiles, x, y, size)
            
            -- Expand if there are nearby islands
            if tiles[index] == 1 or neighbors >= 2 then
                newTiles[index] = 1
            else
                newTiles[index] = 0
            end
        end
    end
    
    return newTiles
end

-- Shrink islands for "small" island size
function IslandGenerator.shrinkIslands(tiles, size)
    local newTiles = {}
    
    for y = 0, size - 1 do
        for x = 0, size - 1 do
            local index = y * size + x + 1
            local neighbors = IslandGenerator.countNeighbors(tiles, x, y, size)
            
            -- Only keep islands with strong neighbor support
            if tiles[index] == 1 and neighbors >= 3 then
                newTiles[index] = 1
            else
                newTiles[index] = 0
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
    
    return jsArray
end

-- Main function to generate chunk tiles with preset and return as JS array
function IslandGenerator.generateChunkTilesWithPreset(chunkSize, presetName)
    -- Convert JS arguments
    local size = tonumber(chunkSize) or 6
    local preset = tostring(presetName) or "archipelago"
    
    -- Get configuration
    local config = IslandGenerator.presets[preset] or IslandGenerator.presets.archipelago
    
    -- Use configured island generator
    local luaTiles = IslandGenerator.generateChunkTilesWithConfig(size, config)
    
    if luaTiles and #luaTiles > 0 then
        -- Convert Lua array to JavaScript array
        local jsArray = js.new(js.global.Array)
        for i = 1, #luaTiles do
            jsArray:push(luaTiles[i])
        end
        return jsArray
    else
        -- Fallback to simple pattern if generation fails
        return IslandGenerator.generateChunkTilesSimple(size)
    end
end

-- Advanced function with custom parameters
function IslandGenerator.generateChunkTilesAdvanced(chunkSize, landDensity, iterations, neighborThreshold, archipelagoMode, islandSize)
    -- Convert JS arguments
    local size = tonumber(chunkSize) or 6
    local config = {
        landDensity = tonumber(landDensity) or 0.35,
        iterations = tonumber(iterations) or 4,
        neighborThreshold = tonumber(neighborThreshold) or 4,
        archipelagoMode = archipelagoMode == true or archipelagoMode == "true",
        islandSize = tostring(islandSize) or "medium"
    }
    
    -- Use configured island generator
    local luaTiles = IslandGenerator.generateChunkTilesWithConfig(size, config)
    
    if luaTiles and #luaTiles > 0 then
        -- Convert Lua array to JavaScript array
        local jsArray = js.new(js.global.Array)
        for i = 1, #luaTiles do
            jsArray:push(luaTiles[i])
        end
        return jsArray
    else
        -- Fallback to simple pattern if generation fails
        return IslandGenerator.generateChunkTilesSimple(size)
    end
end

-- Main function to generate chunk tiles and return as JS array (compatibility)
function IslandGenerator.generateChunkTilesForJS(chunkSize)
    return IslandGenerator.generateChunkTilesWithPreset(chunkSize, "archipelago")
end

-- Initialize random seed
math.randomseed(js.global.Date.now())

-- Export functions directly to global scope for JavaScript access
js.global.LuaIslandGenerator = js.new(js.global.Object)
js.global.LuaIslandGenerator.testFunction = IslandGenerator.testFunction
js.global.LuaIslandGenerator.generateChunkTilesSimple = IslandGenerator.generateChunkTilesSimple
js.global.LuaIslandGenerator.generateChunkTilesForJS = IslandGenerator.generateChunkTilesForJS
js.global.LuaIslandGenerator.generateChunkTiles = IslandGenerator.generateChunkTiles
js.global.LuaIslandGenerator.generateChunkTilesWithPreset = IslandGenerator.generateChunkTilesWithPreset
js.global.LuaIslandGenerator.generateChunkTilesAdvanced = IslandGenerator.generateChunkTilesAdvanced
js.global.LuaIslandGenerator.applyCellularAutomata = IslandGenerator.applyCellularAutomata
js.global.LuaIslandGenerator.countNeighbors = IslandGenerator.countNeighbors
js.global.LuaIslandGenerator.presets = IslandGenerator.presets
js.global.LuaIslandGenerator.ready = true

print("✓ Lua Island Generator module loaded successfully with advanced parameters") 