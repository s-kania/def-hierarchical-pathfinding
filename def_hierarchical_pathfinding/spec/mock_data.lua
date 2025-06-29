-- Mock data for hierarchical pathfinding tests
local M = {}

-- Podstawowe dane chunków (6x6)
-- 0 = woda (przechodne), 1 = ląd (nieprzechodne)

-- Chunk z samą wodą
M.WATER_CHUNK = {
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0}
}

-- Chunk z wyspą pośrodku
M.ISLAND_CHUNK = {
    {0, 0, 0, 0, 0, 0},
    {0, 1, 1, 1, 1, 0},
    {0, 1, 1, 1, 1, 0},
    {0, 1, 1, 1, 1, 0},
    {0, 1, 1, 1, 1, 0},
    {0, 0, 0, 0, 0, 0}
}

-- Chunk z przejściem przez środek
M.PASSAGE_CHUNK = {
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1},
    {1, 1, 0, 0, 1, 1}
}

-- Chunk z samym lądem
M.LAND_CHUNK = {
    {1, 1, 1, 1, 1, 1},
    {1, 1, 1, 1, 1, 1},
    {1, 1, 1, 1, 1, 1},
    {1, 1, 1, 1, 1, 1},
    {1, 1, 1, 1, 1, 1},
    {1, 1, 1, 1, 1, 1}
}

-- Chunk z labiryntem
M.MAZE_CHUNK = {
    {0, 1, 0, 0, 0, 0},
    {0, 1, 0, 1, 1, 0},
    {0, 1, 0, 0, 1, 0},
    {0, 1, 1, 0, 1, 0},
    {0, 0, 0, 0, 1, 0},
    {0, 0, 0, 0, 0, 0}
}

-- Przykładowe punkty przejścia
M.SIMPLE_TRANSITION_POINTS = {
    -- Połączenie między chunkami 0,0 i 1,0
    {
        id = "0,0-1,0-3",
        chunks = {"0,0", "1,0"},
        position = 3,  -- środek krawędzi
        connections = {}
    },
    -- Połączenie między chunkami 0,0 i 0,1
    {
        id = "0,0-0,1-3",
        chunks = {"0,0", "0,1"},
        position = 3,
        connections = {}
    },
    -- Połączenie między chunkami 1,0 i 1,1
    {
        id = "1,0-1,1-3",
        chunks = {"1,0", "1,1"},
        position = 3,
        connections = {}
    },
    -- Połączenie między chunkami 0,1 i 1,1
    {
        id = "0,1-1,1-3",
        chunks = {"0,1", "1,1"},
        position = 3,
        connections = {}
    }
}

-- Bardziej złożona sieć punktów przejścia
M.COMPLEX_TRANSITION_POINTS = {
    -- Chunk 0,0 -> 1,0 (dwa punkty)
    {
        id = "0,0-1,0-2",
        chunks = {"0,0", "1,0"},
        position = 2,
        connections = {
            {id = "0,0-0,1-2", weight = 5},
            {id = "1,0-1,1-2", weight = 5}
        }
    },
    {
        id = "0,0-1,0-4",
        chunks = {"0,0", "1,0"},
        position = 4,
        connections = {
            {id = "0,0-0,1-4", weight = 5},
            {id = "1,0-1,1-4", weight = 5}
        }
    },
    -- Chunk 0,0 -> 0,1 (dwa punkty)
    {
        id = "0,0-0,1-2",
        chunks = {"0,0", "0,1"},
        position = 2,
        connections = {
            {id = "0,0-1,0-2", weight = 5},
            {id = "0,1-1,1-2", weight = 5}
        }
    },
    {
        id = "0,0-0,1-4",
        chunks = {"0,0", "0,1"},
        position = 4,
        connections = {
            {id = "0,0-1,0-4", weight = 5},
            {id = "0,1-1,1-4", weight = 5}
        }
    },
    -- Chunk 1,0 -> 1,1
    {
        id = "1,0-1,1-2",
        chunks = {"1,0", "1,1"},
        position = 2,
        connections = {
            {id = "0,0-1,0-2", weight = 5},
            {id = "1,1-0,1-2", weight = 5}
        }
    },
    {
        id = "1,0-1,1-4",
        chunks = {"1,0", "1,1"},
        position = 4,
        connections = {
            {id = "0,0-1,0-4", weight = 5},
            {id = "1,1-0,1-4", weight = 5}
        }
    },
    -- Chunk 0,1 -> 1,1
    {
        id = "0,1-1,1-2",
        chunks = {"0,1", "1,1"},
        position = 2,
        connections = {
            {id = "0,0-0,1-2", weight = 5},
            {id = "1,0-1,1-2", weight = 5}
        }
    },
    {
        id = "0,1-1,1-4",
        chunks = {"0,1", "1,1"},
        position = 4,
        connections = {
            {id = "0,0-0,1-4", weight = 5},
            {id = "1,0-1,1-4", weight = 5}
        }
    }
}

-- Przykładowa mapa 2x2
M.SIMPLE_MAP = {
    chunks = {
        ["0,0"] = M.WATER_CHUNK,
        ["1,0"] = M.WATER_CHUNK,
        ["0,1"] = M.WATER_CHUNK,
        ["1,1"] = M.WATER_CHUNK
    },
    transition_points = M.SIMPLE_TRANSITION_POINTS,
    width = 2,
    height = 2
}

-- Mapa 3x3 z wyspami
M.ISLAND_MAP = {
    chunks = {
        ["0,0"] = M.WATER_CHUNK,
        ["1,0"] = M.ISLAND_CHUNK,
        ["2,0"] = M.WATER_CHUNK,
        ["0,1"] = M.ISLAND_CHUNK,
        ["1,1"] = M.LAND_CHUNK,  -- kompletnie zablokowany
        ["2,1"] = M.ISLAND_CHUNK,
        ["0,2"] = M.WATER_CHUNK,
        ["1,2"] = M.ISLAND_CHUNK,
        ["2,2"] = M.WATER_CHUNK
    },
    transition_points = {},  -- brak połączeń - rozłączone wyspy
    width = 3,
    height = 3
}

-- Mapa z korytarzami
M.CORRIDOR_MAP = {
    chunks = {
        ["0,0"] = M.PASSAGE_CHUNK,
        ["1,0"] = M.PASSAGE_CHUNK,
        ["2,0"] = M.PASSAGE_CHUNK,
        ["0,1"] = M.MAZE_CHUNK,
        ["1,1"] = M.WATER_CHUNK,
        ["2,1"] = M.MAZE_CHUNK,
        ["0,2"] = M.PASSAGE_CHUNK,
        ["1,2"] = M.PASSAGE_CHUNK,
        ["2,2"] = M.PASSAGE_CHUNK
    },
    transition_points = M.COMPLEX_TRANSITION_POINTS,
    width = 3,
    height = 3
}

-- Nowa mapa testowa 3x3 z pełnymi połączeniami
M.TEST_MAP_3X3 = {
    chunks = {
        ["0,0"] = M.WATER_CHUNK,
        ["1,0"] = M.WATER_CHUNK,
        ["2,0"] = M.WATER_CHUNK,
        ["0,1"] = M.WATER_CHUNK,
        ["1,1"] = M.WATER_CHUNK,
        ["2,1"] = M.WATER_CHUNK,
        ["0,2"] = M.WATER_CHUNK,
        ["1,2"] = M.WATER_CHUNK,
        ["2,2"] = M.WATER_CHUNK
    },
    transition_points = {
        -- Połączenia poziome (lewo-prawo)
        -- Rząd 0
        {id = "0,0-1,0-3", chunks = {"0,0", "1,0"}, position = 3, connections = {}},
        {id = "1,0-2,0-3", chunks = {"1,0", "2,0"}, position = 3, connections = {}},
        -- Rząd 1
        {id = "0,1-1,1-3", chunks = {"0,1", "1,1"}, position = 3, connections = {}},
        {id = "1,1-2,1-3", chunks = {"1,1", "2,1"}, position = 3, connections = {}},
        -- Rząd 2
        {id = "0,2-1,2-3", chunks = {"0,2", "1,2"}, position = 3, connections = {}},
        {id = "1,2-2,2-3", chunks = {"1,2", "2,2"}, position = 3, connections = {}},
        
        -- Połączenia pionowe (góra-dół)
        -- Kolumna 0
        {id = "0,0-0,1-3", chunks = {"0,0", "0,1"}, position = 3, connections = {}},
        {id = "0,1-0,2-3", chunks = {"0,1", "0,2"}, position = 3, connections = {}},
        -- Kolumna 1
        {id = "1,0-1,1-3", chunks = {"1,0", "1,1"}, position = 3, connections = {}},
        {id = "1,1-1,2-3", chunks = {"1,1", "1,2"}, position = 3, connections = {}},
        -- Kolumna 2
        {id = "2,0-2,1-3", chunks = {"2,0", "2,1"}, position = 3, connections = {}},
                 {id = "2,1-2,2-3", chunks = {"2,1", "2,2"}, position = 3, connections = {}}
     },
     width = 3,
     height = 3
}

-- Funkcja pomocnicza do tworzenia konfiguracji
M.create_test_config = function(map, chunk_size, tile_size)
    chunk_size = chunk_size or 6
    tile_size = tile_size or 16
    
    return {
        chunk_size = chunk_size,
        tile_size = tile_size,
        map_width = map.width,
        map_height = map.height,
        transition_points = map.transition_points,
        get_chunk_data = function(chunk_id)
            return map.chunks[chunk_id]
        end
    }
end

-- Przykładowe pozycje testowe
M.TEST_POSITIONS = {
    -- Środek chunka 0,0
    center_0_0 = {x = 48, y = 48, z = 0},  -- (3,3) w lokalnych współrzędnych
    
    -- Róg chunka 0,0
    corner_0_0 = {x = 8, y = 8, z = 0},   -- Środek pierwszego kafelka
    
    -- Granica między chunkami 0,0 i 1,0
    edge_0_0_to_1_0 = {x = 88, y = 48, z = 0},  -- środek prawego brzegu chunka 0,0
    
    -- Środek chunka 1,1
    center_1_1 = {x = 144, y = 144, z = 0},
    
    -- Środek chunka 2,2 (prawy dolny róg mapy 3x3)
    center_2_2 = {x = 240, y = 240, z = 0},
    
    -- Pozycja na lądzie (nieprzechodna)
    on_land = {x = 24, y = 24, z = 0},  -- (1,1) w lokalnych - zwykle ląd w ISLAND_CHUNK
    
    -- Dodatkowe pozycje dla mapy 3x3
    top_left = {x = 8, y = 8, z = 0},      -- Chunk 0,0
    top_right = {x = 232, y = 8, z = 0},   -- Chunk 2,0
    bottom_left = {x = 8, y = 232, z = 0}, -- Chunk 0,2
    bottom_right = {x = 232, y = 232, z = 0}, -- Chunk 2,2
    
    -- Pozycje na granicach
    edge_center = {x = 144, y = 48, z = 0}  -- Środek górnej krawędzi chunka 1,0
}

-- Przykładowe ścieżki oczekiwane
M.EXPECTED_PATHS = {
    -- Prosta ścieżka w jednym chunku
    single_chunk = {
        {chunk = "0,0", position = {x = 80, y = 80, z = 0}}
    },
    
    -- Ścieżka przez 2 chunki
    two_chunks = {
        {chunk = "0,0", position = {x = 88, y = 56, z = 0}},   -- punkt przejścia (środek kafelka)
        {chunk = "1,0", position = {x = 128, y = 80, z = 0}}  -- cel
    },
    
    -- Ścieżka przez 3 chunki
    three_chunks = {
        {chunk = "0,0", position = {x = 88, y = 56, z = 0}},   -- przejście do 1,0
        {chunk = "1,0", position = {x = 152, y = 88, z = 0}},  -- przejście do 1,1
        {chunk = "1,1", position = {x = 160, y = 160, z = 0}}  -- cel
    }
}

-- Funkcje pomocnicze do debugowania
M.print_chunk = function(chunk_data)
    print("Chunk data:")
    for y = 1, #chunk_data do
        local row = ""
        for x = 1, #chunk_data[y] do
            row = row .. chunk_data[y][x] .. " "
        end
        print(row)
    end
end

M.print_path = function(path_segments)
    print("Path segments:")
    for i, segment in ipairs(path_segments) do
        print(string.format("  %d: chunk=%s, pos=(%.1f, %.1f)", 
            i, segment.chunk, segment.position.x, segment.position.y))
    end
end

return M 