describe("Data Structures", function()
    local data_structures = require "src.utils.data_structures"
    
    describe("PriorityQueue", function()
        local PriorityQueue
        
        before_each(function()
            PriorityQueue = data_structures.PriorityQueue
        end)
        
        describe("initialization", function()
            it("should create empty queue", function()
                local pq = PriorityQueue:new()
                assert.is_true(pq:empty())
                assert.are.equal(0, pq:size())
            end)
            
            it("should create queue with custom comparator", function()
                local pq = PriorityQueue:new(function(a, b) return a > b end)
                assert.is_not_nil(pq)
            end)
        end)
        
        describe("push and pop", function()
            it("should push and pop single element", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "A"})
                
                assert.is_false(pq:empty())
                assert.are.equal(1, pq:size())
                
                local item = pq:pop()
                assert.are.equal("A", item.value)
                assert.are.equal(5, item.priority)
                assert.is_true(pq:empty())
            end)
            
            it("should maintain min-heap property", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "B"})
                pq:push({priority = 3, value = "A"})
                pq:push({priority = 7, value = "C"})
                pq:push({priority = 1, value = "D"})
                
                assert.are.equal(4, pq:size())
                
                -- Should pop in order: D(1), A(3), B(5), C(7)
                local item1 = pq:pop()
                assert.are.equal("D", item1.value)
                assert.are.equal(1, item1.priority)
                
                local item2 = pq:pop()
                assert.are.equal("A", item2.value)
                assert.are.equal(3, item2.priority)
                
                local item3 = pq:pop()
                assert.are.equal("B", item3.value)
                assert.are.equal(5, item3.priority)
                
                local item4 = pq:pop()
                assert.are.equal("C", item4.value)
                assert.are.equal(7, item4.priority)
                
                assert.is_true(pq:empty())
            end)
            
            it("should handle equal priorities", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "A"})
                pq:push({priority = 5, value = "B"})
                pq:push({priority = 5, value = "C"})
                
                local values = {}
                while not pq:empty() do
                    table.insert(values, pq:pop().value)
                end
                
                -- All should have been popped
                assert.are.equal(3, #values)
            end)
        end)
        
        describe("peek", function()
            it("should peek without removing", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "B"})
                pq:push({priority = 3, value = "A"})
                
                local item = pq:peek()
                assert.are.equal("A", item.value)
                assert.are.equal(3, item.priority)
                assert.are.equal(2, pq:size())  -- Size unchanged
            end)
            
            it("should return nil when empty", function()
                local pq = PriorityQueue:new()
                assert.is_nil(pq:peek())
            end)
        end)
        
        describe("contains", function()
            it("should find existing element", function()
                local pq = PriorityQueue:new()
                local itemA = {priority = 5, value = "A", x = 1, y = 2}
                local itemB = {priority = 3, value = "B", x = 3, y = 4}
                
                pq:push(itemA)
                pq:push(itemB)
                
                assert.is_true(pq:contains(function(item) return item.x == 1 and item.y == 2 end))
                assert.is_true(pq:contains(function(item) return item.value == "B" end))
            end)
            
            it("should not find non-existing element", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "A"})
                
                assert.is_false(pq:contains(function(item) return item.value == "Z" end))
            end)
        end)
        
        describe("update priority", function()
            it("should update priority of existing element", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "A", id = 1})
                pq:push({priority = 3, value = "B", id = 2})
                pq:push({priority = 7, value = "C", id = 3})
                
                -- Update B's priority from 3 to 1 (should become top)
                pq:update_priority(
                    function(item) return item.id == 2 end,
                    1
                )
                
                local item = pq:pop()
                assert.are.equal("B", item.value)
                assert.are.equal(1, item.priority)
            end)
            
            it("should handle update to lower priority", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 1, value = "A", id = 1})
                pq:push({priority = 5, value = "B", id = 2})
                
                -- Update A's priority from 1 to 10 (should become last)
                pq:update_priority(
                    function(item) return item.id == 1 end,
                    10
                )
                
                local first = pq:pop()
                assert.are.equal("B", first.value)
                
                local second = pq:pop()
                assert.are.equal("A", second.value)
                assert.are.equal(10, second.priority)
            end)
        end)
        
        describe("clear", function()
            it("should clear all elements", function()
                local pq = PriorityQueue:new()
                pq:push({priority = 5, value = "A"})
                pq:push({priority = 3, value = "B"})
                
                pq:clear()
                assert.is_true(pq:empty())
                assert.are.equal(0, pq:size())
            end)
        end)
        
        describe("A* node usage", function()
            it("should work with A* nodes", function()
                local pq = PriorityQueue:new()
                
                -- Symulacja węzłów A*
                local node1 = {
                    pos = {x = 0, y = 0},
                    g_score = 0,
                    f_score = 10,
                    priority = 10
                }
                
                local node2 = {
                    pos = {x = 1, y = 0},
                    g_score = 1,
                    f_score = 8,
                    priority = 8
                }
                
                local node3 = {
                    pos = {x = 0, y = 1},
                    g_score = 1,
                    f_score = 9,
                    priority = 9
                }
                
                pq:push(node1)
                pq:push(node2)
                pq:push(node3)
                
                -- Should pop in order of f_score (priority)
                local first = pq:pop()
                assert.are.equal(8, first.f_score)
                
                local second = pq:pop()
                assert.are.equal(9, second.f_score)
                
                local third = pq:pop()
                assert.are.equal(10, third.f_score)
            end)
        end)
    end)
    
    describe("Path", function()
        local Path
        
        before_each(function()
            Path = data_structures.Path
        end)
        
        it("should create empty path", function()
            local path = Path:new()
            assert.are.equal(0, path:length())
            assert.is_true(path:is_empty())
        end)
        
        it("should add positions", function()
            local path = Path:new()
            path:add_position({x = 0, y = 0})
            path:add_position({x = 1, y = 0})
            path:add_position({x = 2, y = 0})
            
            assert.are.equal(3, path:length())
            assert.is_false(path:is_empty())
        end)
        
        it("should get positions", function()
            local path = Path:new()
            path:add_position({x = 0, y = 0})
            path:add_position({x = 1, y = 1})
            
            local pos1 = path:get_position(1)
            assert.are.same({x = 0, y = 0}, pos1)
            
            local pos2 = path:get_position(2)
            assert.are.same({x = 1, y = 1}, pos2)
        end)
        
        it("should reverse path", function()
            local path = Path:new()
            path:add_position({x = 0, y = 0})
            path:add_position({x = 1, y = 0})
            path:add_position({x = 2, y = 0})
            
            path:reverse()
            
            assert.are.same({x = 2, y = 0}, path:get_position(1))
            assert.are.same({x = 1, y = 0}, path:get_position(2))
            assert.are.same({x = 0, y = 0}, path:get_position(3))
        end)
        
        it("should iterate over positions", function()
            local path = Path:new()
            path:add_position({x = 0, y = 0})
            path:add_position({x = 1, y = 1})
            path:add_position({x = 2, y = 2})
            
            local count = 0
            for i, pos in path:iter() do
                count = count + 1
                assert.are.equal(i - 1, pos.x)
                assert.are.equal(i - 1, pos.y)
            end
            assert.are.equal(3, count)
        end)
        
        it("should calculate path length", function()
            local path = Path:new()
            path:add_position({x = 0, y = 0})
            path:add_position({x = 0, y = 1})
            path:add_position({x = 1, y = 1})
            path:add_position({x = 1, y = 2})
            
            -- Manhattan distance: 3 steps
            local distance = path:total_distance()
            assert.are.equal(3, distance)
        end)
    end)
end) 