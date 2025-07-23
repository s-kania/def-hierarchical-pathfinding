-- Hierarchical Pathfinding Library - Simplified Architecture
-- Main entry point with all exports for Defold/Lua

local M = {}

-- Main pathfinding classes
M.HierarchicalPathfinder = require("def_hierarchical_pathfinding.src.hierarchical_pathfinder")

-- Builders
M.PathSegmentBuilder = require("def_hierarchical_pathfinding.src.path_segment_builder")

-- Utils
M.CoordUtils = require("def_hierarchical_pathfinding.src.coord_utils")

return M 