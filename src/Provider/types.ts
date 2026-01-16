/**
 * Generic constructor type
 * @template T - The type of the class instance
 */
export type Constructor<T = any> = new (...args: any[]) => T

/**
 * Dependency lifecycle options
 * Independent of the underlying container implementation
 */
export enum ProviderLifecycle {
    /** Single shared instance throughout the application (default) */
    Singleton = 'singleton',
    /** New instance created on each resolution */
    Transient = 'transient',
    /** One instance per scope/child container */
    Scoped = 'scoped',
}

/**
 * Resolution token type (symbol or class constructor)
 * @template T - The type of the resolved dependency
 */
export type ProviderToken<T = any> = symbol | Constructor<T>

/**
 * DI Container Provider Interface
 *
 * Contract that each adapter (tsyringe, awilix, inversify, etc.)
 * must implement to be compatible with WireDI.
 *
 * @example
 * ```typescript
 * class MyCustomProvider implements ContainerProvider {
 *     readonly name = 'my-provider'
 *     // ... implement all methods
 * }
 * ```
 */
export interface ContainerProvider {
    /**
     * Provider name for debugging and logging purposes
     */
    readonly name: string

    /**
     * Registers a static value in the container
     *
     * @template T - The type of the value
     * @param token - Symbol token to register the value under
     * @param value - The value to register
     *
     * @example
     * ```typescript
     * provider.registerValue(TOKENS.ApiUrl, 'https://api.example.com')
     * ```
     */
    registerValue<T>(token: symbol, value: T): void

    /**
     * Registers a factory function in the container
     *
     * @template T - The type of the value produced by the factory
     * @param token - Symbol token to register the factory under
     * @param factory - Function that creates the instance (receives the provider to resolve dependencies)
     *
     * @example
     * ```typescript
     * provider.registerFactory(TOKENS.HttpClient, (p) => {
     *     return new HttpClient(p.resolve(TOKENS.ApiUrl))
     * })
     * ```
     */
    registerFactory<T>(token: symbol, factory: (provider: ContainerProvider) => T): void

    /**
     * Registers a class in the container
     *
     * @template T - The type of the class instance
     * @param token - Token (symbol or class) to register under
     * @param implementation - Class to instantiate (optional if token is a class)
     * @param lifecycle - Instance lifecycle (Singleton, Transient, or Scoped)
     *
     * @example
     * ```typescript
     * // Register class as its own token
     * provider.registerClass(UserService)
     *
     * // Register implementation for a symbol token
     * provider.registerClass(TOKENS.Logger, ConsoleLogger, ProviderLifecycle.Singleton)
     * ```
     */
    registerClass<T>(
        token: ProviderToken<T>,
        implementation?: Constructor<T>,
        lifecycle?: ProviderLifecycle,
    ): void

    /**
     * Checks if a token is already registered in the container
     *
     * @param token - Token to check
     * @returns `true` if the token is registered, `false` otherwise
     *
     * @example
     * ```typescript
     * if (!provider.isRegistered(TOKENS.Logger)) {
     *     provider.registerClass(TOKENS.Logger, ConsoleLogger)
     * }
     * ```
     */
    isRegistered(token: ProviderToken): boolean

    /**
     * Resolves a dependency from the container
     *
     * @template T - The type of the resolved dependency
     * @param token - Token of the dependency to resolve
     * @returns Instance of the dependency
     * @throws Error if the token is not registered
     *
     * @example
     * ```typescript
     * const logger = provider.resolve<LoggerInterface>(TOKENS.Logger)
     * const userService = provider.resolve(UserService)
     * ```
     */
    resolve<T>(token: ProviderToken<T>): T

    /**
     * Creates a child scope (child container)
     * Useful for HTTP requests, transactions, or isolated contexts
     *
     * @returns New scoped provider instance
     *
     * @example
     * ```typescript
     * const requestScope = provider.createScope()
     * requestScope.registerValue(TOKENS.RequestId, generateRequestId())
     * ```
     */
    createScope(): ContainerProvider

    /**
     * Releases provider resources
     * Called during application cleanup or shutdown
     */
    dispose(): void

    /**
     * Access to the underlying container (for advanced use cases)
     * Return type is generic as it depends on the implementation
     *
     * @returns The underlying DI container instance
     *
     * @example
     * ```typescript
     * const tsyringeContainer = provider.getUnderlyingContainer() as DependencyContainer
     * ```
     */
    getUnderlyingContainer(): unknown
}

/**
 * Options for provider adapters
 */
export interface ProviderAdapterOptions {
    /**
     * Existing container to use (optional)
     * If not provided, a new container will be created
     */
    container?: unknown
}

