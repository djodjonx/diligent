import {
    getContainerProvider,
    type ContainerProvider,
    ProviderLifecycle,
} from './Provider/index'
import {
    getEventDispatcherProvider,
    hasEventDispatcherProvider,
} from './EventDispatcher/Provider/index'

// Re-export Provider API
export {
    useContainerProvider,
    getContainerProvider,
    hasContainerProvider,
    resetContainerProvider,
    TsyringeProvider,
    AwilixProvider,
    InversifyProvider,
    ProviderLifecycle,
} from './Provider/index'

export type {
    ContainerProvider,
    ProviderToken,
    ProviderAdapterOptions,
    TsyringeProviderOptions,
    TsyringeDependencies,
    TsyringeDependencyContainer,
    TsyringeLifecycle,
    AwilixProviderOptions,
    InversifyProviderOptions,
} from './Provider/index.ts'

// Re-export EventDispatcher Provider API
export {
    useEventDispatcherProvider,
    getEventDispatcherProvider,
    hasEventDispatcherProvider,
    resetEventDispatcherProvider,
    MutableEventDispatcherProvider,
} from './EventDispatcher/Provider/index'

export type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
    EventListenerEntry,
} from './EventDispatcher/Provider/index'

// Generic constructor type - 'any[]' is required for constructor args compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = unknown> = new (...args: any[]) => T

/**
 * Value injection entry - registers a static value for a token
 * @template C - Context type passed to the value function
 * @template T - Type of the value returned
 */
interface BuilderConfigEntryValue<C = null, T = unknown> {
    token: symbol
    value: (context?: C) => T
}

/**
 * Injection with symbol token and provider class
 * @template T - Type of the instance created by the provider
 */
interface BuilderConfigEntryInjectionWithToken<T = unknown> {
    token: symbol
    provider: Constructor<T>
    lifecycle?: ProviderLifecycle
}

/**
 * Injection using a class as both token and provider
 */
interface BuilderConfigEntryInjectionWithClass {
    token: Constructor
    lifecycle?: ProviderLifecycle
}

/**
 * Factory injection entry - registers a factory function for a token
 * @template T - Type of the instance returned by the factory
 */
interface BuilderConfigEntryFactory<T = unknown> {
    token: symbol
    factory: (provider: ContainerProvider) => T
}

type BuilderConfigEntries<C> = BuilderConfigEntryValue<C, unknown>
    | BuilderConfigEntryInjectionWithToken<unknown>
    | BuilderConfigEntryFactory<unknown>
    | BuilderConfigEntryInjectionWithClass


export type InjectionConfig<C> = readonly BuilderConfigEntries<C>[]

interface EventEntry {
    event: Constructor
    listener: Constructor
}


export type EventConfig = readonly EventEntry[]

export interface BuilderConfig<C = null> {
    builderId: string
    injections: InjectionConfig<C>
    listeners?: EventConfig
}

/**
 * A partial builder configuration that defines a set of injections and listeners.
 * Partials are "traits" or "mixins" that can be composed into a main `BuilderConfig`.
 *
 * NOTE: Partials cannot extend other partials to prevent hidden dependency chains.
 */
export interface PartialBuilderConfig<C = null> {
    injections?: InjectionConfig<C>
    listeners?: EventConfig
}

type ResolveToken<T> = symbol | Constructor<T>

/**
 * Type guard to check if a token is a constructor (class).
 * @param token The token to check.
 * @returns True if the token is a constructor, false otherwise.
 */
function isConstructor<T = any>(token: unknown): token is Constructor<T> {
    return typeof token === 'function'
        && !!(token as Constructor).prototype
        && (token as Constructor).prototype.constructor === token
}

/**
 * Helper type to extract the tuple of tokens from the injections config.
 */
type ExtractTokens<T> = {
    [K in keyof T]: T[K] extends { token: infer Token } ? Token : never
}

/**
 * A builder configuration with strictly inferred token types.
 * @template C The context type.
 * @template Tokens The tuple of allowed tokens.
 */
export interface TypedBuilderConfig<C, Tokens> extends BuilderConfig<C> {
    // Phantom property to carry the inferred tokens type for the IDE
    readonly __tokens?: Tokens
}

/**
 * A partial builder configuration with strictly inferred token types.
 * @template C The context type.
 * @template Tokens The tuple of allowed tokens.
 */
export interface TypedPartialConfig<C, Tokens> extends PartialBuilderConfig<C> {
    readonly __tokens?: Tokens
}

/**
 * Interface for the return object of `useBuilder`, providing a `resolve` method.
 * The `AllowedTokens` generic parameter strictly types which tokens can be resolved.
 */
interface IUseBuilder<AllowedTokens = ResolveToken<any>> {
    /**
     * Resolves a class dependency.
     * The return type is automatically inferred as the class instance.
     *
     * @template Token The class constructor type (inferred from argument).
     * @param token The class constructor token.
     * @returns The instance of the class.
     */
    resolve<Token extends Extract<AllowedTokens, Constructor<any>>>(token: Token): InstanceType<Token>

    /**
     * Resolves a dependency from the container (for Symbols or explicit types).
     *
     * @template T The type of the dependency to resolve.
     * @param token The token (symbol or constructor) of the dependency.
     *              This is strictly type-checked against the `injections` defined in the builder config.
     * @returns The resolved instance of the dependency.
     */
    resolve<T>(token: AllowedTokens & ResolveToken<T>): T
}

function registerConfig<C = null>(
    provider: ContainerProvider,
    injections: InjectionConfig<C>,
    context?: C,
): void {
    injections.forEach(entry => {
        if (provider.isRegistered(entry.token)) return

        if ('value' in entry) {
            // Value injection
            provider.registerValue(entry.token, entry.value(context))
        } else if ('factory' in entry) {
            // Factory injection
            provider.registerFactory(entry.token, () => entry.factory(provider))
        } else if (isConstructor(entry.token)) {
            // Class token (token is the class itself)
            const lifecycle = entry.lifecycle ?? ProviderLifecycle.Singleton
            provider.registerClass(entry.token, entry.token, lifecycle)
        } else {
            // Symbol token with provider class
            if (!('provider' in entry)) {
                throw new Error(`Provider required when registering token Symbol: ${String(entry.token)}`)
            }
            const lifecycle = entry.lifecycle ?? ProviderLifecycle.Singleton
            provider.registerClass(entry.token, entry.provider, lifecycle)
        }
    })
}


function registerEvent(
    _provider: ContainerProvider,
    listeners?: EventConfig,
): void {
    if (!listeners || !listeners.length) return

    // Check if event dispatcher provider is configured
    if (!hasEventDispatcherProvider()) {
        // Silently skip if no event dispatcher is configured
        // This allows using WireDI without events
        return
    }

    const eventDispatcher = getEventDispatcherProvider()

    listeners.forEach((configEntry) => {
        if (!eventDispatcher.hasListener(configEntry.event, configEntry.listener)) {
            eventDispatcher.register(configEntry.event, configEntry.listener)
        }
    })
}

/**
 * Helper to define a partial configuration (injections/listeners).
 *
 * Partials are designed to be flat collections of dependencies. They do not support
 * inheritance (`extends`) or overriding to prevent complex dependency graphs.
 * All conflict resolution must happen in the main `defineBuilderConfig`.
 *
 * @template C The type of the context object (optional).
 * @template I The specific type of the injections array (inferred).
 * @param config The partial builder configuration object.
 * @returns The configuration object typed as TypedPartialConfig.
 */
export function definePartialConfig<C = null, const I extends InjectionConfig<C> = InjectionConfig<C>>(
    config: PartialBuilderConfig<C> & { injections?: I },
): TypedPartialConfig<C, ExtractTokens<I>> {
    return config as any
}

// --- Type Helpers for `defineBuilderConfig` Extension Logic ---

/**
 * Recursively extracts tokens from a tuple of TypedPartialConfigs.
 */
// eslint-disable-next-line max-len
type ExtractTokensFromTypedPartials<T extends readonly TypedPartialConfig<any, any>[]> = T extends readonly [infer Head, ...infer Tail]
    ? Tail extends readonly TypedPartialConfig<any, any>[]
        ? Head extends TypedPartialConfig<any, infer Tokens>
            ? Tokens extends readonly any[]
                ? [...Tokens, ...ExtractTokensFromTypedPartials<Tail>]
                : ExtractTokensFromTypedPartials<Tail>
            : ExtractTokensFromTypedPartials<Tail>
        : []
    : []

/**
 * Helper to extract (Event, Listener) pairs from partials for duplicate checking.
 */
// eslint-disable-next-line max-len
type ExtractListenersFromPartials<T extends readonly TypedPartialConfig<any, any>[]> = T extends readonly [infer Head, ...infer Tail]
    ? Tail extends readonly TypedPartialConfig<any, any>[]
        ? Head extends { listeners?: readonly (infer L)[] }
            ? L | ExtractListenersFromPartials<Tail>
            : ExtractListenersFromPartials<Tail>
        : never
    : never

/**
 * Validates that injections do not collide with tokens from inherited partials.
 *
 * Rules:
 * 1. Token exists in Partial -> ❌ Error: Token collision (duplicates not allowed)
 * 2. Token NOT in Partial -> ✅ Valid New Entry
 * 3. Token duplicated in same array -> ❌ Error: Internal duplication
 *
 * Note: Token overrides are not allowed. Each token must be unique across all partials
 * and the main configuration. This prevents accidental redefinition of dependencies.
 */
type ValidateInjections<LocalInjections, InheritedTokenUnion> =
    [InheritedTokenUnion] extends [never]
        // No inherited tokens, validate only internal duplicates
        ? ValidateInjectionsInternal<LocalInjections>
        : ValidateInjectionsInternal<ValidateAgainstPartials<LocalInjections, InheritedTokenUnion>>

/**
 * Validates injections against inherited tokens from partials.
 *
 * Note: Plain symbols are skipped because TypeScript sees all Symbol() as the same type.
 * Use branded symbols or class tokens for proper partial validation.
 */
type ValidateAgainstPartials<LocalInjections, InheritedTokenUnion> = {
    [K in keyof LocalInjections]: LocalInjections[K] extends { token: infer T }
        ? T extends symbol
            ? symbol extends T
                ? LocalInjections[K] // Plain symbol - skip validation
                : T extends InheritedTokenUnion // Branded symbol - validate
                    ? {
                        error: '[WireDI] This token is already registered in a partial. Remove it from here or from the partial to avoid conflicts.'
                        token: T
                        hint: 'Each token can only be registered once across all partials and the main config.'
                    }
                    : LocalInjections[K]
            : T extends InheritedTokenUnion // Class or other token - validate
                ? {
                    error: '[WireDI] This token is already registered in a partial. Remove it from here or from the partial to avoid conflicts.'
                    token: T
                    hint: 'Each token can only be registered once across all partials and the main config.'
                }
                : LocalInjections[K]
        : LocalInjections[K]
}

/**
 * Validates that there are no duplicate tokens within the same injections array.
 * Checks each token against all following entries.
 *
 * Note: Plain symbols (Symbol('x')) are skipped because TypeScript sees them all as type 'symbol'.
 * For duplicate detection with symbols, use branded symbols: Symbol('x') as symbol & { __brand: 'x' }
 */
type ValidateInjectionsInternal<T> = T extends readonly []
    ? T
    : T extends readonly [infer First, ...infer Rest]
        ? First extends { token: infer Token }
            ? IsPlainSymbol<Token> extends true
                ? [First, ...ValidateInjectionsInternal<Rest>] // Skip plain symbols
                : HasTokenDuplicate<Token, Rest> extends true
                    ? [
                        {
                            error: '[WireDI] Duplicate token in the same configuration'
                            token: Token
                            hint: 'Each token can only be registered once. Remove one of the duplicate entries.'
                        },
                        ...ValidateInjectionsInternal<Rest>
                    ]
                    : [First, ...ValidateInjectionsInternal<Rest>]
            : [First, ...ValidateInjectionsInternal<Rest>]
        : T

/**
 * Checks if a type is a plain symbol (not branded).
 * Plain symbols are Symbol() without intersection types.
 */
type IsPlainSymbol<T> = T extends symbol
    ? symbol extends T
        ? true  // T is exactly 'symbol' (plain, not branded)
        : false // T is a branded symbol (symbol & { ... })
    : false     // T is not a symbol at all

/**
 * Helper to check if a token exists in the rest of the array.
 * Uses strict type equality to avoid false positives.
 *
 * Note: Plain symbols without branding (e.g., Symbol('x')) are all seen as 'symbol' type
 * by TypeScript, so we skip duplicate detection for plain symbols to avoid false positives.
 * For proper token validation, use branded symbols or class tokens.
 */
type HasTokenDuplicate<Token, Rest> =
    // Skip duplicate detection for plain symbols (they're all the same type to TS)
    Token extends symbol
        ? symbol extends Token
            ? false // Plain symbol without branding - skip detection
            : HasTokenDuplicateCheck<Token, Rest> // Branded symbol - check for duplicates
        : HasTokenDuplicateCheck<Token, Rest> // Class or other token - check for duplicates

type HasTokenDuplicateCheck<Token, Rest> = Rest extends readonly [infer First, ...infer Tail]
    ? First extends { token: infer T }
        ? StrictEquals<Token, T> extends true
            ? true
            : HasTokenDuplicateCheck<Token, Tail>
        : HasTokenDuplicateCheck<Token, Tail>
    : false

/**
 * Validates that local listeners do not duplicate listeners already defined in partials.
 * Duplicate = Same Event class AND Same Listener class.
 */
type ValidateListeners<LocalListeners, InheritedListenerUnion> =
    [InheritedListenerUnion] extends [never]
        // No inherited listeners, validate only internal duplicates
        ? ValidateListenersInternal<LocalListeners>
        : ValidateListenersAgainstPartials<LocalListeners, InheritedListenerUnion>

/**
 * Check each local listener against inherited listeners from partials.
 * Uses strict type equality to avoid false positives.
 */
type ValidateListenersAgainstPartials<LocalListeners, InheritedListenerUnion> = {
    [K in keyof LocalListeners]: LocalListeners[K] extends { event: infer E, listener: infer L }
        ? IsListenerInUnion<E, L, InheritedListenerUnion> extends true
            ? {
                error: '[WireDI] This event listener is already registered in a partial'
                event: E
                listener: L
                hint: 'Each (event, listener) pair can only be registered once.'
            }
            : LocalListeners[K]
        : LocalListeners[K]
}

/**
 * Check if a specific (event, listener) pair exists in a union of listener entries.
 * Uses strict type equality for both event AND listener.
 */
type IsListenerInUnion<E, L, Union> = Union extends { event: infer UE, listener: infer UL }
    ? StrictEquals<E, UE> extends true
        ? StrictEquals<L, UL> extends true
            ? true
            : IsListenerInUnion<E, L, Exclude<Union, { event: UE, listener: UL }>>
        : IsListenerInUnion<E, L, Exclude<Union, { event: UE, listener: UL }>>
    : false

/**
 * Strict type equality check.
 * Returns true only if A and B are exactly the same type.
 */
type StrictEquals<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

/**
 * Validates that there are no duplicate listeners within the same array.
 * Checks each listener against all following listeners.
 * A duplicate is defined as having BOTH the same event AND the same listener.
 */
type ValidateListenersInternal<T> = T extends readonly []
    ? T
    : T extends readonly [infer First, ...infer Rest]
        ? First extends { event: infer E, listener: infer L }
            ? HasExactDuplicate<E, L, Rest> extends true
                ? [
                    {
                        error: '[WireDI] Duplicate listener in the same configuration'
                        event: E
                        listener: L
                        hint: 'Each (event, listener) pair must be unique within the configuration.'
                    },
                    ...ValidateListenersInternal<Rest>
                ]
                : [First, ...ValidateListenersInternal<Rest>]
            : [First, ...ValidateListenersInternal<Rest>]
        : T

/**
 * Helper to check if an exact (event, listener) pair exists in the rest of the array.
 * Uses strict type equality to avoid false positives with structurally similar types.
 */
type HasExactDuplicate<E, L, Rest> = Rest extends readonly [infer First, ...infer Tail]
    ? First extends { event: infer FE, listener: infer FL }
        ? StrictEquals<E, FE> extends true
            ? StrictEquals<L, FL> extends true
                ? true
                : HasExactDuplicate<E, L, Tail>
            : HasExactDuplicate<E, L, Tail>
        : HasExactDuplicate<E, L, Tail>
    : false

/**
 * A helper function to define a builder configuration with strict type inference and inheritance.
 * Use this instead of manually casting with `satisfies BuilderConfig` or `as const`
 * to ensure that `useBuilder` can correctly infer the available tokens.
 *
 * This function now supports `extends` to inherit from `definePartialConfig` definitions.
 * Token collisions are strictly forbidden - each token must be unique across all partials
 * and the main configuration to prevent accidental redefinition.
 *
 * @template C The type of the context object (optional).
 * @template Partials The tuple of partial configs to extend.
 * @template LocalInjections The specific type of the local injections array (inferred).
 * @param config The builder configuration object.
 * @returns The configuration object typed as TypedBuilderConfig to simplify IDE display.
 *
 * @example
 * ```typescript
 * import { Lifecycle } from 'tsyringe';
 *
 * class MyService {}
 * class MyProvider {}
 * class MyEvent {}
 * class MyEventListener {
 *   onEvent(event: MyEvent) {
 *     console.log('Event received:', event);
 *   }
 * }
 *
 * const MY_TOKEN = Symbol('MY_TOKEN');
 * const MY_VALUE_TOKEN = Symbol('MY_VALUE_TOKEN');
 * const MY_FACTORY_TOKEN = Symbol('MY_FACTORY_TOKEN');
 *
 * // --- Partial Configuration ---
 * const myPartial = definePartialConfig({
 *   injections: [
 *     { token: MyService } // Provides MyService
 *   ],
 *   listeners: [
 *     { event: MyEvent, listener: MyEventListener }
 *   ]
 * });
 *
 * // --- Main Builder Configuration ---
 * const myBuilderConfig = defineBuilderConfig({
 *   builderId: 'my.unique.builder',
 *   extends: [myPartial],
 *   injections: [
 *     // ❌ ERROR: Token collision - MyService is already defined in myPartial
 *     // { token: MyService },
 *
 *     // ✅ OK: New tokens not in partials
 *     { token: MY_TOKEN, provider: MyProvider },
 *     { token: MY_TOKEN, provider: MyProvider, lifecycle: Lifecycle.Transient },
 *
 *     // 3. Value Injection (can use optional context)
 *     { token: MY_VALUE_TOKEN, value: (context) => context?.someConfig ?? 'defaultValue' },
 *
 *     // 4. Factory Injection
 *     { token: MY_FACTORY_TOKEN, factory: (container) => new MyService() },
 *   ],
 *   listeners: [
 *     // ❌ ERROR: Duplicate listener (Event + Listener pair already in myPartial)
 *     // { event: MyEvent, listener: MyEventListener },
 *
 *     // ✅ OK: New listener not in partials
 *     { event: OtherEvent, listener: OtherEventListener },
 *   ],
 * });
 *
 * // Usage:
 * // const { resolve } = useBuilder(myBuilderConfig, { someConfig: 'custom' });
 * // const service = resolve(MyService);
 * // const value = resolve(MY_VALUE_TOKEN);
 * ```
 */
export function defineBuilderConfig<
    C = null,
    const Partials extends readonly TypedPartialConfig<C, any>[] = [],
    const LocalInjections extends InjectionConfig<C> = InjectionConfig<C>,
    const LocalListeners extends EventConfig | undefined = EventConfig | undefined,
>(
    config: {
        builderId: string
        extends?: Partials
        injections: ValidateInjections<LocalInjections, ExtractTokensFromTypedPartials<Partials>[number]>
        listeners?: ValidateListeners<LocalListeners, ExtractListenersFromPartials<Partials>>
    },
): TypedBuilderConfig<C, [...ExtractTokensFromTypedPartials<Partials>, ...ExtractTokens<LocalInjections>]> {
    // Runtime Logic:
    // We place local injections FIRST.
    // Since `registerConfig` checks `if (container.isRegistered(entry.token)) return`,
    // the first occurrence of a token wins. This effectively implements the override logic.
    const mergedInjections = [
        ...config.injections as InjectionConfig<C>,
        ...(config.extends || []).flatMap(p => p.injections || []),
    ]

    const mergedListeners = [
        ...(config.extends || []).flatMap(p => p.listeners || []),
        ...(config.listeners as EventConfig || []),
    ]

    return {
        ...config,
        injections: mergedInjections,
        listeners: mergedListeners,
    } as any
}

/**
 * A composable function for setting up and interacting with a dependency injection container
 * based on a `BuilderConfig`. It ensures that dependencies are registered only once per builderId
 * and provides a type-safe `resolve` method.
 *
 * The `resolve` method is strictly type-checked to only allow tokens defined within the `injections`
 * array of the provided `config`.
 *
 * ⚠️ Requires `useContainerProvider()` to be called first at app entry point.
 *
 * @template C The type of the context object that might be passed to value providers.
 * @template Tokens The inferred tuple of allowed tokens from the config.
 * @param config The typed builder configuration object.
 * @param context An optional context object that can be passed to value providers in the injections.
 * @returns An `IUseBuilder` instance with a type-safe `resolve` method.
 *
 * @example
 * ```typescript
 * // main.ts - Entry point
 * import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'
 * useContainerProvider(new TsyringeProvider())
 *
 * // anywhere.ts
 * import { useBuilder } from '@djodjonx/wiredi'
 * const { resolve } = useBuilder(myConfig)
 * const service = resolve(MyService)
 * ```
 */
export function useBuilder<C = null, Tokens extends readonly any[] = []>(
    config: TypedBuilderConfig<C, Tokens>,
    context?: C,
): IUseBuilder<Tokens[number]> {
    const provider = getContainerProvider()

    // Use builderId as a marker to ensure we only register once
    const builderIdToken = Symbol.for(`__builder__${config.builderId}`)

    if (!provider.isRegistered(builderIdToken)) {
        registerConfig(provider, config.injections, context)
        registerEvent(provider, config.listeners)
        provider.registerValue(builderIdToken, config.builderId)
    }

    const resolve = <T>(token: ResolveToken<T> & Tokens[number]): T => provider.resolve<T>(token)

    return {
        resolve,
    }
}
