# Programming Fundamentals

## Core Concepts

### Variables and Data Types
- Variables: Named storage for data
- Primitive types: integers, floats, booleans, characters, strings
- Complex types: arrays, objects, maps, sets
- Type systems: Static (compile-time) vs Dynamic (runtime)
- Type inference: Compiler determines types

### Control Flow
- Conditionals: if/else, switch/case
- Loops: for, while, do-while, foreach
- Break and continue: Loop control
- Early returns: Exit function early

### Functions
- Definition: Reusable blocks of code
- Parameters: Input values
- Return values: Output
- Scope: Variable visibility
- Pure functions: No side effects, same input = same output
- Higher-order functions: Functions that take/return functions

### Object-Oriented Programming (OOP)
- Classes: Blueprints for objects
- Objects: Instances of classes
- Encapsulation: Hide internal details
- Inheritance: Extend existing classes
- Polymorphism: Same interface, different implementations
- Abstraction: Simplify complex systems

### Functional Programming
- First-class functions: Functions as values
- Immutability: Data doesn't change
- Pure functions: No side effects
- Map, filter, reduce: Data transformations
- Composition: Combine functions

## Data Structures

### Arrays/Lists
- Ordered collection
- Index-based access O(1)
- Search O(n)
- Dynamic arrays grow automatically

### Linked Lists
- Nodes with data and pointers
- Efficient insertion/deletion O(1)
- No random access
- Singly or doubly linked

### Stacks
- Last In, First Out (LIFO)
- Push and pop operations
- Use cases: Undo, call stack, parsing

### Queues
- First In, First Out (FIFO)
- Enqueue and dequeue
- Use cases: Task scheduling, BFS

### Hash Tables/Maps
- Key-value pairs
- O(1) average lookup
- Collision handling
- Use cases: Caching, indexing

### Trees
- Hierarchical structure
- Binary trees: Max 2 children
- BST: Ordered for searching
- Balanced trees: AVL, Red-Black

### Graphs
- Nodes and edges
- Directed vs undirected
- Weighted vs unweighted
- Algorithms: BFS, DFS, Dijkstra

## Algorithms

### Sorting
- Bubble sort: O(n²), simple
- Selection sort: O(n²), simple
- Insertion sort: O(n²), good for small data
- Merge sort: O(n log n), stable
- Quick sort: O(n log n) average, fast
- Heap sort: O(n log n), in-place

### Searching
- Linear search: O(n)
- Binary search: O(log n), requires sorted data
- Hash table lookup: O(1) average

### Big O Notation
- O(1): Constant time
- O(log n): Logarithmic
- O(n): Linear
- O(n log n): Linearithmic
- O(n²): Quadratic
- O(2^n): Exponential

## Popular Languages

### JavaScript/TypeScript
- Web browsers and Node.js
- Dynamic typing (JS) or static (TS)
- Event-driven, asynchronous
- Frameworks: React, Vue, Angular, Node.js

### Python
- Readable, beginner-friendly
- Dynamic typing
- Great for data science, AI/ML
- Frameworks: Django, Flask, FastAPI

### Java
- Enterprise standard
- Static typing, OOP
- JVM-based, write once run anywhere
- Frameworks: Spring, Android

### C/C++
- System programming
- Memory management
- High performance
- Game engines, operating systems

### Go
- Simple, fast compilation
- Built-in concurrency
- Static typing
- Cloud infrastructure, CLI tools

### Rust
- Memory safety without GC
- Zero-cost abstractions
- Systems programming
- Growing ecosystem

## Development Practices

### Version Control (Git)
```
git init          # Initialize repo
git clone         # Clone repo
git add           # Stage changes
git commit        # Save changes
git push/pull     # Sync with remote
git branch        # Create branches
git merge         # Combine branches
git rebase        # Reapply commits
```

### Code Quality
- Meaningful names
- Single responsibility
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Comments for why, not what
- Consistent formatting

### Testing
- Unit tests: Individual functions
- Integration tests: Component interaction
- End-to-end tests: Full user flows
- TDD: Test-driven development
- Coverage: Percentage of code tested

### Design Patterns
- Singleton: One instance
- Factory: Object creation
- Observer: Event handling
- Strategy: Swappable algorithms
- Decorator: Add behavior dynamically
- MVC: Model-View-Controller

## APIs and Web Development

### REST APIs
- HTTP methods: GET, POST, PUT, DELETE
- Status codes: 200, 201, 400, 401, 404, 500
- JSON data format
- Stateless communication
- Resource-based URLs

### GraphQL
- Query language for APIs
- Request exactly what you need
- Single endpoint
- Strongly typed schema

### Authentication
- JWT (JSON Web Tokens)
- OAuth 2.0
- API keys
- Session-based auth

## Development Tools

### IDEs and Editors
- VS Code: Popular, extensible
- JetBrains: Language-specific IDEs
- Vim/Neovim: Terminal-based
- Sublime Text: Fast, lightweight

### Package Managers
- npm/yarn/pnpm: JavaScript
- pip: Python
- Maven/Gradle: Java
- Cargo: Rust
- Go modules: Go

### Build Tools
- Webpack, Vite: JS bundling
- Make: C/C++
- Gradle: Java
- Docker: Containerization
