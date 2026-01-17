<p align="center">
  <img src="https://raw.githubusercontent.com/djodjonx/wireDI/main/logo/logo.png" alt="WireDI" width="600">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@djodjonx/wiredi"><img src="https://img.shields.io/npm/v/@djodjonx/wiredi.svg?style=flat-square" alt="npm version"></a>
  <a href="https://djodjonx.github.io/wireDI/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=flat-square" alt="Documentation"></a>
  <a href="https://github.com/djodjonx/wireDI/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/djodjonx/wireDI/ci.yml?style=flat-square" alt="CI"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square" alt="TypeScript"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
</p>

<h1 align="center">Wire your dependency injection with type safety</h1>

<p align="center">
  <strong>WireDI</strong> is a declarative, type-safe Dependency Injection builder. It eliminates "autowire" magic in favor of explicit, compile-time validated definitions, ensuring your application is free from missing dependencies and type mismatches.
</p>

---

`@djodjonx/wiredi` allows you to:

- ✅ **Detect missing dependencies** before runtime
- ✅ **Verify type consistency** between interfaces and their implementations
- ✅ **Compose configurations** with a reusable partials system
- ✅ **Switch DI containers** without changing your business code

## 📚 Documentation

- **[Full API Documentation](https://djodjonx.github.io/wireDI/)** - Complete TypeDoc API reference
- **[Getting Started Guide](#quick-start)** - Start using WireDI in 5 minutes
- **[Examples](./examples)** - Real-world integration examples

## Why WireDI?

Traditional DI containers (like tsyringe, InversifyJS) are powerful but often rely on runtime "magic" (autowiring) that can lead to:
- 💥 **Runtime errors** when dependencies are missing.
- 🐛 **Silent failures** when incorrect types are injected.

**WireDI** solves this by shifting validation to **compile-time**:

### 1. Declarative & Explicit
WireDI ignores autowiring in favor of **explicit declarations**. You define exactly what is injected. This ensures you never have a "missing dependency" error in production and your dependency graph is transparent.

### 2. Smart & Safe Registration
- **Singleton by Default**: All dependencies are registered as singletons, ensuring state consistency across your application.
- **Idempotent Builder**: The `useBuilder` system prevents double registration. If multiple builders try to register the same token in the same container, WireDI respects the existing one. This allows you to safely compose overlapping modules without conflicts.

### 3. Modular "Extend" Pattern
Build your app like Lego. Create **partial configurations** for specific domains (e.g., Auth, Database, Logging) and **extend** them in your main application builder. This separation of concerns makes your config maintainable and testable.

### 4. Real-Time Validation
Errors are detected **in your IDE** instantly:

```typescript
// ❌ Error detected in IDE: "Logger" is not registered
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: UserService }, // UserService depends on Logger
    ],
    // listeners is optional
})
```

### Type Checking Without Decorators

Unlike traditional DI containers, **WireDI's type checking works without decorators**:

- ✅ Type validation at **configuration time**, not runtime
- ✅ Works with **plain TypeScript classes**
- ✅ No need for `@injectable` or `@inject` decorators
- ✅ Framework-agnostic type safety

**Learn more**: [Type Checking Without Decorators](docs/TYPE_CHECKING_WITHOUT_DECORATORS.md)

## Installation

```bash
# With npm
npm install @djodjonx/wiredi

# With pnpm
pnpm add @djodjonx/wiredi

# With yarn
yarn add @djodjonx/wiredi
```

### Install a DI Container

`@djodjonx/wiredi` supports multiple containers. Install the one of your choice:

```bash
# Option 1: tsyringe (recommended)
npm install tsyringe reflect-metadata

# Option 2: Awilix
npm install awilix

# Option 3: InversifyJS
npm install inversify reflect-metadata
```

## Quick Start

### 1. Configure the provider (once at startup)

<details>
<summary><strong>With tsyringe (recommended)</strong></summary>

```typescript
// main.ts
import 'reflect-metadata'
import { container, Lifecycle } from 'tsyringe'
import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'

useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
```

</details>

<details>
<summary><strong>With Awilix</strong></summary>

```typescript
// main.ts
import * as awilix from 'awilix'
import { useContainerProvider, AwilixProvider } from '@djodjonx/wiredi'

useContainerProvider(AwilixProvider.createSync(awilix, {
    injectionMode: 'PROXY', // or 'CLASSIC'
}))
```

</details>

<details>
<summary><strong>With InversifyJS</strong></summary>

```typescript
// main.ts
import 'reflect-metadata'
import * as inversify from 'inversify'
import { useContainerProvider, InversifyProvider } from '@djodjonx/wiredi'

useContainerProvider(InversifyProvider.createSync(inversify))
```

</details>

### 2. Define your services and tokens

```typescript
// services.ts
import { injectable, inject } from 'tsyringe' // or your container's decorators

// Interfaces
interface LoggerInterface {
    log(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<User | null>
}

// Implementations
@injectable()
class ConsoleLogger implements LoggerInterface {
    log(message: string) {
        console.log(`[LOG] ${message}`)
    }
}

@injectable()
class UserRepository implements UserRepositoryInterface {
    async findById(id: string) {
        // ... implementation
    }
}

@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface,
        @inject(TOKENS.UserRepository) private repo: UserRepositoryInterface,
    ) {}

    async getUser(id: string) {
        this.logger.log(`Fetching user ${id}`)
        return this.repo.findById(id)
    }
}

// Injection tokens
export const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepository: Symbol('UserRepository'),
} as const
```

### 3. Create the container configuration

```typescript
// config.ts
import { defineBuilderConfig, definePartialConfig } from '@djodjonx/wiredi'

// Reusable partial configuration
const loggingPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
    // listeners is optional - omit if you don't need event handling
})

// Main configuration
export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial], // Inherits injections from partial
    injections: [
        { token: TOKENS.UserRepository, provider: UserRepository },
        { token: UserService }, // Class used as token
    ],
    // listeners is optional - only add if you need event handling
})
```
```

### 4. Use the builder

```typescript
// anywhere.ts
import { useBuilder } from '@djodjonx/wiredi'
import { appConfig } from './config'

const { resolve } = useBuilder(appConfig)

// Resolve dependencies with automatic typing
const userService = resolve(UserService)
const logger = resolve(TOKENS.Logger)
```

## IDE Plugin for Real-Time Validation

The TypeScript Language Service plugin detects configuration errors **directly in your IDE**.

### Plugin Installation

1. **Add the plugin** to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@djodjonx/wiredi/plugin"
      }
    ]
  }
}
```

2. **Configure your IDE** to use the project's TypeScript version:

**VS Code:**
- `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "TypeScript: Select TypeScript Version"
- Choose **"Use Workspace Version"**

**IntelliJ IDEA / WebStorm:**
- **Settings** → **Languages & Frameworks** → **TypeScript**
- Ensure TypeScript points to `node_modules/typescript`
- Check **"Use TypeScript Language Service"**
- Restart the IDE

### Detected Errors

| Error Type | Description | Error Message |
|------------|-------------|---------------|
| 🔴 Missing dependency | A service requires an unregistered token | `[WireDI] Missing dependency: ...` |
| 🔴 Type mismatch | The provider doesn't implement the expected interface | `[WireDI] Type incompatible: ...` |
| 🔴 Token collision | Token already registered in a partial | `[WireDI] This token is already registered in a partial` |
| 🔴 Duplicate listener | Same (event, listener) pair registered twice | `[WireDI] Duplicate listener in the same configuration` |
| 🔴 Listener collision | Listener already registered in a partial | `[WireDI] This event listener is already registered in a partial` |

### Error Example

```typescript
// ❌ ERROR: ConsoleLogger doesn't implement UserRepositoryInterface
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.UserRepository, provider: ConsoleLogger }, // Error here!
    ],
    // listeners is optional
})
```

The error appears on the provider line, even if it's defined in a separate partial file.

### Plugin Options

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@djodjonx/wiredi/plugin",
        "verbose": true  // Enable debug logs
      }
    ]
  }
}
```

## Injection Types

### Class as token

```typescript
{ token: UserService }
```

### Symbol with provider

```typescript
{ token: TOKENS.Logger, provider: ConsoleLogger }
```

### With custom lifecycle

```typescript
import { ProviderLifecycle } from '@djodjonx/wiredi'

{ token: UserService, lifecycle: ProviderLifecycle.Transient }
```

| Lifecycle | Description |
|-----------|-------------|
| `Singleton` | Single instance (default) |
| `Transient` | New instance on each resolution |
| `Scoped` | One instance per scope/request |

### Value injection

```typescript
{ token: TOKENS.ApiUrl, value: (context) => 'https://api.example.com' }
```

### Factory

```typescript
{
    token: TOKENS.HttpClient,
    factory: (provider) => new HttpClient(provider.resolve(TOKENS.ApiUrl))
}
```

## Partials System

Partials allow you to **reuse configurations** across multiple builders:

```typescript
// partials/logging.ts
export const loggingPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})

// partials/repositories.ts
export const repositoriesPartial = definePartialConfig({
    injections: [
        { token: TOKENS.UserRepository, provider: PostgresUserRepository },
        { token: TOKENS.ProductRepository, provider: PostgresProductRepository },
    ],
})

// config.ts
export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial, repositoriesPartial],
    injections: [
        { token: UserService },
        { token: ProductService },
    ],
})
```

### Token Uniqueness

**Important**: Each token must be unique across all partials and the main configuration.

```typescript
// ❌ ERROR: Token collision
const loggingPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }
    ],
})

export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial],
    injections: [
        // ❌ This will cause a TypeScript error - token already defined in partial
        { token: TOKENS.Logger, provider: FileLogger }
    ],
})
```

**For testing**, create a separate configuration without the conflicting partial:

```typescript
// ✅ Correct approach for testing
export const testConfig = defineBuilderConfig({
    builderId: 'app.test',
    extends: [], // Don't extend the partial with production logger
    injections: [
        { token: TOKENS.Logger, provider: MockLogger }, // ✅ OK - no collision
        { token: UserService },
    ],
})
```

### Listener Uniqueness

Similar to tokens, **each (event, listener) pair must be unique** across all partials and the main configuration:

```typescript
// ❌ ERROR: Duplicate listener in the same configuration
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener },
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Duplicate!
    ],
})

// ❌ ERROR: Listener already in partial
const eventPartial = definePartialConfig({
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }
    ],
})

const config = defineBuilderConfig({
    builderId: 'app',
    extends: [eventPartial],
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Already in partial!
    ],
})

// ✅ OK: Different listener for the same event
const validConfig = defineBuilderConfig({
    builderId: 'app',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener },
        { event: UserCreatedEvent, listener: SmsNotificationListener }, // ✅ Different listener
    ],
})
```

## Event Programming

> **Note**: The `listeners` property is **optional**. If your application doesn't use events, you can omit it entirely from your configuration.

### Why Centralized Event Listeners?
In traditional event-driven architectures, event listeners are often scattered across the codebase (e.g., manual `dispatcher.on(...)` calls inside constructors or initialization scripts). This makes it hard to visualize the system's reactive flow.

WireDI treats event listeners as **part of your application's structural configuration**. By declaring them alongside your dependency injections, you achieve:
- **🔍 Visibility**: See exactly **who listens to what** in a single configuration file.
- **🧩 Decoupling**: Services don't need to know about the dispatcher; they just implement `onEvent`.
- **🛡️ Safety**: Compile-time validation ensures your listener is compatible with the event.

### Usage
WireDI allows you to bind events to listeners declaratively:

### 1. Enable Event Support
First, configure the `EventDispatcherProvider` at startup (after the container provider):

```typescript
import {
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    getContainerProvider
} from '@djodjonx/wiredi'

useEventDispatcherProvider(new MutableEventDispatcherProvider({
    containerProvider: getContainerProvider(),
}))
```

### 2. Define Events and Listeners
Events are simple classes. Listeners are services that implement an `onEvent` method.

```typescript
// events/UserCreatedEvent.ts
export class UserCreatedEvent {
    constructor(public readonly user: User) {}
}

// listeners/SendWelcomeEmail.ts
export class SendWelcomeEmail {
    constructor(private mailer: MailerService) {}

    onEvent(event: UserCreatedEvent) {
        this.mailer.send(event.user.email, 'Welcome!')
    }
}
```

### 3. Wire in Configuration
Bind them in your builder configuration using the `listeners` property:

```typescript
const appConfig = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: SendWelcomeEmail }, // Register the listener itself
        { token: MailerService },
    ],
    listeners: [
        // Bind event -> listener
        { event: UserCreatedEvent, listener: SendWelcomeEmail },
    ],
})
```

Now, when you dispatch an event:
```typescript
import { getEventDispatcherProvider } from '@djodjonx/wiredi'

getEventDispatcherProvider().dispatch(new UserCreatedEvent(newUser))
// -> SendWelcomeEmail.onEvent() is automatically called
```

## Creating a Custom Provider

To use an unsupported DI container, implement the `ContainerProvider` interface:

```typescript
import type { ContainerProvider, ProviderLifecycle } from '@djodjonx/wiredi'

class MyCustomProvider implements ContainerProvider {
    readonly name = 'my-provider'

    registerValue<T>(token: symbol, value: T): void { /* ... */ }
    registerFactory<T>(token: symbol, factory: (p: ContainerProvider) => T): void { /* ... */ }
    registerClass<T>(token: symbol | Constructor<T>, impl?: Constructor<T>, lifecycle?: ProviderLifecycle): void { /* ... */ }
    isRegistered(token: symbol | Constructor): boolean { /* ... */ }
    resolve<T>(token: symbol | Constructor<T>): T { /* ... */ }
    createScope(): ContainerProvider { /* ... */ }
    dispose(): void { /* ... */ }
    getUnderlyingContainer(): unknown { /* ... */ }
}
```

## Full Examples

Check the [`examples/`](./examples) folder for comprehensive examples:

### DI Container Integration
- [tsyringe](./examples/di-containers/with-tsyringe.ts) - Microsoft's lightweight DI container
- [Awilix](./examples/di-containers/with-awilix.ts) - Powerful proxy-based injection
- [InversifyJS](./examples/di-containers/with-inversify.ts) - Feature-rich IoC container

### Event Dispatcher Implementations
- [RxJS Provider](./examples/event-dispatcher/RxJsEventDispatcherProvider.ts) - Reactive programming
- [EventEmitter Provider](./examples/event-dispatcher/EventEmitterDispatcherProvider.ts) - Node.js built-in
- [Priority Provider](./examples/event-dispatcher/AsyncPriorityEventDispatcherProvider.ts) - Ordered workflows

**See**: [Examples Guide](./examples/README.md) for detailed documentation and learning path.

## API Reference

### Provider Management

```typescript
useContainerProvider(provider: ContainerProvider): void  // Configure the global provider
getContainerProvider(): ContainerProvider                // Get the provider
hasContainerProvider(): boolean                          // Check if a provider is configured
resetContainerProvider(): void                           // Reset (for tests)
```

### Event Dispatcher (optional)

```typescript
import {
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    getEventDispatcherProvider
} from '@djodjonx/wiredi'

// Configuration
useEventDispatcherProvider(new MutableEventDispatcherProvider({
    containerProvider: getContainerProvider(),
}))

// Dispatch events
getEventDispatcherProvider().dispatch(new UserCreatedEvent(user))
```

## Documentation

### API Documentation

Full API documentation is available online and can be generated locally:

**Online**: [View API Documentation](https://djodjonx.github.io/wireDI/) *(GitHub Pages)*

**Generate locally**:
```bash
pnpm docs
open docs/api/index.html
```

### Guides

- [Quick Start Guide](./README.md#quick-start) - Get started in 4 steps
- [Plugin Installation](./README.md#ide-plugin-for-real-time-validation) - IDE integration
- [Provider Examples](./examples/) - Integration with tsyringe, Awilix, InversifyJS

## Troubleshooting

### The plugin doesn't detect errors

1. Verify that TypeScript uses the workspace version
2. Restart the TypeScript server (`Cmd+Shift+P` → "TypeScript: Restart TS Server")
3. Enable `verbose` mode to see logs

### Symbol tokens cause false positives

TypeScript sees all `Symbol()` as the same type. To avoid type collisions with partials, use classes as tokens or define your tokens without `as const`.

## License

MIT

