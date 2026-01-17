/**
 * Example: Using WireDI with InversifyJS
 *
 * InversifyJS is a powerful and lightweight inversion of control container
 * for JavaScript & Node.js apps powered by TypeScript.
 *
 * @see https://github.com/inversify/InversifyJS
 */

import 'reflect-metadata'
import * as inversify from 'inversify'
import { injectable, inject } from 'inversify'
import {
    useContainerProvider,
    getContainerProvider,
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    defineBuilderConfig,
    InversifyProvider,
    useBuilder,
} from '@djodjonx/wiredi'

// ============================================================
// 1. DEFINE TOKENS (Inversify typically uses symbols)
// ============================================================

const TOKENS = {
    Logger: Symbol.for('Logger'),
    UserRepository: Symbol.for('UserRepository'),
    UserService: Symbol.for('UserService'),
    UserFetchedListener: Symbol.for('UserFetchedListener'),
}

// ============================================================
// 2. DEFINE YOUR SERVICES (with Inversify decorators)
// ============================================================

interface LoggerInterface {
    log(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<{ id: string; name: string } | null>
}

@injectable()
class ConsoleLogger implements LoggerInterface {
    log(message: string): void {
        console.log(`[INVERSIFY LOG] ${message}`)
    }
}

@injectable()
class InMemoryUserRepository implements UserRepositoryInterface {
    private users = new Map([
        ['1', { id: '1', name: 'Alice' }],
        ['2', { id: '2', name: 'Bob' }],
    ])

    async findById(id: string) {
        return this.users.get(id) ?? null
    }
}

@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface,
        @inject(TOKENS.UserRepository) private userRepository: UserRepositoryInterface,
    ) {}

    async getUser(id: string) {
        this.logger.log(`Fetching user ${id}`)
        return this.userRepository.findById(id)
    }
}

// ============================================================
// 3. DEFINE EVENTS & LISTENERS
// ============================================================

class UserFetchedEvent {
    constructor(public readonly userId: string) {}
}

@injectable()
class UserFetchedListener {
    constructor(
        @inject(TOKENS.Logger) private logger: LoggerInterface,
    ) {}

    onEvent(event: UserFetchedEvent): void {
        this.logger.log(`[EVENT] User fetched: ${event.userId}`)
    }
}

// ============================================================
// 4. SETUP PROVIDERS
// ============================================================

function setupProviders(): void {
    // Setup DI container provider with Inversify
    // Use createSync for synchronous initialization
    const inversifyProvider = InversifyProvider.createSync(inversify)
    useContainerProvider(inversifyProvider)

    // Setup event dispatcher provider (optional)
    useEventDispatcherProvider(
        new MutableEventDispatcherProvider({
            containerProvider: getContainerProvider(),
        })
    )
}

// ============================================================
// 5. DEFINE CONFIGURATIONS
// ============================================================

// Note: When using symbol tokens, all symbols are seen as the same type by TypeScript.
// For type-safe token validation, use class tokens or unique symbol declarations.
const appConfig = defineBuilderConfig({
    builderId: 'example.inversify',
    extends: [],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, provider: InMemoryUserRepository },
        { token: TOKENS.UserService, provider: UserService },
        { token: TOKENS.UserFetchedListener, provider: UserFetchedListener },
    ],
    listeners: [
        { event: UserFetchedEvent, listener: UserFetchedListener },
    ],
})

// ============================================================
// 6. USE THE BUILDER
// ============================================================

async function main() {
    setupProviders()

    const { resolve } = useBuilder(appConfig)

    const userService = resolve(TOKENS.UserService) as UserService
    const user = await userService.getUser('1')

    console.log('User:', user)
}

main().catch(console.error)

