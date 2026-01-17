# Debugging Fundamentals

## Debugging Mindset

### Scientific Method for Debugging
1. Observe the bug (gather symptoms)
2. Form a hypothesis (what could cause it?)
3. Test the hypothesis (reproduce, add logging)
4. Analyze results
5. Repeat until solved

### Common Bug Categories
- Syntax errors: Typos, missing brackets
- Logic errors: Wrong algorithm or conditions
- Runtime errors: Crashes during execution
- Semantic errors: Code runs but wrong result
- Race conditions: Timing-dependent bugs
- Memory issues: Leaks, corruption, overflow

## Debugging Techniques

### Print/Console Debugging
- Simple and universal
- Add strategic log statements
- Log input, output, intermediate values
- Use descriptive messages
- Remove or disable in production

```javascript
console.log('Function called with:', input);
console.log('State before:', state);
// ... operation
console.log('State after:', state);
```

### Rubber Duck Debugging
- Explain code line by line
- To a rubber duck, colleague, or yourself
- Forces you to think through logic
- Often reveals assumptions

### Binary Search Debugging
- Narrow down the problem area
- Comment out half the code
- If bug persists, it's in remaining half
- Repeat until isolated

### Debugging by Simplification
- Create minimal reproduction
- Remove unrelated code
- Isolate the failing component
- Test with simplest inputs

## Debugger Tools

### Browser DevTools
- Breakpoints: Pause execution
- Step through: Line by line execution
- Watch expressions: Monitor variables
- Call stack: Function call history
- Network tab: API requests
- Console: Interactive testing

### IDE Debuggers
- Visual Studio Code: Built-in debugger
- JetBrains IDEs: Powerful debugging
- Xcode: iOS/macOS debugging
- Android Studio: Android debugging

### Debugger Operations
- Step Over (F10): Execute line, skip into functions
- Step Into (F11): Enter function calls
- Step Out (Shift+F11): Exit current function
- Continue (F5): Run until next breakpoint
- Conditional breakpoints: Break when condition met

### Command-Line Debuggers
- GDB: C/C++ debugging
- LLDB: C/C++/Swift
- pdb: Python debugger
- node --inspect: Node.js debugging

## Error Handling

### Exception Types
- Syntax Error: Code won't parse
- Type Error: Wrong data type
- Reference Error: Undefined variable
- Range Error: Value out of bounds
- Network Error: Connection issues
- Timeout Error: Operation took too long

### Try-Catch Patterns
```javascript
try {
  // Risky operation
  await fetchData();
} catch (error) {
  // Handle error
  console.error('Failed:', error.message);
  // Log full error for debugging
  console.error(error);
} finally {
  // Always runs
  cleanup();
}
```

### Error Logging Best Practices
- Include timestamp
- Log error type and message
- Include stack trace
- Add context (user, request ID)
- Use log levels (error, warn, info, debug)

## Common Bug Patterns

### Off-by-One Errors
- Array index out of bounds
- Loop runs one too many/few times
- Fence post errors
- Solution: Check boundary conditions

### Null/Undefined Errors
- Accessing properties of null
- Missing null checks
- Optional chaining: `obj?.property`
- Nullish coalescing: `value ?? default`

### Async/Await Issues
- Missing await keyword
- Unhandled promise rejections
- Race conditions
- Callback hell
- Solution: Consistent async patterns

### State Management Bugs
- Stale state references
- Mutation of shared state
- Incorrect state updates
- Solution: Immutable patterns, proper state management

### Memory Leaks
- Unclosed connections
- Event listeners not removed
- Circular references
- Growing arrays/caches
- Solution: Proper cleanup, weak references

## Debugging Specific Environments

### Frontend Debugging
- React DevTools: Component inspection
- Vue DevTools: Vue-specific debugging
- Redux DevTools: State history
- Lighthouse: Performance debugging
- Source maps: Debug original code

### Backend Debugging
- Request/response logging
- Database query logging
- API testing (Postman, Insomnia)
- Environment variable checks
- Health check endpoints

### Database Debugging
- EXPLAIN queries: Understand execution plan
- Slow query logs
- Index analysis
- Connection pool monitoring
- Data integrity checks

### Network Debugging
- Browser Network tab
- curl/wget for testing
- Wireshark: Packet analysis
- Charles/Fiddler: HTTP proxy
- DNS lookup tools

## Testing as Debugging

### Unit Tests for Debugging
- Reproduce bug as failing test
- Test edge cases
- Regression tests prevent recurrence
- Test-driven debugging

### Integration Testing
- Test component interactions
- Mock external dependencies
- Test failure scenarios
- API contract testing

## Performance Debugging

### Profiling
- CPU profilers: Find slow functions
- Memory profilers: Find leaks
- Network profilers: Slow requests
- Flame graphs: Visualize call stacks

### Performance Metrics
- Response time
- Memory usage
- CPU utilization
- Network latency
- Database query time

### Common Performance Issues
- N+1 queries
- Missing indexes
- Unbounded data fetching
- Memory leaks
- Synchronous blocking operations

## Debugging Best Practices

### Prevention
- Code reviews catch bugs early
- Static analysis tools (ESLint, TypeScript)
- Consistent coding standards
- Good test coverage

### Documentation
- Document known issues
- Keep debugging notes
- Share solutions with team
- Post-mortems for major bugs

### Systematic Approach
1. Reproduce consistently
2. Isolate the problem
3. Identify root cause (not just symptoms)
4. Fix and verify
5. Add tests to prevent regression
6. Document the solution
