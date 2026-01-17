import { type ContainerProvider } from '../../index'

// ============================================================
// Interfaces
// ============================================================

export interface LoggerInterface {
    log(message: string): void
    debug(message: string): void
}

export interface UserRepositoryInterface {
    findById(id: string): Promise<{ id: string; name: string } | null>
    save(user: { id: string; name: string }): Promise<void>
}

export interface ProductRepositoryInterface {
    findById(id: string): Promise<{ id: string; title: string } | null>
    findAll(): Promise<Array<{ id: string; title: string }>>
}

export interface ConfigInterface {
    apiUrl: string
    timeout: number
    retries: number
}

// ============================================================
// Implementations
// ============================================================

export class ConsoleLogger implements LoggerInterface {
    readonly __brand = 'ConsoleLogger' as const
    log(message: string): void {
        console.log(message)
    }
    debug(message: string): void {
        console.debug(message)
    }
}

export class __FileLogger implements LoggerInterface {
    readonly __brand = '_FileLogger' as const
    log(message: string): void {
        console.log(`[FILE] ${message}`)
    }
    debug(message: string): void {
        console.debug(`[FILE] ${message}`)
    }
}

export class UserRepository implements UserRepositoryInterface {
    readonly __brand = 'UserRepository' as const
    async findById(id: string) {
        return { id, name: 'Test User' }
    }
    async save(_user: { id: string; name: string }) {
        // Implementation
    }
}

export class ProductRepository implements ProductRepositoryInterface {
    readonly __brand = 'ProductRepository' as const
    async findById(id: string) {
        return { id, title: 'Test Product' }
    }
    async findAll() {
        return []
    }
}

export class __WrongLogger {
    readonly __brand = '_WrongLogger' as const
    write(message: string): void {
        console.log(message)
    }
}

// ============================================================
// Events
// ============================================================

export class UserCreatedEvent {
    readonly __brand = 'UserCreatedEvent' as const
    constructor(public readonly userId: string) {}
}

export class UserUpdatedEvent {
    readonly __brand = 'UserUpdatedEvent' as const
    constructor(public readonly userId: string) {}
}

export class ProductCreatedEvent {
    readonly __brand = 'ProductCreatedEvent' as const
    constructor(public readonly productId: string) {}
}

export class OrderPlacedEvent {
    readonly __brand = 'OrderPlacedEvent' as const
}

// ============================================================
// Listeners
// ============================================================

export class EmailNotificationListener {
    readonly __brand = 'EmailNotificationListener' as const
    onEvent(_event: UserCreatedEvent): void {
        // Send email
    }
}

export class SmsNotificationListener {
    readonly __brand = 'SmsNotificationListener' as const
    onEvent(_event: UserCreatedEvent): void {
        // Send SMS
    }
}

export class AuditLogListener {
    readonly __brand = 'AuditLogListener' as const
    onEvent(_event: UserCreatedEvent | UserUpdatedEvent): void {
        // Log to audit
    }
}

// Additional listeners from listener-validation
export class EmailListener { readonly __brand = 'EmailListener' as const }
export class SmsListener { readonly __brand = 'SmsListener' as const }
export class LoggingListener { readonly __brand = 'LoggingListener' as const }

// ============================================================
// Services
// ============================================================

export class UserService {
    readonly __brand = 'UserService' as const
}

export class ProductService {
    readonly __brand = 'ProductService' as const
}

export class OrderService {
    readonly __brand = 'OrderService' as const
}

// ============================================================
// Tokens
// ============================================================

export const TOKENS = {
    Logger: Symbol('Logger') as symbol & { __type: LoggerInterface },
    UserRepository: Symbol('UserRepository') as symbol & { __type: UserRepositoryInterface },
    ProductRepository: Symbol('ProductRepository') as symbol & { __type: ProductRepositoryInterface },
    Config: Symbol('Config') as symbol & { __type: ConfigInterface },
} as const
