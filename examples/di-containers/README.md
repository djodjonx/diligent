# DI Container Provider Examples

This directory contains examples showing how to integrate different DI containers with `@djodjonx/wiredi`.

## Available Examples

| Example | DI Container | Description | Dependencies |
|---------|--------------|-------------|--------------|
| [with-tsyringe.ts](./with-tsyringe.ts) | [tsyringe](https://github.com/microsoft/tsyringe) | Microsoft's lightweight DI container using decorators | `tsyringe`, `reflect-metadata` |
| [with-awilix.ts](./with-awilix.ts) | [Awilix](https://github.com/jeffijoe/awilix) | Powerful DI with proxy-based injection | `awilix` |
| [with-inversify.ts](./with-inversify.ts) | [InversifyJS](https://github.com/inversify/InversifyJS) | Feature-rich IoC container | `inversify`, `reflect-metadata` |
| [without-decorators.ts](./without-decorators.ts) | None (framework-agnostic) | Type checking without any decorators | None |

## Type Checking Without Decorators

**Important**: `@djodjonx/wiredi` provides full type safety **without requiring decorators**.

Type checking happens at the **configuration level**, not at the decorator level. This means:

- ✅ Works with plain classes (no decorators)
- ✅ Works with Awilix (no decorators needed)
- ✅ Works with any DI container or no container at all
- ✅ Interface compliance validated by TypeScript
- ✅ Token mismatches caught at compile-time

**See**: [without-decorators.ts](./without-decorators.ts) for a complete example and [Type Checking Documentation](../../docs/TYPE_CHECKING_WITHOUT_DECORATORS.md) for detailed explanation.

## Quick Comparison

| Feature | tsyringe | Awilix | InversifyJS |
|---------|----------|--------|-------------|
| Learning Curve | Low | Medium | Medium |
| Bundle Size | Small | Medium | Medium |
| Decorators | Required | Optional | Required |
| Browser Support | ✅ | ✅ | ✅ |
| Node.js Support | ✅ | ✅ | ✅ |
| Injection Mode | Constructor | PROXY/CLASSIC | Constructor |
| Reflection | Yes (reflect-metadata) | No | Yes (reflect-metadata) |

## Installation

### Option 1: tsyringe (Recommended)

```bash
npm install tsyringe reflect-metadata

# or
pnpm add tsyringe reflect-metadata
```

### Option 2: Awilix

```bash
npm install awilix

# or
pnpm add awilix
```

### Option 3: InversifyJS

```bash
npm install inversify reflect-metadata

# or
pnpm add inversify reflect-metadata
```

## Usage Patterns

### tsyringe Example

```typescript
import 'reflect-metadata'
import { container, Lifecycle } from 'tsyringe'
import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'

// Setup provider
useContainerProvider(new TsyringeProvider({ container, Lifecycle }))

// Define services with decorators
@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface
    ) {}
}

// Use builder
const { resolve } = useBuilder(appConfig)
const userService = resolve(UserService)
```

### Awilix Example

```typescript
import * as awilix from 'awilix'
import { useContainerProvider, AwilixProvider } from '@djodjonx/wiredi'

// Setup provider with PROXY mode
useContainerProvider(AwilixProvider.createSync(awilix, {
    injectionMode: 'PROXY'
}))

// Define services (constructor params match token names)
class UserService {
    constructor({ Logger, UserRepository }) {
        this.logger = Logger
        this.userRepository = UserRepository
    }
}

// Use builder
const { resolve } = useBuilder(appConfig)
const userService = resolve(UserService)
```

### InversifyJS Example

```typescript
import 'reflect-metadata'
import * as inversify from 'inversify'
import { useContainerProvider, InversifyProvider } from '@djodjonx/wiredi'

// Setup provider
useContainerProvider(InversifyProvider.createSync(inversify))

// Define services with decorators
@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface
    ) {}
}

// Use builder with symbol tokens
const { resolve } = useBuilder(appConfig)
const userService = resolve(TOKENS.UserService)
```

## Running Examples

```bash
# From the examples/di-containers directory
cd examples/di-containers

# Install dependencies for the example you want to run
pnpm add tsyringe reflect-metadata
# or
pnpm add awilix
# or
pnpm add inversify reflect-metadata

# Run an example
npx tsx with-tsyringe.ts
npx tsx with-awilix.ts
npx tsx with-inversify.ts
```

## Built-in Providers

All three providers are built into `@djodjonx/wiredi`:

```typescript
import {
    TsyringeProvider,   // ✅ Built-in, recommended
    AwilixProvider,     // ✅ Built-in, requires 'awilix'
    InversifyProvider,  // ✅ Built-in, requires 'inversify'
} from '@djodjonx/wiredi'
```

## Configuration with WireDI

All examples follow the same pattern:

1. **Setup Provider** (once at app startup)
2. **Define Services** (your business logic)
3. **Define Tokens** (for dependency injection)
4. **Create Configuration** (with defineBuilderConfig)
5. **Use Builder** (resolve dependencies)

## Type Safety

All providers support full TypeScript type checking:

- ✅ Type-safe dependency resolution
- ✅ Compile-time token validation (with plugin)
- ✅ Automatic type inference
- ✅ Interface/implementation consistency checks

## Choosing the Right Container

**Choose tsyringe when:**
- You want the simplest setup
- You prefer decorators
- You need good TypeScript support
- You want a small bundle size

**Choose Awilix when:**
- You want flexibility in injection modes
- You prefer constructor injection by name
- You don't want to use decorators everywhere
- You need powerful lifetime management

**Choose InversifyJS when:**
- You need advanced DI features
- You want fine-grained control
- You have complex binding scenarios
- You need middleware/interceptors

## Best Practices

### 1. Use Symbol Tokens for Interfaces

```typescript
const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepository: Symbol('UserRepository'),
}
```

### 2. Define Partials for Reusability

```typescript
const loggingPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }
    ],
    // listeners is optional
})
```

### 3. Use Lifecycle Management

```typescript
import { ProviderLifecycle } from '@djodjonx/wiredi'

{
    token: TOKENS.HttpClient,
    provider: HttpClient,
    lifecycle: ProviderLifecycle.Singleton
}
```

### 4. Leverage IDE Plugin

Install the TypeScript plugin for real-time validation:

```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "@djodjonx/wiredi/plugin" }
    ]
  }
}
```

## Troubleshooting

### tsyringe: "Reflect.metadata is not a function"

Add `import 'reflect-metadata'` at the top of your entry file.

### Awilix: "Cannot resolve dependency"

Check that constructor parameter names match registered token names (PROXY mode).

### InversifyJS: "Missing @injectable annotation"

Add `@injectable()` decorator to all classes registered in the container.

## Next Steps

- Check the [main examples README](../README.md) for more examples
- See [event-dispatcher examples](../event-dispatcher/) for event handling
- Read the [API documentation](../../docs/api/) for detailed reference

## Contributing

To add a new DI container example:

1. Create `with-[container-name].ts`
2. Implement the example following the pattern
3. Add entry to this README
4. Submit a pull request

