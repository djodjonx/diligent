/**
 * Example: Using WireDI with Awilix
 *
 * Awilix is a powerful dependency injection container for Node.js.
 * It supports multiple injection modes: PROXY, CLASSIC, and RESOLUTION.
 *
 * @see https://github.com/jeffijoe/awilix
 */

import * as awilix from 'awilix'
import {
    useContainerProvider,
    getContainerProvider,
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    defineBuilderConfig,
    AwilixProvider,
    useBuilder,
} from '@djodjonx/wiredi'

// ============================================================
// 1. DEFINE YOUR SERVICES
// ============================================================

interface LoggerInterface {
    log(message: string): void
}

interface UserRepositoryInterface {
    findById(id: string): Promise<{ id: string; name: string } | null>
}

// Awilix uses constructor parameter names for injection
// So we need to match the registered names
class ConsoleLogger implements LoggerInterface {
    log(message: string): void {
        console.log(`[AWILIX LOG] ${message}`)
    }
}

class InMemoryUserRepository implements UserRepositoryInterface {
    private users = new Map([
        ['1', { id: '1', name: 'Alice' }],
        ['2', { id: '2', name: 'Bob' }],
    ])

    async findById(id: string) {
        return this.users.get(id) ?? null
    }
}

// For Awilix PROXY mode, constructor params must match registered names
class UserService {
    private logger: LoggerInterface
    private userRepository: UserRepositoryInterface

    constructor({ Logger, UserRepository }: {
        Logger: LoggerInterface
        UserRepository: UserRepositoryInterface
    }) {
        this.logger = Logger
        this.userRepository = UserRepository
    }

    async getUser(id: string) {
        this.logger.log(`Fetching user ${id}`)
        return this.userRepository.findById(id)
    }
}

// ============================================================
// 2. DEFINE TOKENS
// ============================================================

const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepository: Symbol('UserRepository'),
} as const

// ============================================================
// 3. DEFINE EVENTS & LISTENERS
// ============================================================

class UserFetchedEvent {
    constructor(public readonly userId: string) {}
}

class UserFetchedListener {
    private logger: LoggerInterface

    constructor({ Logger }: { Logger: LoggerInterface }) {
        this.logger = Logger
    }

    onEvent(event: UserFetchedEvent): void {
        this.logger.log(`[EVENT] User fetched: ${event.userId}`)
    }
}

// ============================================================
// 4. SETUP PROVIDERS
// ============================================================

function setupProviders(): void {
    // Setup DI container provider with Awilix
    // Use createSync for synchronous initialization
    const awilixProvider = AwilixProvider.createSync(awilix, {
        injectionMode: 'PROXY',
    })
    useContainerProvider(awilixProvider)

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
// For type-safe token validation with partials, use class tokens.
const appConfig = defineBuilderConfig({
    builderId: 'example.awilix',
    extends: [],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.UserRepository, provider: InMemoryUserRepository },
        { token: UserService },
        { token: UserFetchedListener },
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

    const userService = resolve(UserService)
    const user = await userService.getUser('1')

    console.log('User:', user)
}

main().catch(console.error)

