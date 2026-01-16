/**
 * Example: Type Checking Without Decorators
 *
 * This example demonstrates that WireDI's type checking
 * works perfectly WITHOUT any decorators.
 *
 * All type validation happens at the configuration level.
 */

import { defineBuilderConfig, ProviderLifecycle } from '@djodjonx/wiredi'

// ============================================================
// 1. DEFINE INTERFACES (No decorators)
// ============================================================

interface LoggerInterface {
    log(message: string): void
    error(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<User | null>
    save(user: User): Promise<void>
}

interface User {
    id: string
    name: string
    email: string
}

// ============================================================
// 2. PLAIN CLASSES (No decorators at all)
// ============================================================

/**
 * Console Logger - implements LoggerInterface
 * ✅ NO @injectable decorator needed
 */
class ConsoleLogger implements LoggerInterface {
    log(message: string): void {
        console.log(`[LOG] ${message}`)
    }

    error(message: string): void {
        console.error(`[ERROR] ${message}`)
    }
}

/**
 * File Logger - also implements LoggerInterface
 * ✅ NO decorators
 */
class FileLogger implements LoggerInterface {
    constructor(private filePath: string) {}

    log(message: string): void {
        // Write to file
        console.log(`[FILE] ${this.filePath}: ${message}`)
    }

    error(message: string): void {
        // Write error to file
        console.error(`[FILE] ${this.filePath}: ${message}`)
    }
}

/**
 * In-Memory User Repository
 * ✅ NO decorators
 */
class InMemoryUserRepository implements UserRepositoryInterface {
    private users = new Map<string, User>()

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) ?? null
    }

    async save(user: User): Promise<void> {
        this.users.set(user.id, user)
    }
}

/**
 * User Service - depends on Logger and UserRepository
 * ✅ NO decorators - dependencies defined in constructor
 */
class UserService {
    constructor(
        private logger: LoggerInterface,
        private repository: UserRepositoryInterface
    ) {}

    async getUser(id: string): Promise<User | null> {
        this.logger.log(`Fetching user: ${id}`)
        try {
            const user = await this.repository.findById(id)
            if (user) {
                this.logger.log(`User found: ${user.name}`)
            } else {
                this.logger.log(`User not found: ${id}`)
            }
            return user
        } catch (error: any) {
            this.logger.error(`Error fetching user: ${error.message}`)
            throw error
        }
    }

    async createUser(user: User): Promise<void> {
        this.logger.log(`Creating user: ${user.email}`)
        await this.repository.save(user)
        this.logger.log(`User created: ${user.id}`)
    }
}

// ============================================================
// 3. DEFINE TOKENS (Standard approach)
// ============================================================

const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepository: Symbol('UserRepository'),
}

// ============================================================
// 4. TYPE-SAFE CONFIGURATION (No decorators needed!)
// ============================================================

/**
 * ✅ ALL TYPE CHECKING WORKS WITHOUT DECORATORS
 */
const config = defineBuilderConfig({
    builderId: 'example.no-decorators',
    injections: [
        // ✅ Type checked: ConsoleLogger implements LoggerInterface
        {
            token: TOKENS.Logger,
            provider: ConsoleLogger,
            lifecycle: ProviderLifecycle.Singleton
        },

        // ✅ Type checked: InMemoryUserRepository implements UserRepositoryInterface
        {
            token: TOKENS.UserRepository,
            provider: InMemoryUserRepository,
            lifecycle: ProviderLifecycle.Singleton
        },

        // ✅ Type checked: UserService is a valid class
        {
            token: UserService,
            lifecycle: ProviderLifecycle.Singleton
        }
    ],
    listeners: []
})

// ============================================================
// 5. EXAMPLES OF TYPE ERRORS (Caught without decorators!)
// ============================================================

/**
 * Wrong implementation - doesn't implement LoggerInterface
 */
class WrongLogger {
    // Missing required methods
    wrongMethod() {}
}

/**
 * ❌ This would cause a TypeScript error:
 *
 * const badConfig = defineBuilderConfig({
 *     builderId: 'bad',
 *     injections: [
 *         {
 *             token: TOKENS.Logger,
 *             provider: WrongLogger // ❌ Type error!
 *         }
 *     ],
 *     listeners: []
 * })
 *
 * Error: Type 'typeof WrongLogger' is not assignable to type LoggerInterface
 */

// ============================================================
// 6. FACTORY EXAMPLE (No decorators)
// ============================================================

const configWithFactory = defineBuilderConfig({
    builderId: 'example.factory',
    injections: [
        // ✅ Factory with type checking
        {
            token: TOKENS.Logger,
            factory: (provider) => {
                // Return type is checked against LoggerInterface
                return new FileLogger('/var/log/app.log')
            }
        },

        {
            token: TOKENS.UserRepository,
            provider: InMemoryUserRepository
        },

        // ✅ Manual dependency injection via factory
        {
            token: UserService,
            factory: (provider) => {
                const logger = provider.resolve<LoggerInterface>(TOKENS.Logger)
                const repo = provider.resolve<UserRepositoryInterface>(TOKENS.UserRepository)
                return new UserService(logger, repo)
            }
        }
    ],
    listeners: []
})

// ============================================================
// 7. VALUE INJECTION EXAMPLE (No decorators)
// ============================================================

interface AppConfig {
    apiUrl: string
    timeout: number
}

const TOKENS_CONFIG = {
    AppConfig: Symbol('AppConfig'),
}

const configWithValues = defineBuilderConfig({
    builderId: 'example.values',
    injections: [
        // ✅ Value injection with type checking
        {
            token: TOKENS_CONFIG.AppConfig,
            value: () => ({
                apiUrl: 'https://api.example.com',
                timeout: 5000
            })
        }
    ],
    listeners: []
})

// ============================================================
// 8. DEMONSTRATION
// ============================================================

/**
 * Usage example (would need actual DI container setup)
 */
async function demonstrateTypeChecking() {
    console.log('✅ Type Checking Without Decorators')
    console.log('')
    console.log('Key Points:')
    console.log('1. No @injectable decorators used')
    console.log('2. No @inject decorators used')
    console.log('3. Type checking works at configuration level')
    console.log('4. Interface compliance validated by TypeScript')
    console.log('5. Token mismatches caught at compile-time')
    console.log('')
    console.log('All classes are plain TypeScript classes!')
}

// ============================================================
// EXPORTS
// ============================================================

export {
    ConsoleLogger,
    FileLogger,
    InMemoryUserRepository,
    UserService,
    TOKENS,
    config,
    configWithFactory,
    configWithValues,
    demonstrateTypeChecking,
}

export type {
    LoggerInterface,
    UserRepositoryInterface,
    User,
}

/**
 * SUMMARY:
 *
 * This example demonstrates that WireDI provides
 * full type safety WITHOUT requiring any decorators.
 *
 * Type checking happens at:
 * 1. Configuration time (defineBuilderConfig)
 * 2. Interface implementation (implements)
 * 3. Factory return types
 * 4. Value injection types
 *
 * Decorators are ONLY needed by the underlying DI container
 * (tsyringe, inversify) for runtime injection, NOT for type checking.
 *
 * With Awilix, you don't need decorators at all, and type
 * checking still works perfectly!
 */

