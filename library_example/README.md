# Fengari Lua-JavaScript Integration Guide

A comprehensive guide for integrating Lua functions with JavaScript using the Fengari library.

## 🔧 Requirements

- **Fengari Web** - Library for running Lua in the browser
- **HTTP Server** - Files must be served via HTTP server (not file://)

## 🚀 Complete Integration Steps

### 1. **HTML Setup**

```html
<!-- Load Fengari library -->
<script src="fengari-web.js"></script>

<!-- Load Lua script with correct type -->
<script src="your-module.lua" type="application/lua"></script>

<!-- Load your JavaScript -->
<script src="your-app.js"></script>
```

⚠️ **Important:** Lua scripts must have `type="application/lua"`

### 2. **Lua Module Structure**

```lua
-- your-module.lua

-- 1. Import js library
local js = require "js"

-- 2. Create module table
local MyModule = {}

-- 3. Module functions with proper argument conversion
function MyModule.processData(jsArgument)
    -- ALWAYS convert JS arguments to Lua types
    local luaValue = tonumber(jsArgument) or 0
    
    -- Create real JavaScript arrays
    local jsArray = js.new(js.global.Array)
    
    for i = 0, luaValue - 1 do
        jsArray:push(i * 2)  -- Use push() method
    end
    
    return jsArray  -- Return real JS array
end

function MyModule.processString(jsString)
    local luaString = tostring(jsString) or ""
    return "Processed: " .. luaString
end

-- 4. Export to JavaScript global scope
js.global.MyModule = js.new(js.global.Object)
js.global.MyModule.processData = MyModule.processData
js.global.MyModule.processString = MyModule.processString
js.global.MyModule.ready = true  -- Ready flag

print("MyModule loaded and exported to JavaScript!")
```

### 3. **JavaScript Integration**

```javascript
// your-app.js

function useMyModule() {
    // Check if Lua module is ready
    if (window.MyModule && window.MyModule.ready) {
        try {
            const numericResult = window.MyModule.processData(5);
            const stringResult = window.MyModule.processString("Hello");
            
            // Validate results
            if (numericResult && Array.isArray(numericResult)) {
                console.log('✓ Lua function success:', numericResult);
                return numericResult;
            } else if (numericResult && numericResult.length) {
                // Convert array-like objects
                return Array.from(numericResult);
            }
        } catch (error) {
            console.error('Lua function failed:', error);
        }
    }
    
    // JavaScript fallback
    console.log('⚠️ Using JavaScript fallback');
    return [0, 2, 4, 6, 8];  // Example fallback
}

// Wait for loading before use
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        useMyModule();
    }, 100);  // Give Lua time to load
});
```

## ⚠️ Common Pitfalls and Solutions

### **Problem 1: JavaScript arguments are not Lua numbers**
```lua
-- ❌ ERROR: size is a JavaScript object
function badFunction(size)
    for i = 0, size - 1 do  -- ERROR!

-- ✅ CORRECT: Convert arguments
function goodFunction(size)
    local luaSize = tonumber(size) or 0
    for i = 0, luaSize - 1 do  -- OK!
```

### **Problem 2: Lua tables are not JavaScript arrays**
```lua
-- ❌ ERROR: Returns wrapped Lua object
function badFunction()
    local result = {}
    result[0] = 1
    return result  -- JavaScript gets wrapped object

-- ✅ CORRECT: Create real JS array
function goodFunction()
    local jsArray = js.new(js.global.Array)
    jsArray:push(1)
    return jsArray  -- JavaScript gets real array
```

### **Problem 3: Incorrect function export**
```lua
-- ❌ ERROR: Exporting entire table may not work
js.global.MyModule = MyModule

-- ✅ CORRECT: Export functions individually
js.global.MyModule = js.new(js.global.Object)
js.global.MyModule.myFunction = MyModule.myFunction
js.global.MyModule.ready = true
```

### **Problem 4: Type conversion issues**
```lua
-- Handle different JS types in Lua
function MyModule.flexibleFunction(jsValue)
    local numValue = tonumber(jsValue)
    local strValue = tostring(jsValue)
    local boolValue = jsValue and true or false
    
    -- Use appropriate type based on your needs
end
```

## 🔍 Debugging Techniques

### Lua Side (use `print()`)
```lua
function MyModule.debugFunction(arg)
    print("Function called with:", arg)
    print("Argument type:", type(arg))
    local converted = tonumber(arg)
    print("Converted to number:", converted)
    -- ... rest of function
end
```

### JavaScript Side (use `console.log()`)
```javascript
try {
    console.log('Calling Lua function with:', inputValue);
    console.log('Input type:', typeof inputValue);
    
    const result = window.MyModule.debugFunction(inputValue);
    
    console.log('Result type:', typeof result);
    console.log('Result length:', result?.length);
    console.log('Result content:', result);
    console.log('Is array:', Array.isArray(result));
} catch (error) {
    console.error('Lua error:', error.message);
    console.error('Error stack:', error.stack);
}
```

## 🚦 Development Setup

```bash
# Start HTTP server in your project directory
cd library_example && python3 -m http.server 8000

# Open in browser
# http://localhost:8000
```

## 📋 Data Type Conversion Reference

| JavaScript → Lua | Lua Function | Example |
|------------------|--------------|---------|
| Number | `tonumber(jsValue)` | `tonumber(5) → 5` |
| String | `tostring(jsValue)` | `tostring("hello") → "hello"` |
| Boolean | `jsValue and true or false` | `true and true or false → true` |
| Array | Manual iteration | See array examples below |

| Lua → JavaScript | Lua Code | Result |
|------------------|----------|--------|
| Array | `js.new(js.global.Array)` + `push()` | Real JS Array |
| Object | `js.new(js.global.Object)` + properties | Real JS Object |
| String | Direct return | JS String |
| Number | Direct return | JS Number |

## 🎯 Best Practices

1. **Always convert** JS arguments to Lua types: `tonumber()`, `tostring()`
2. **Use `js.new(js.global.Array)`** for creating JavaScript arrays
3. **Export functions individually** to JavaScript objects
4. **Add `ready` flag** so JavaScript can check if Lua is loaded
5. **Use `type="application/lua"`** in HTML script tags
6. **Implement fallbacks** in JavaScript for when Lua fails
7. **Serve via HTTP**, never use `file://` protocol
8. **Handle errors gracefully** with try-catch blocks
9. **Debug incrementally** with print/console.log statements
10. **Test type conversions** thoroughly

## 📝 Template Files

### Minimal Lua Module Template
```lua
local js = require "js"
local MyModule = {}

function MyModule.exampleFunction(jsArg)
    local luaArg = tonumber(jsArg) or 0
    local result = js.new(js.global.Array)
    result:push(luaArg * 2)
    return result
end

js.global.MyModule = js.new(js.global.Object)
js.global.MyModule.exampleFunction = MyModule.exampleFunction
js.global.MyModule.ready = true
```

### Minimal JavaScript Integration Template
```javascript
function useLuaModule(input) {
    if (window.MyModule && window.MyModule.ready) {
        try {
            const result = window.MyModule.exampleFunction(input);
            if (result && result.length) {
                return Array.from(result);
            }
        } catch (error) {
            console.error('Lua error:', error);
        }
    }
    
    // Fallback implementation
    return [input * 2];
}
```

Following these patterns will ensure reliable Lua-JavaScript integration with Fengari! 🎉 