-- Data structures for hierarchical pathfinding
-- Includes PriorityQueue (binary heap) and Path structures

local M = {}

-- Priority Queue implementation using binary min-heap
local PriorityQueue = {}
PriorityQueue.__index = PriorityQueue

-- Create new priority queue
-- @param comparator Optional custom comparator function(a, b) -> boolean
function PriorityQueue:new(comparator)
    local instance = {
        heap = {},
        _size = 0,
        comparator = comparator or function(a, b) return a.priority < b.priority end
    }
    setmetatable(instance, self)
    return instance
end

-- Push item into queue
-- @param item Item with priority field
function PriorityQueue:push(item)
    self._size = self._size + 1
    self.heap[self._size] = item
    self:_bubble_up(self._size)
end

-- Pop item with highest priority (lowest value)
-- @return Item or nil if empty
function PriorityQueue:pop()
    if self._size == 0 then
        return nil
    end
    
    local item = self.heap[1]
    self.heap[1] = self.heap[self._size]
    self.heap[self._size] = nil
    self._size = self._size - 1
    
    if self._size > 0 then
        self:_bubble_down(1)
    end
    
    return item
end

-- Peek at top item without removing
-- @return Item or nil if empty
function PriorityQueue:peek()
    return self.heap[1]
end

-- Check if queue is empty
-- @return boolean
function PriorityQueue:empty()
    return self._size == 0
end

-- Get current size
-- @return number
function PriorityQueue:size()
    return self._size
end

-- Check if queue contains item matching predicate
-- @param predicate Function(item) -> boolean
-- @return boolean
function PriorityQueue:contains(predicate)
    for i = 1, self._size do
        if predicate(self.heap[i]) then
            return true
        end
    end
    return false
end

-- Update priority of item matching predicate
-- @param predicate Function(item) -> boolean
-- @param new_priority New priority value
function PriorityQueue:update_priority(predicate, new_priority)
    for i = 1, self._size do
        if predicate(self.heap[i]) then
            local old_priority = self.heap[i].priority
            self.heap[i].priority = new_priority
            
            -- Re-heapify based on change direction
            if new_priority < old_priority then
                self:_bubble_up(i)
            else
                self:_bubble_down(i)
            end
            break
        end
    end
end

-- Clear all items
function PriorityQueue:clear()
    self.heap = {}
    self._size = 0
end

-- Internal: Bubble up element at index
function PriorityQueue:_bubble_up(index)
    while index > 1 do
        local parent_index = math.floor(index / 2)
        if self.comparator(self.heap[index], self.heap[parent_index]) then
            -- Swap with parent
            self.heap[index], self.heap[parent_index] = 
                self.heap[parent_index], self.heap[index]
            index = parent_index
        else
            break
        end
    end
end

-- Internal: Bubble down element at index
function PriorityQueue:_bubble_down(index)
    while true do
        local smallest = index
        local left = 2 * index
        local right = 2 * index + 1
        
        -- Find smallest among node and children
        if left <= self._size and 
           self.comparator(self.heap[left], self.heap[smallest]) then
            smallest = left
        end
        
        if right <= self._size and 
           self.comparator(self.heap[right], self.heap[smallest]) then
            smallest = right
        end
        
        if smallest ~= index then
            -- Swap with smallest child
            self.heap[index], self.heap[smallest] = 
                self.heap[smallest], self.heap[index]
            index = smallest
        else
            break
        end
    end
end

-- Path structure for storing pathfinding results
local Path = {}
Path.__index = Path

-- Create new path
function Path:new()
    local instance = {
        positions = {}
    }
    setmetatable(instance, self)
    return instance
end

-- Add position to path
-- @param pos Position {x, y}
function Path:add_position(pos)
    table.insert(self.positions, pos)
end

-- Get position at index
-- @param index 1-based index
-- @return Position or nil
function Path:get_position(index)
    return self.positions[index]
end

-- Get path length
-- @return Number of positions
function Path:length()
    return #self.positions
end

-- Check if path is empty
-- @return boolean
function Path:is_empty()
    return #self.positions == 0
end

-- Reverse path order
function Path:reverse()
    local reversed = {}
    for i = #self.positions, 1, -1 do
        table.insert(reversed, self.positions[i])
    end
    self.positions = reversed
end

-- Iterate over positions
-- @return Iterator function
function Path:iter()
    local index = 0
    return function()
        index = index + 1
        if index <= #self.positions then
            return index, self.positions[index]
        end
    end
end

-- Calculate total path distance (Manhattan)
-- @return Total distance
function Path:total_distance()
    local distance = 0
    for i = 2, #self.positions do
        local prev = self.positions[i-1]
        local curr = self.positions[i]
        distance = distance + math.abs(curr.x - prev.x) + math.abs(curr.y - prev.y)
    end
    return distance
end

-- Export classes
M.PriorityQueue = PriorityQueue
M.Path = Path

return M 