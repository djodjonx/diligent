/**
 * tsyringe Provider Adapter for WireDI
 *
 * This adapter allows using tsyringe as the DI container backend.
 * tsyringe is Microsoft's lightweight dependency injection container
 * for TypeScript/JavaScript using decorators.
 *
 * @remarks
 * The user must provide tsyringe dependencies to ensure the correct
 * version is used and to avoid bundling tsyringe as a direct dependency.
 *
 * @example Basic usage
 * ```typescript
 * import 'reflect-metadata'
 * import { container, Lifecycle } from 'tsyringe'
 * import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'
 *
 * useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
 * ```
 *
 * @example With child container for isolation
 * ```typescript
 * import { container, Lifecycle } from 'tsyringe'
 *
 * useContainerProvider(new TsyringeProvider(
 *     { container, Lifecycle },
 *     { useChildContainer: true }
 * ))
 * ```
 *
 * @see https://github.com/microsoft/tsyringe
 * @module
 */

import type { ContainerProvider, Constructor, ProviderToken } from '../types'
import { ProviderLifecycle } from '../types'

/**
 * Minimal interface for tsyringe's DependencyContainer
 * Allows decoupling from the actual tsyringe package
 */
export interface TsyringeDependencyContainer {
    /**
     * Registers a dependency in the container
     */
    register<T>(
        token: any,
        provider: { useValue?: T; useFactory?: () => T; useClass?: Constructor<T> },
        options?: { lifecycle?: unknown },
    ): void

    /**
     * Checks if a token is registered
     */
    isRegistered(token: any): boolean

    /**
     * Resolves a dependency from the container
     */
    resolve<T>(token: any): T

    /**
     * Creates a child container for scoped registrations
     */
    createChildContainer(): TsyringeDependencyContainer

    /**
     * Clears all singleton instances
     */
    clearInstances(): void
}

/**
 * Minimal interface for tsyringe's Lifecycle enum
 */
export interface TsyringeLifecycle {
    /** Single instance throughout the application */
    Singleton: unknown
    /** New instance on each resolution */
    Transient: unknown
    /** Single instance per child container */
    ContainerScoped: unknown
    /** Single instance per resolution tree */
    ResolutionScoped: unknown
}

/**
 * Dependencies required to create a TsyringeProvider
 * The user must provide these from their tsyringe installation
 */
export interface TsyringeDependencies {
    /**
     * The tsyringe container to use
     * @example `import { container } from 'tsyringe'`
     */
    container: TsyringeDependencyContainer

    /**
     * The tsyringe Lifecycle enum
     * @example `import { Lifecycle } from 'tsyringe'`
     */
    Lifecycle: TsyringeLifecycle
}

/**
 * Configuration options for TsyringeProvider
 */
export interface TsyringeProviderOptions {
    /**
     * Use a child container instead of the provided container
     * Useful for isolating registrations in tests or modules
     * @default false
     */
    useChildContainer?: boolean
}

/**
 * tsyringe adapter implementing the ContainerProvider interface
 *
 * Provides integration between WireDI and tsyringe,
 * allowing you to use tsyringe as your DI container while benefiting
 * from WireDI's configuration and validation features.
 */
export class TsyringeProvider implements ContainerProvider {
    /** @inheritdoc */
    readonly name = 'tsyringe'

    /** The tsyringe container instance */
    private readonly container: TsyringeDependencyContainer

    /** The tsyringe Lifecycle enum reference */
    private readonly Lifecycle: TsyringeLifecycle

    /**
     * Creates a new TsyringeProvider instance
     *
     * @param dependencies - tsyringe dependencies (container and Lifecycle)
     * @param options - Configuration options
     *
     * @example
     * ```typescript
     * import { container, Lifecycle } from 'tsyringe'
     *
     * const provider = new TsyringeProvider(
     *     { container, Lifecycle },
     *     { useChildContainer: true }
     * )
     * ```
     */
    constructor(
        dependencies: TsyringeDependencies,
        options: TsyringeProviderOptions = {},
    ) {
        this.Lifecycle = dependencies.Lifecycle
        this.container = options.useChildContainer
            ? dependencies.container.createChildContainer()
            : dependencies.container
    }

    /** @inheritdoc */
    registerValue<T>(token: symbol, value: T): void {
        this.container.register(token, { useValue: value })
    }

    /** @inheritdoc */
    registerFactory<T>(token: symbol, factory: (provider: ContainerProvider) => T): void {
        this.container.register(token, {
            useFactory: () => factory(this),
        })
    }

    /** @inheritdoc */
    registerClass<T>(
        token: ProviderToken<T>,
        implementation?: Constructor<T>,
        lifecycle: ProviderLifecycle = ProviderLifecycle.Singleton,
    ): void {
        const tsyringeLifecycle = this.mapLifecycle(lifecycle)

        if (this.isConstructor(token)) {
            this.container.register(
                token,
                { useClass: implementation ?? token },
                { lifecycle: tsyringeLifecycle },
            )
        } else {
            if (!implementation) {
                throw new Error(
                    `[TsyringeProvider] Implementation required when registering symbol token: ${String(token)}`
                )
            }
            this.container.register(
                token,
                { useClass: implementation },
                { lifecycle: tsyringeLifecycle },
            )
        }
    }

    /** @inheritdoc */
    isRegistered(token: ProviderToken): boolean {
        return this.container.isRegistered(token)
    }

    /** @inheritdoc */
    resolve<T>(token: ProviderToken<T>): T {
        return this.container.resolve<T>(token)
    }

    /** @inheritdoc */
    createScope(): ContainerProvider {
        return new TsyringeProvider(
            { container: this.container.createChildContainer(), Lifecycle: this.Lifecycle },
        )
    }

    /** @inheritdoc */
    dispose(): void {
        try {
            this.container.clearInstances()
        } catch {
            // Ignore if clearInstances is not available
        }
    }

    /**
     * Returns the underlying tsyringe DependencyContainer
     * @returns The tsyringe container instance
     */
    getUnderlyingContainer(): TsyringeDependencyContainer {
        return this.container
    }

    /**
     * Maps WireDI lifecycle to tsyringe Lifecycle
     * @internal
     */
    private mapLifecycle(lifecycle: ProviderLifecycle): unknown {
        switch (lifecycle) {
            case ProviderLifecycle.Singleton:
                return this.Lifecycle.Singleton
            case ProviderLifecycle.Transient:
                return this.Lifecycle.Transient
            case ProviderLifecycle.Scoped:
                return this.Lifecycle.ContainerScoped
            default:
                return this.Lifecycle.Singleton
        }
    }

    /**
     * Type guard to check if a token is a class constructor
     * @internal
     */
    private isConstructor<T>(token: unknown): token is Constructor<T> {
        return typeof token === 'function'
            && !!(token as Constructor).prototype
            && (token as Constructor).prototype.constructor === token
    }
}

