/**
 * Awilix Provider Adapter for WireDI
 *
 * This adapter allows using Awilix as the DI container backend.
 * Awilix is a powerful dependency injection container for Node.js
 * that supports multiple injection modes.
 *
 * @remarks
 * Awilix uses string-based registration names internally. This provider
 * automatically maps symbol/class tokens to unique string names.
 *
 * @example Basic usage with lazy initialization
 * ```typescript
 * import { useContainerProvider, AwilixProvider } from '@djodjonx/wiredi'
 *
 * const provider = new AwilixProvider({ injectionMode: 'PROXY' })
 * await provider.init()
 * useContainerProvider(provider)
 * ```
 *
 * @example Synchronous initialization (recommended)
 * ```typescript
 * import * as awilix from 'awilix'
 * import { useContainerProvider, AwilixProvider } from '@djodjonx/wiredi'
 *
 * useContainerProvider(AwilixProvider.createSync(awilix, {
 *     injectionMode: 'PROXY'
 * }))
 * ```
 *
 * @example With existing container
 * ```typescript
 * import * as awilix from 'awilix'
 * const myContainer = awilix.createContainer()
 *
 * useContainerProvider(AwilixProvider.createSync(awilix, {
 *     container: myContainer
 * }))
 * ```
 *
 * @see https://github.com/jeffijoe/awilix
 * @module
 */

import type { AwilixContainer } from 'awilix'
import { Lifetime } from 'awilix'
import type { ContainerProvider, ProviderLifecycle } from '../types'
import { ProviderLifecycle as Lifecycle } from '../index'

/**
 * Generic constructor type for class instantiation
 * @template T - The type of the class instance
 * @internal
 */
type Constructor<T = any> = new (...args: any[]) => T

/**
 * Configuration options for AwilixProvider
 */
export interface AwilixProviderOptions {
    /**
     * Existing Awilix container to use
     * If not provided, a new container will be created
     * @default undefined (creates new container)
     */
    container?: AwilixContainer

    /**
     * Awilix injection mode
     * - `'PROXY'`: Dependencies are injected via a proxy object (recommended)
     * - `'CLASSIC'`: Dependencies are injected via constructor parameters by name
     * @default 'PROXY'
     */
    injectionMode?: 'PROXY' | 'CLASSIC'
}

/**
 * Awilix adapter implementing the ContainerProvider interface
 *
 * Provides integration between WireDI and Awilix,
 * allowing you to use Awilix as your DI container while benefiting
 * from WireDI's configuration and validation features.
 */
export class AwilixProvider implements ContainerProvider {
    /** @inheritdoc */
    readonly name = 'awilix'

    /** The Awilix container instance */
    private container: AwilixContainer

    /** Maps tokens to Awilix string-based registration names */
    private tokenToName = new Map<symbol | Constructor, string>()

    /** Counter for generating unique token names */
    private nameCounter = 0

    /** Lazily loaded awilix module */
    private awilix: typeof import('awilix') | null = null

    /**
     * Creates a new AwilixProvider instance
     *
     * @param options - Configuration options
     *
     * @remarks
     * When using the constructor directly, you must call `init()` before use,
     * or use `createSync()` for synchronous initialization.
     */
    constructor(private options: AwilixProviderOptions = {}) {
        this.container = null as any
    }

    /**
     * Lazily initializes the container (async)
     * @internal
     */
    private async ensureInitialized(): Promise<void> {
        if (this.container) return

        this.awilix = await import('awilix')
        this.container = this.options.container ?? this.awilix.createContainer({
            injectionMode: this.options.injectionMode === 'CLASSIC'
                ? this.awilix.InjectionMode.CLASSIC
                : this.awilix.InjectionMode.PROXY,
        })
    }

    /**
     * Throws if container is not initialized
     * @internal
     */
    private ensureInitializedSync(): void {
        if (!this.container) {
            throw new Error(
                '[AwilixProvider] Container not initialized. ' +
                'Call await provider.init() first, or pass a pre-created container in options.'
            )
        }
    }

    /**
     * Initializes the provider asynchronously
     *
     * @remarks
     * Required before using the provider if not using `createSync()`.
     *
     * @example
     * ```typescript
     * const provider = new AwilixProvider({ injectionMode: 'PROXY' })
     * await provider.init()
     * useContainerProvider(provider)
     * ```
     */
    async init(): Promise<void> {
        await this.ensureInitialized()
    }

    /**
     * Creates a pre-initialized provider synchronously
     *
     * @param awilix - The awilix module import
     * @param options - Configuration options
     * @returns Fully initialized AwilixProvider instance
     *
     * @remarks
     * This is the recommended way to create an AwilixProvider as it
     * avoids async initialization and ensures the provider is ready immediately.
     *
     * @example
     * ```typescript
     * import * as awilix from 'awilix'
     *
     * const provider = AwilixProvider.createSync(awilix, {
     *     injectionMode: 'CLASSIC'
     * })
     * ```
     */
    static createSync(awilix: typeof import('awilix'), options: AwilixProviderOptions = {}): AwilixProvider {
        const provider = new AwilixProvider(options)
        provider.awilix = awilix
        provider.container = options.container ?? awilix.createContainer({
            injectionMode: options.injectionMode === 'CLASSIC'
                ? awilix.InjectionMode.CLASSIC
                : awilix.InjectionMode.PROXY,
        })
        return provider
    }

    /**
     * Gets or creates a unique string name for a token
     * Awilix uses string-based registration, so we map symbols/classes to strings
     * @internal
     */
    private getTokenName(token: symbol | Constructor): string {
        if (!this.tokenToName.has(token)) {
            const name = typeof token === 'symbol'
                ? token.description ?? `token_${this.nameCounter++}`
                : token.name
            this.tokenToName.set(token, name)
        }
        return this.tokenToName.get(token)!
    }

    /**
     * Maps WireDI lifecycle to Awilix Lifetime
     * @internal
     */
    private mapLifecycle(lifecycle?: ProviderLifecycle): typeof Lifetime[keyof typeof Lifetime] {
        this.ensureInitializedSync()

        switch (lifecycle) {
            case Lifecycle.Transient:
                return Lifetime.TRANSIENT
            case Lifecycle.Scoped:
                return Lifetime.SCOPED
            case Lifecycle.Singleton:
            default:
                return Lifetime.SINGLETON
        }
    }

    /** @inheritdoc */
    registerValue<T>(token: symbol, value: T): void {
        this.ensureInitializedSync()
        const { asValue } = this.awilix!
        const name = this.getTokenName(token)
        this.container.register({
            [name]: asValue(value),
        })
    }

    /** @inheritdoc */
    registerFactory<T>(token: symbol, factory: (provider: ContainerProvider) => T): void {
        this.ensureInitializedSync()
        const { asFunction } = this.awilix!
        const name = this.getTokenName(token)
        this.container.register({
            [name]: asFunction(() => factory(this)).singleton(),
        })
    }

    /** @inheritdoc */
    registerClass<T>(
        token: symbol | Constructor<T>,
        impl?: Constructor<T>,
        lifecycle?: ProviderLifecycle,
    ): void {
        this.ensureInitializedSync()
        const { asClass } = this.awilix!
        const name = this.getTokenName(token)
        const ClassToRegister = impl ?? (token as Constructor<T>)
        const lifetime = this.mapLifecycle(lifecycle)

        this.container.register({
            [name]: asClass(ClassToRegister).setLifetime(lifetime),
        })
    }

    /** @inheritdoc */
    isRegistered(token: symbol | Constructor): boolean {
        this.ensureInitializedSync()
        const name = this.getTokenName(token)
        return this.container.hasRegistration(name)
    }

    /** @inheritdoc */
    resolve<T>(token: symbol | Constructor<T>): T {
        this.ensureInitializedSync()
        const name = this.getTokenName(token)
        return this.container.resolve<T>(name)
    }

    /** @inheritdoc */
    createScope(): ContainerProvider {
        this.ensureInitializedSync()
        const scopedContainer = this.container.createScope()
        const scopedProvider = AwilixProvider.createSync(this.awilix!, {
            container: scopedContainer,
        })
        this.tokenToName.forEach((name, token) => {
            scopedProvider.tokenToName.set(token, name)
        })
        return scopedProvider
    }

    /** @inheritdoc */
    dispose(): void {
        if (this.container) {
            this.container.dispose()
        }
    }

    /**
     * Returns the underlying Awilix container instance
     * @returns The AwilixContainer instance
     */
    getUnderlyingContainer(): AwilixContainer {
        this.ensureInitializedSync()
        return this.container
    }
}

