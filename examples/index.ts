/**
 * WireDI Examples Index
 *
 * This file provides exports and re-exports for all example implementations.
 * Use this as a quick reference or import examples directly in your tests.
 *
 * @module examples
 */

// ============================================================
// DI Container Providers (Built-in to WireDI)
// ============================================================

/**
 * Built-in DI Container Providers
 * These are exported from the main package
 */
export type {
    TsyringeProvider,
    AwilixProvider,
    InversifyProvider,
} from '../src/Provider/adapters/TsyringeProvider'

// ============================================================
// Event Dispatcher Provider Examples
// ============================================================

/**
 * Example Event Dispatcher Implementations
 * These are reference implementations you can adapt
 */
export { RxJsEventDispatcherProvider } from './event-dispatcher/RxJsEventDispatcherProvider'
export { EventEmitterDispatcherProvider } from './event-dispatcher/EventEmitterDispatcherProvider'
export {
    AsyncPriorityEventDispatcherProvider,
    ListenerPriority,
} from './event-dispatcher/AsyncPriorityEventDispatcherProvider'

// ============================================================
// Example Exports for Testing/Reference
// ============================================================

/**
 * Example events and listeners from RxJS example
 */
export {
    UserCreatedEvent,
    UserCreatedListener,
    setupAdvancedEventHandling,
} from './event-dispatcher/RxJsEventDispatcherProvider'

/**
 * Example events and listeners from EventEmitter example
 */
export {
    OrderPlacedEvent,
    OrderPlacedListener,
    setupAdvancedHandling,
} from './event-dispatcher/EventEmitterDispatcherProvider'

/**
 * Example events and listeners from AsyncPriority example
 */
export {
    PaymentProcessedEvent,
    FraudDetectionListener,
    PaymentConfirmationListener,
    AnalyticsListener,
    ReportGeneratorListener,
    setupPriorityHandling,
} from './event-dispatcher/AsyncPriorityEventDispatcherProvider'

// ============================================================
// Type Exports
// ============================================================

export type {
    EventDispatcherProviderOptions,
} from './event-dispatcher/EventEmitterDispatcherProvider'

export type {
    AsyncPriorityEventDispatcherOptions,
} from './event-dispatcher/AsyncPriorityEventDispatcherProvider'

/**
 * @example Import specific provider
 * ```typescript
 * import { RxJsEventDispatcherProvider } from 'WireDI/examples'
 * ```
 *
 * @example Import all examples
 * ```typescript
 * import * as Examples from 'WireDI/examples'
 * ```
 */

