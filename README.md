<p align="center">
  <img src="logo/wiredi-banner-dark.svg" alt="WireDI" width="600">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@djodjonx/wiredi"><img src="https://img.shields.io/npm/v/@djodjonx/wiredi.svg?style=flat-square" alt="npm version"></a>
  <a href="https://djodjonx.github.io/wiredi/"><img src="https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=flat-square" alt="Documentation"></a>
  <a href="https://github.com/djodjonx/wiredi/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/djodjonx/wiredi/ci.yml?style=flat-square" alt="CI"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat-square" alt="TypeScript"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
</p>

<h1 align="center">Wire your dependency injection with type safety</h1>

<p align="center">
  <strong>WireDI</strong> is an abstraction layer on top of popular DI containers (tsyringe, Awilix, InversifyJS) that wires your dependencies with compile-time validation.
</p>

---

`@djodjonx/wiredi` allows you to:

- ✅ **Detect missing dependencies** before runtime
- ✅ **Verify type consistency** between interfaces and their implementations
- ✅ **Compose configurations** with a reusable partials system
- ✅ **Switch DI containers** without changing your business code

## 📚 Documentation

- **[Full API Documentation](https://djodjonx.github.io/wiredi/)** - Complete TypeDoc API reference
- **[Getting Started Guide](#quick-start)** - Start using WireDI in 5 minutes
- **[Examples](./examples)** - Real-world integration examples

## Why WireDI?

Dependency injection containers like tsyringe or InversifyJS are powerful, but they fail **at runtime** when a dependency is missing or misconfigured.

**With WireDI**, these errors are detected **in your IDE** before you even run the code:

```typescript
// ❌ Error detected in IDE: "Logger" is not registered
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: UserService }, // UserService depends on Logger
    ],
    listeners: [],
})
```

### Type Checking Without Decorators

Unlike traditional DI containers, **WireDI's type checking works without decorators**:

- ✅ Type validation at **configuration time**, not runtime
- ✅ Works with **plain TypeScript classes**
- ✅ No need for `@injectable` or `@inject` decorators
- ✅ Framework-agnostic type safety

**Learn more**: [Type Checking Without Decorators](docs/Agent/TYPE_CHECKING_WITHOUT_DECORATORS.md)

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
    listeners: [],
})

// Main configuration
export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial], // Inherits injections from partial
    injections: [
        { token: TOKENS.UserRepository, provider: UserRepository },
        { token: UserService }, // Class used as token
    ],
    listeners: [],
})
```

### 4. Use the builder

```typescript
// anywhere.ts
import useBuilder from '@djodjonx/wiredi'
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

| Error Type | Description |
|------------|-------------|
| 🔴 Missing dependency | A service requires an unregistered token |
| 🔴 Type mismatch | The provider doesn't implement the expected interface |
| 🔴 Unregistered @inject token | A decorator references a missing token |

### Error Example

```typescript
// ❌ ERROR: ConsoleLogger doesn't implement UserRepositoryInterface
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.UserRepository, provider: ConsoleLogger }, // Error here!
    ],
    listeners: [],
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
    listeners: [],
})

// partials/repositories.ts
export const repositoriesPartial = definePartialConfig({
    injections: [
        { token: TOKENS.UserRepository, provider: PostgresUserRepository },
        { token: TOKENS.ProductRepository, provider: PostgresProductRepository },
    ],
    listeners: [],
})

// config.ts
export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial, repositoriesPartial],
    injections: [
        { token: UserService },
        { token: ProductService },
    ],
    listeners: [],
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
    listeners: []
})

export const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial],
    injections: [
        // ❌ This will cause a TypeScript error - token already defined in partial
        { token: TOKENS.Logger, provider: FileLogger }
    ],
    listeners: []
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
    listeners: []
})
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

**Online**: [View API Documentation](https://[your-username].github.io/WireDI/) *(configure GitHub Pages)*

**Generate locally**:
```bash
pnpm docs
open docs/api/index.html
```

### Guides

- [Quick Start Guide](./README.md#quick-start) - Get started in 4 steps
- [Plugin Installation](./README.md#ide-plugin-for-real-time-validation) - IDE integration
- [Provider Examples](./examples/) - Integration with tsyringe, Awilix, InversifyJS
- [JSDoc Summary](docs/Agent/JSDOC_SUMMARY.md) - Documentation standards

## Troubleshooting

### The plugin doesn't detect errors

1. Verify that TypeScript uses the workspace version
2. Restart the TypeScript server (`Cmd+Shift+P` → "TypeScript: Restart TS Server")
3. Enable `verbose` mode to see logs

### Symbol tokens cause false positives

TypeScript sees all `Symbol()` as the same type. To avoid type collisions with partials, use classes as tokens or define your tokens without `as const`.

## License

MIT

