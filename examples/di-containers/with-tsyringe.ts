/**
 * Example: Using WireDI with tsyringe
 *
 * tsyringe is a lightweight dependency injection container for TypeScript/JavaScript.
 * It uses decorators (@injectable, @inject) for dependency registration.
 *
 * @see https://github.com/microsoft/tsyringe
 */

import 'reflect-metadata'
import { container, Lifecycle } from 'tsyringe'
import {
    useContainerProvider,
    TsyringeProvider,
    getContainerProvider,
    useEventDispatcherProvider,
    MutableEventDispatcherProvider,
    defineBuilderConfig,
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

class ConsoleLogger implements LoggerInterface {
    log(message: string): void {
        console.log(`[LOG] ${message}`)
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

class UserService {
    constructor(
        private logger: LoggerInterface,
        private userRepository: UserRepositoryInterface,
    ) {}

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
    constructor(private logger: LoggerInterface) {}

    onEvent(event: UserFetchedEvent): void {
        this.logger.log(`User fetched: ${event.userId}`)
    }
}

// ============================================================
// 4. SETUP PROVIDERS (do this once at app startup)
// ============================================================

function setupProviders(): void {
    // Setup DI container provider with tsyringe
    useContainerProvider(
        new TsyringeProvider({ container, Lifecycle })
    )

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

// Main builder config
// Note: When using symbol tokens, all symbols are seen as the same type by TypeScript.
// For type-safe token validation with partials, use class tokens.
const appConfig = defineBuilderConfig({
    builderId: 'example.tsyringe',
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
    // Initialize providers
    setupProviders()

    // Get the builder
    const { resolve } = useBuilder(appConfig)

    // Resolve services
    const userService = resolve(UserService)
    const user = await userService.getUser('1')

    console.log('User:', user)
}

main().catch(console.error)

