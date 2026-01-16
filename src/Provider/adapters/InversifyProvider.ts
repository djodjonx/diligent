/**
 * InversifyJS Provider Adapter for WireDI
 *
 * This adapter allows using InversifyJS as the DI container backend.
 * InversifyJS is a powerful and lightweight inversion of control container
 * for JavaScript & Node.js apps powered by TypeScript.
 *
 * @remarks
 * Classes registered with this provider must be decorated with `@injectable()`.
 * The provider supports lazy initialization or synchronous initialization via `createSync()`.
 *
 * @example Basic usage with lazy initialization
 * ```typescript
 * import { useContainerProvider, InversifyProvider } from '@djodjonx/wiredi'
 *
 * const provider = new InversifyProvider()
 * await provider.init()
 * useContainerProvider(provider)
 * ```
 *
 * @example Synchronous initialization (recommended)
 * ```typescript
 * import 'reflect-metadata'
 * import * as inversify from 'inversify'
 * import { useContainerProvider, InversifyProvider } from '@djodjonx/wiredi'
 *
 * useContainerProvider(InversifyProvider.createSync(inversify))
 * ```
 *
 * @example With existing container
 * ```typescript
 * import * as inversify from 'inversify'
 * const myContainer = new inversify.Container()
 *
 * useContainerProvider(InversifyProvider.createSync(inversify, {
 *     container: myContainer
 * }))
 * ```
 *
 * @see https://github.com/inversify/InversifyJS
 * @module
 */

import type { Container } from 'inversify'
import type { ContainerProvider, ProviderLifecycle } from '../types'
import { ProviderLifecycle as Lifecycle } from '../index'

/**
 * Generic constructor type for class instantiation
 * @template T - The type of the class instance
 * @internal
 */
type Constructor<T = any> = new (...args: any[]) => T

/**
 * InversifyJS binding scope options
 * @internal
 */
type BindingScope = 'Singleton' | 'Transient' | 'Request'

/**
 * Configuration options for InversifyProvider
 */
export interface InversifyProviderOptions {
    /**
     * Existing Inversify container to use
     * If not provided, a new container will be created
     * @default undefined (creates new container)
     */
    container?: Container

    /**
     * Default binding scope for registrations without explicit lifecycle
     * @default 'Singleton'
     */
    defaultScope?: BindingScope
}

/**
 * InversifyJS adapter implementing the ContainerProvider interface
 *
 * Provides integration between WireDI and InversifyJS,
 * allowing you to use InversifyJS as your DI container while benefiting
 * from WireDI's configuration and validation features.
 */
export class InversifyProvider implements ContainerProvider {
    /** @inheritdoc */
    readonly name = 'inversify'

    /** The InversifyJS container instance */
    private container: Container

    /** Default scope for bindings */
    private defaultScope: BindingScope

    /** Lazily loaded inversify module */
    private inversify: typeof import('inversify') | null = null

    /**
     * Creates a new InversifyProvider instance
     *
     * @param options - Configuration options
     *
     * @remarks
     * When using the constructor directly, you must call `init()` before use,
     * or use `createSync()` for synchronous initialization.
     */
    constructor(private options: InversifyProviderOptions = {}) {
        this.defaultScope = options.defaultScope ?? 'Singleton'
        this.container = null as any
    }

    /**
     * Lazily initializes the container (async)
     * @internal
     */
    private async ensureInitialized(): Promise<void> {
        if (this.container) return

        this.inversify = await import('inversify')
        this.container = this.options.container ?? new this.inversify.Container()
    }

    /**
     * Throws if container is not initialized
     * @internal
     */
    private ensureInitializedSync(): void {
        if (!this.container) {
            throw new Error(
                '[InversifyProvider] Container not initialized. ' +
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
     * const provider = new InversifyProvider()
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
     * @param inversify - The inversify module import
     * @param options - Configuration options
     * @returns Fully initialized InversifyProvider instance
     *
     * @remarks
     * This is the recommended way to create an InversifyProvider as it
     * avoids async initialization and ensures the provider is ready immediately.
     *
     * @example
     * ```typescript
     * import * as inversify from 'inversify'
     *
     * const provider = InversifyProvider.createSync(inversify, {
     *     defaultScope: 'Transient'
     * })
     * ```
     */
    static createSync(inversify: typeof import('inversify'), options: InversifyProviderOptions = {}): InversifyProvider {
        const provider = new InversifyProvider(options)
        provider.inversify = inversify
        provider.container = options.container ?? new inversify.Container()
        return provider
    }

    /**
     * Maps WireDI lifecycle to InversifyJS binding scope
     * @internal
     */
    private mapLifecycle(lifecycle?: ProviderLifecycle): BindingScope {
        switch (lifecycle) {
            case Lifecycle.Transient:
                return 'Transient'
            case Lifecycle.Scoped:
                return 'Request'
            case Lifecycle.Singleton:
            default:
                return 'Singleton'
        }
    }

    /**
     * Applies the scope to an InversifyJS binding
     * @internal
     */
    private applyScope(binding: any, scope: BindingScope): void {
        switch (scope) {
            case 'Singleton':
                binding.inSingletonScope()
                break
            case 'Transient':
                binding.inTransientScope()
                break
            case 'Request':
                binding.inRequestScope()
                break
        }
    }

    /** @inheritdoc */
    registerValue<T>(token: symbol, value: T): void {
        this.ensureInitializedSync()

        if (this.container.isBound(token)) {
            this.container.unbind(token)
        }
        this.container.bind(token).toConstantValue(value)
    }

    /** @inheritdoc */
    registerFactory<T>(token: symbol, factory: (provider: ContainerProvider) => T): void {
        this.ensureInitializedSync()

        if (this.container.isBound(token)) {
            this.container.unbind(token)
        }
        this.container.bind(token).toDynamicValue(() => factory(this))
    }

    /** @inheritdoc */
    registerClass<T>(
        token: symbol | Constructor<T>,
        impl?: Constructor<T>,
        lifecycle?: ProviderLifecycle,
    ): void {
        this.ensureInitializedSync()

        const ClassToRegister = impl ?? (token as Constructor<T>)
        const scope = this.mapLifecycle(lifecycle)

        if (this.container.isBound(token)) {
            this.container.unbind(token)
        }

        const binding = this.container.bind(token).to(ClassToRegister)
        this.applyScope(binding, scope)
    }

    /** @inheritdoc */
    isRegistered(token: symbol | Constructor): boolean {
        this.ensureInitializedSync()
        return this.container.isBound(token)
    }

    /** @inheritdoc */
    resolve<T>(token: symbol | Constructor<T>): T {
        this.ensureInitializedSync()
        return this.container.get<T>(token)
    }

    /** @inheritdoc */
    createScope(): ContainerProvider {
        this.ensureInitializedSync()
        const childContainer = new this.inversify!.Container()
        return InversifyProvider.createSync(this.inversify!, {
            container: childContainer,
            defaultScope: this.defaultScope,
        })
    }

    /** @inheritdoc */
    dispose(): void {
        if (this.container) {
            this.container.unbindAll()
        }
    }

    /**
     * Returns the underlying InversifyJS Container instance
     * @returns The InversifyJS Container
     */
    getUnderlyingContainer(): Container {
        this.ensureInitializedSync()
        return this.container
    }
}

