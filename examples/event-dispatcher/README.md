# Event Dispatcher Provider Examples

This directory contains example implementations of custom `EventDispatcherProvider` adapters for different event handling systems.

## Available Examples

| Provider | Use Case | Features |
|----------|----------|----------|
| [RxJsEventDispatcherProvider](./RxJsEventDispatcherProvider.ts) | Reactive programming | Observable streams, RxJS operators, reactive patterns |
| [EventEmitterDispatcherProvider](./EventEmitterDispatcherProvider.ts) | Node.js backend | Built-in EventEmitter, lightweight, async support |
| [AsyncPriorityEventDispatcherProvider](./AsyncPriorityEventDispatcherProvider.ts) | Complex workflows | Priority-based execution, queuing, error resilience |

## Quick Comparison

### RxJS Provider

**Best for**: Reactive applications, complex event streams, frontend with Angular/React

**Pros**:
- Powerful operators (debounce, filter, map, etc.)
- Observable streams for reactive programming
- Built-in backpressure handling
- Time-based operations

**Cons**:
- Requires RxJS dependency
- Learning curve for RxJS concepts
- Heavier bundle size

**Example**:
```typescript
const provider = new RxJsEventDispatcherProvider({
    containerProvider: getContainerProvider()
})

// Use RxJS operators
provider.getEventStream(SearchEvent)
    .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(event => performSearch(event.query))
    )
    .subscribe(results => updateUI(results))
```

### EventEmitter Provider

**Best for**: Node.js backend, simple event handling, microservices

**Pros**:
- No external dependencies (built-in Node.js)
- Lightweight and fast
- Familiar Node.js API
- Good for async operations

**Cons**:
- Node.js only (not browser)
- Limited operator support
- Manual error handling

**Example**:
```typescript
const provider = new EventEmitterDispatcherProvider({
    containerProvider: getContainerProvider(),
    maxListeners: 20
})

// Access underlying EventEmitter for advanced use
const emitter = provider.getUnderlyingDispatcher()
emitter.once('FirstUserEvent', handleFirstUser)
```

### Async Priority Provider

**Best for**: Complex workflows, payment processing, ordered operations

**Pros**:
- Priority-based execution order
- Event queuing for controlled flow
- Error resilience (continue on failure)
- Timeout protection
- Async/await support

**Cons**:
- More complex implementation
- Slower than simple dispatch
- Memory overhead for queue

**Example**:
```typescript
const provider = new AsyncPriorityEventDispatcherProvider({
    containerProvider: getContainerProvider(),
    enableQueue: true,
    continueOnError: true,
    listenerTimeout: 10000
})

// Register with priorities
provider.registerWithPriority(
    OrderPlacedEvent,
    PaymentProcessor,
    ListenerPriority.CRITICAL  // Runs first
)

provider.registerWithPriority(
    OrderPlacedEvent,
    EmailNotifier,
    ListenerPriority.LOW  // Runs last
)
```

## Installation

### For RxJS Provider

```bash
npm install rxjs
```

### For EventEmitter Provider

No installation needed (Node.js built-in)

### For Async Priority Provider

No external dependencies required

## Usage

### 1. Import the Provider

```typescript
import { RxJsEventDispatcherProvider } from './examples/event-dispatcher/RxJsEventDispatcherProvider'
import { useEventDispatcherProvider, getContainerProvider } from '@djodjonx/diligent'
```

### 2. Create and Register

```typescript
const eventProvider = new RxJsEventDispatcherProvider({
    containerProvider: getContainerProvider()
})

useEventDispatcherProvider(eventProvider)
```

### 3. Use in Your Application

```typescript
// Define events and listeners as usual
class UserCreatedEvent {
    constructor(public userId: string) {}
}

class SendWelcomeEmailListener {
    onEvent(event: UserCreatedEvent) {
        // Send email
    }
}

// Configure with diligent
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: SendWelcomeEmailListener }
    ],
    listeners: [
        { event: UserCreatedEvent, listener: SendWelcomeEmailListener }
    ]
})
```

## Creating Your Own Provider

Implement the `EventDispatcherProvider` interface:

```typescript
import type { EventDispatcherProvider } from '@djodjonx/diligent'

class MyCustomEventDispatcher implements EventDispatcherProvider {
    readonly name = 'my-custom-dispatcher'

    register(eventToken: EventToken, listenerToken: ListenerToken): void {
        // Register listener for event
    }

    dispatch(event: object): void {
        // Dispatch event to all registered listeners
    }

    hasListeners(eventToken: EventToken): boolean {
        // Check if event has listeners
    }

    clearListeners(eventToken: EventToken): void {
        // Remove listeners for specific event
    }

    clearAllListeners(): void {
        // Remove all listeners
    }

    getUnderlyingDispatcher(): unknown {
        // Return internal dispatcher for advanced use
    }
}
```

## Advanced Patterns

### Pattern 1: Hybrid Approach

Use different dispatchers for different event types:

```typescript
// Critical events with priority
const criticalDispatcher = new AsyncPriorityEventDispatcherProvider({
    containerProvider: getContainerProvider(),
    enableQueue: true
})

// Analytics with RxJS
const analyticsDispatcher = new RxJsEventDispatcherProvider({
    containerProvider: getContainerProvider()
})

// Route events based on type
class SmartEventDispatcher implements EventDispatcherProvider {
    readonly name = 'smart-dispatcher'

    dispatch(event: object): void {
        if (event instanceof CriticalEvent) {
            criticalDispatcher.dispatch(event)
        } else if (event instanceof AnalyticsEvent) {
            analyticsDispatcher.dispatch(event)
        }
    }

    // ... implement other methods
}
```

### Pattern 2: Event Middleware

Add logging, transformation, or filtering:

```typescript
class MiddlewareEventDispatcher implements EventDispatcherProvider {
    constructor(
        private inner: EventDispatcherProvider,
        private middleware: (event: object) => object | null
    ) {}

    dispatch(event: object): void {
        const transformed = this.middleware(event)
        if (transformed) {
            this.inner.dispatch(transformed)
        }
    }

    // Delegate other methods to inner dispatcher
}

// Usage
const provider = new MiddlewareEventDispatcher(
    new RxJsEventDispatcherProvider({ containerProvider }),
    (event) => {
        console.log('Event:', event)
        return event // or transform/filter
    }
)
```

### Pattern 3: Event Replay

Record and replay events (useful for testing):

```typescript
class ReplayableEventDispatcher implements EventDispatcherProvider {
    private eventLog: object[] = []

    dispatch(event: object): void {
        this.eventLog.push(event)
        this.inner.dispatch(event)
    }

    replay(): void {
        this.eventLog.forEach(event => this.inner.dispatch(event))
    }

    clearLog(): void {
        this.eventLog = []
    }
}
```

## Testing

All providers include example usage and test scenarios. Run with:

```bash
npx tsx examples/event-dispatcher/RxJsEventDispatcherProvider.ts
```

## Contributing

When creating a new provider example:

1. Implement `EventDispatcherProvider` interface
2. Add comprehensive JSDoc comments
3. Include usage examples
4. Document pros/cons
5. Add to this README

## Resources

- [EventDispatcherProvider Interface](../../src/EventDispatcher/Provider/types.ts)
- [MutableEventDispatcherProvider](../../src/EventDispatcher/Provider/MutableEventDispatcherProvider.ts) - Default implementation
- [RxJS Documentation](https://rxjs.dev/)
- [Node.js EventEmitter](https://nodejs.org/api/events.html)

