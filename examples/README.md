# WireDI - Examples

This directory contains comprehensive examples showing how to integrate different systems with `@djodjonx/wiredi`.

## 📁 Directory Structure

```
examples/
├── README.md                          # This file
├── di-containers/                     # DI Container integration examples
│   ├── README.md                      # DI containers guide
│   ├── tsconfig.json                  # TypeScript config
│   ├── with-tsyringe.ts              # tsyringe example
│   ├── with-awilix.ts                # Awilix example
│   └── with-inversify.ts             # InversifyJS example
└── event-dispatcher/                  # Event Dispatcher Provider examples
    ├── README.md                      # Event dispatchers guide
    ├── RxJsEventDispatcherProvider.ts
    ├── EventEmitterDispatcherProvider.ts
    └── AsyncPriorityEventDispatcherProvider.ts
```

## 🎯 Quick Links

| Category | Documentation | Examples |
|----------|--------------|----------|
| **DI Containers** | [Guide](./di-containers/README.md) | 3 providers (tsyringe, Awilix, InversifyJS) |
| **Event Dispatchers** | [Guide](./event-dispatcher/README.md) | 3 systems (RxJS, EventEmitter, Priority) |

## 🚀 Quick Start

### 1. DI Container Integration

Choose your preferred DI container and see how to integrate it:

```bash
# Navigate to DI examples
cd examples/di-containers

# Install dependencies (choose one)
pnpm add tsyringe reflect-metadata    # Option 1: tsyringe
pnpm add awilix                       # Option 2: Awilix
pnpm add inversify reflect-metadata   # Option 3: InversifyJS

# Run example
npx tsx with-tsyringe.ts
```

**Learn more**: [DI Containers Guide](./di-containers/README.md)

### 2. Event Dispatcher Implementation

See how to implement custom event dispatchers:

```bash
# Navigate to event-dispatcher examples
cd examples/event-dispatcher

# Install dependencies (if needed)
pnpm add rxjs                         # For RxJS example

# Examples are ready to use as templates
```

**Learn more**: [Event Dispatchers Guide](./event-dispatcher/README.md)

## 📚 Examples Overview

### DI Container Providers (Built-in)

These providers are **included in WireDI**:

| Provider | Package Required | Status | Complexity |
|----------|-----------------|--------|------------|
| [TsyringeProvider](./di-containers/with-tsyringe.ts) | `tsyringe` | ✅ Built-in | ⭐ Easy |
| [AwilixProvider](./di-containers/with-awilix.ts) | `awilix` | ✅ Built-in | ⭐⭐ Medium |
| [InversifyProvider](./di-containers/with-inversify.ts) | `inversify` | ✅ Built-in | ⭐⭐ Medium |

**Usage:**
```typescript
import { TsyringeProvider } from '@djodjonx/wiredi'
useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
```

### Event Dispatcher Providers (Examples)

These are **implementation examples** you can adapt:

| Provider | Dependencies | Use Case | Complexity |
|----------|-------------|----------|------------|
| [RxJsEventDispatcherProvider](./event-dispatcher/RxJsEventDispatcherProvider.ts) | `rxjs` | Reactive apps, complex streams | ⭐⭐⭐ Advanced |
| [EventEmitterDispatcherProvider](./event-dispatcher/EventEmitterDispatcherProvider.ts) | None (Node.js) | Backend services, simple events | ⭐ Easy |
| [AsyncPriorityEventDispatcherProvider](./event-dispatcher/AsyncPriorityEventDispatcherProvider.ts) | None | Ordered workflows, payments | ⭐⭐ Medium |

**Usage:**
```typescript
import { RxJsEventDispatcherProvider } from './examples/event-dispatcher/RxJsEventDispatcherProvider'
useEventDispatcherProvider(new RxJsEventDispatcherProvider({ containerProvider }))
```

## 🎓 Learning Path

### For Beginners

1. Start with [tsyringe example](./di-containers/with-tsyringe.ts) (simplest)
2. Understand the [builder pattern](./di-containers/README.md#configuration-with-WireDI)
3. Try [event dispatching](./event-dispatcher/EventEmitterDispatcherProvider.ts) (simple)

### For Intermediate Users

1. Compare [all DI containers](./di-containers/README.md#quick-comparison)
2. Learn [RxJS reactive patterns](./event-dispatcher/RxJsEventDispatcherProvider.ts)
3. Explore [priority-based events](./event-dispatcher/AsyncPriorityEventDispatcherProvider.ts)

### For Advanced Users

1. Study [advanced patterns](./event-dispatcher/README.md#advanced-patterns)
2. Create custom providers
3. Combine multiple dispatchers (hybrid approach)

## 🔧 TypeScript Configuration

Each example directory has its own `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "paths": {
      "@djodjonx/wiredi": ["../../src/index.ts"]
    }
  }
}
```

## 🧪 Running Examples

### From Project Root

```bash
# Run DI container examples
npx tsx examples/di-containers/with-tsyringe.ts
npx tsx examples/di-containers/with-awilix.ts
npx tsx examples/di-containers/with-inversify.ts

# Event dispatcher examples are templates (not runnable)
# Copy and adapt them in your project
```

### As Templates

All examples are designed to be:
- ✅ **Copy-pasteable** into your projects
- ✅ **Fully documented** with JSDoc
- ✅ **Type-safe** with TypeScript
- ✅ **Production-ready** with error handling

## 📖 Additional Resources

### Documentation

- [Main README](../../README.md) - Project overview
- [API Documentation](../../docs/api/) - Complete API reference
- [IDE Plugin Setup](../../docs/IDE_SETUP.md) - Real-time validation
- [Provider Documentation](../../docs/PROVIDER.md) - Provider architecture

### Guides

- [DI Container Integration](./di-containers/README.md)
- [Event Dispatcher Implementation](./event-dispatcher/README.md)
- [Best Practices](./di-containers/README.md#best-practices)
- [Troubleshooting](./di-containers/README.md#troubleshooting)

## 🤝 Contributing

To add a new example:

1. Choose the appropriate directory (`di-containers/` or `event-dispatcher/`)
2. Create your example file with comprehensive JSDoc
3. Add entry to the directory's README
4. Update this main examples README
5. Submit a pull request

### Example Template

```typescript
/**
 * Example: [Your Example Name]
 *
 * Description of what this example demonstrates.
 *
 * @see https://link-to-related-docs
 */

// Your implementation with detailed comments
```

## 📊 Examples Statistics

- **Total Examples**: 6
- **DI Container Examples**: 3
- **Event Dispatcher Examples**: 3
- **Lines of Code**: ~2000+
- **Documentation**: ~1500+ lines
- **Code Coverage**: 100% documented

## ⭐ Highlights

### DI Container Examples
- ✅ 3 major containers covered
- ✅ Built-in provider implementations
- ✅ Comparison tables included
- ✅ Best practices documented

### Event Dispatcher Examples
- ✅ 3 different approaches
- ✅ From simple to advanced
- ✅ Real-world use cases
- ✅ Advanced patterns included

---

**All examples are production-ready and fully type-safe!** ✅

## Built-in Providers

`@djodjonx/wiredi` includes providers for the most popular DI containers:

```typescript
import {
    TsyringeProvider,   // Built-in, recommended
    AwilixProvider,     // Requires 'awilix' package
    InversifyProvider,  // Requires 'inversify' package
} from '@djodjonx/wiredi'
```

### tsyringe (Recommended)

```typescript
import 'reflect-metadata'
import { container, Lifecycle } from 'tsyringe'
import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'

useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
```

### Awilix

```typescript
import * as awilix from 'awilix'
import { useContainerProvider, AwilixProvider } from '@djodjonx/wiredi'

// Use createSync for synchronous initialization
const provider = AwilixProvider.createSync(awilix, {
    injectionMode: 'PROXY', // or 'CLASSIC'
})
useContainerProvider(provider)
```

### InversifyJS

```typescript
import 'reflect-metadata'
import * as inversify from 'inversify'
import { useContainerProvider, InversifyProvider } from '@djodjonx/wiredi'

// Use createSync for synchronous initialization
const provider = InversifyProvider.createSync(inversify)
useContainerProvider(provider)
```

## Creating a Custom Provider

To integrate a new DI container, implement the `ContainerProvider` interface:

```typescript
import type { ContainerProvider, ProviderLifecycle } from '@djodjonx/wiredi'

class MyCustomProvider implements ContainerProvider {
    readonly name = 'my-custom-provider'

    registerValue<T>(token: symbol, value: T): void {
        // Register a constant value
    }

    registerFactory<T>(token: symbol, factory: (provider: ContainerProvider) => T): void {
        // Register a factory function
    }

    registerClass<T>(
        token: symbol | Constructor<T>,
        impl?: Constructor<T>,
        lifecycle?: ProviderLifecycle,
    ): void {
        // Register a class with optional lifecycle
    }

    isRegistered(token: symbol | Constructor): boolean {
        // Check if token is registered
    }

    resolve<T>(token: symbol | Constructor<T>): T {
        // Resolve a dependency
    }

    createScope(): ContainerProvider {
        // Create a scoped container (for request-scoped dependencies)
    }

    dispose(): void {
        // Cleanup resources
    }

    getUnderlyingContainer(): unknown {
        // Return the underlying DI container instance
    }
}
```

## Lifecycle Mapping

`@djodjonx/wiredi` uses `ProviderLifecycle` enum that should be mapped to your DI container's lifecycle:

| ProviderLifecycle | Description | tsyringe | Awilix | InversifyJS |
|-------------------|-------------|----------|--------|-------------|
| `Singleton` | One instance for the entire app | `Lifecycle.Singleton` | `Lifetime.SINGLETON` | `inSingletonScope()` |
| `Transient` | New instance on each resolve | `Lifecycle.Transient` | `Lifetime.TRANSIENT` | `inTransientScope()` |
| `Scoped` | One instance per scope/request | `Lifecycle.ContainerScoped` | `Lifetime.SCOPED` | `inRequestScope()` |

## Running Examples

```bash
# Install dependencies
pnpm install

# Run tsyringe example
npx tsx examples/with-tsyringe.ts

# Run awilix example
npx tsx examples/with-awilix.ts

# Run inversify example
npx tsx examples/with-inversify.ts
```

## Event Dispatcher Provider

All examples also show how to setup the `EventDispatcherProvider`:

```typescript
import {
    useContainerProvider,
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    getContainerProvider,
} from '@djodjonx/wiredi'

// 1. Setup DI container first
useContainerProvider(new MyProvider())

// 2. Setup event dispatcher (uses DI container to resolve listeners)
useEventDispatcherProvider(
    new MutableEventDispatcherProvider({
        containerProvider: getContainerProvider(),
    })
)
```

## Notes

- **tsyringe** is the default and recommended container (built-in `TsyringeProvider`)
- **Awilix** and **InversifyJS** providers are included but require their respective packages
- All providers support lazy initialization with `init()` or synchronous initialization with `createSync()`
- The `EventDispatcherProvider` is optional - if not configured, listeners are silently ignored

