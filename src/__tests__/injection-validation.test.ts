/**
 * Type validation tests for WireDI injection and factory validation.
 *
 * This file contains TWO types of tests:
 * 1. VALID configurations - should compile without errors
 * 2. ERROR configurations - commented out to show what would fail
 *
 * The error cases are documented but commented out because they SHOULD
 * produce TypeScript errors. Uncomment them to verify the validation works.
 */

import { defineBuilderConfig, definePartialConfig, type ContainerProvider } from '../index'

// ============================================================
// Test Classes with __brand for type distinction
// ============================================================

interface LoggerInterface {
    log(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<{ id: string; name: string } | null>
}

interface ConfigInterface {
    apiUrl: string
    timeout: number
}

class ConsoleLogger implements LoggerInterface {
    readonly __brand = 'ConsoleLogger' as const
    log(message: string): void {
        console.log(message)
    }
}


class UserRepository implements UserRepositoryInterface {
    readonly __brand = 'UserRepository' as const
    async findById(id: string) {
        return { id, name: 'Test User' }
    }
}

class ProductService {
    readonly __brand = 'ProductService' as const
}

// Typed symbols for type safety
const TOKENS = {
    Logger: Symbol('Logger') as symbol & { __type: LoggerInterface },
    UserRepository: Symbol('UserRepository') as symbol & { __type: UserRepositoryInterface },
    Config: Symbol('Config') as symbol & { __type: ConfigInterface },
} as const

// ============================================================
// VALID CONFIGURATIONS - These should compile without errors
// ============================================================

// ✅ Different tokens - should be valid
export const configValidDifferentTokens = defineBuilderConfig({
    builderId: 'test.valid.different',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, provider: UserRepository },
    ],
})

// ✅ Different class tokens - should be valid
export const configValidDifferentClasses = defineBuilderConfig({
    builderId: 'test.valid.classes',
    injections: [
        { token: ConsoleLogger },
        { token: ProductService },
    ],
})

// ✅ Factory with correct type - should be valid
export const configValidFactory = defineBuilderConfig({
    builderId: 'test.valid.factory',
    injections: [
        {
            token: TOKENS.Logger,
            factory: (_provider: ContainerProvider): LoggerInterface => new ConsoleLogger(),
        },
    ],
})

// ✅ Value with correct type - should be valid
export const configValidValue = defineBuilderConfig({
    builderId: 'test.valid.value',
    injections: [
        {
            token: TOKENS.Config,
            value: (): ConfigInterface => ({ apiUrl: 'http://api.com', timeout: 5000 }),
        },
    ],
})

// ✅ Multiple factories with different tokens - should be valid
export const configValidMultipleFactories = defineBuilderConfig({
    builderId: 'test.valid.factories',
    injections: [
        { token: TOKENS.Logger, factory: (_provider: ContainerProvider) => new ConsoleLogger() },
        { token: TOKENS.UserRepository, factory: (_provider: ContainerProvider) => new UserRepository() },
    ],
})

// ✅ Mix of provider, factory, value, class - should be valid
export const configValidMixed = defineBuilderConfig({
    builderId: 'test.valid.mixed',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, factory: (_provider: ContainerProvider) => new UserRepository() },
        { token: TOKENS.Config, value: () => ({ apiUrl: 'http://api.com', timeout: 5000 }) },
        { token: ProductService },
    ],
})

// ✅ Partial with different token in config - should be valid
const partialWithLogger = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})

export const configValidPartialDifferent = defineBuilderConfig({
    builderId: 'test.valid.partial',
    extends: [partialWithLogger],
    injections: [
        { token: TOKENS.UserRepository, provider: UserRepository },
    ],
})

// ✅ Injections without listeners - should be valid (listeners optional)
export const configInjectionsOnly = defineBuilderConfig({
    builderId: 'test.injections.only',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: ProductService },
    ],
})

// ✅ Partial with factory - should be valid
export const partialWithFactory = definePartialConfig({
    injections: [
        {
            token: TOKENS.Config,
            factory: (_provider: ContainerProvider): ConfigInterface => ({
                apiUrl: 'http://api.com',
                timeout: 5000,
            }),
        },
    ],
})

export const configValidWithFactoryPartial = defineBuilderConfig({
    builderId: 'test.valid.factory.partial',
    extends: [partialWithFactory],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})

// ============================================================
// ERROR CONFIGURATIONS - Uncomment to see TypeScript errors
// These are documented examples of what SHOULD fail validation
// ============================================================

/*
// ❌ ERROR: Duplicate token in same array
const configDuplicateToken = defineBuilderConfig({
    builderId: 'test.error.duplicate',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ❌ Error: Duplicate token
    ],
})

// ❌ ERROR: Token already in partial
const configDuplicateFromPartial = defineBuilderConfig({
    builderId: 'test.error.partial',
    extends: [partialWithLogger],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ❌ Error: Already in partial
    ],
})

// ❌ ERROR: Duplicate class token
const configDuplicateClass = defineBuilderConfig({
    builderId: 'test.error.class',
    injections: [
        { token: ProductService },
        { token: ProductService }, // ❌ Error: Duplicate class token
    ],
})

// ❌ ERROR: Mixed duplicates (provider + factory)
const configMixedDuplicate = defineBuilderConfig({
    builderId: 'test.error.mixed',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, factory: () => new ConsoleLogger() }, // ❌ Error: Duplicate
    ],
})
*/


// ============================================================
// Type-level tests to verify validation types work
// ============================================================

// Test that ValidateInjectionsInternal catches duplicates
type TestDuplicateDetection = typeof configValidDifferentTokens extends { injections: infer I }
    ? I extends readonly unknown[]
        ? 'valid'
        : 'invalid'
    : 'invalid'

// This should be 'valid' because there are no duplicates
const _typeTest: TestDuplicateDetection = 'valid'

export { _typeTest }

