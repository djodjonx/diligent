/**
 * Type validation tests for WireDI listener duplication detection.
 *
 * This file tests that:
 * 1. Exact duplicates (same event + same listener) ARE detected
 * 2. Different listeners for same event are NOT flagged
 * 3. Same listener for different events are NOT flagged
 * 4. Duplication between partials and config works correctly
 */

import { defineBuilderConfig, definePartialConfig } from '../index'

// ============================================================
// Test Classes - Each class MUST have unique properties to be
// distinguishable by TypeScript's structural type system
// ============================================================

class UserCreatedEvent { readonly __brand = 'UserCreatedEvent' as const }
class ProductCreatedEvent { readonly __brand = 'ProductCreatedEvent' as const }
class OrderPlacedEvent { readonly __brand = 'OrderPlacedEvent' as const }

class EmailListener { readonly __brand = 'EmailListener' as const }
class SmsListener { readonly __brand = 'SmsListener' as const }
class LoggingListener { readonly __brand = 'LoggingListener' as const }

class UserService { readonly __brand = 'UserService' as const }
class ProductService { readonly __brand = 'ProductService' as const }

// ============================================================
// TEST 1: Exact Duplicates SHOULD Error
// ============================================================

// ❌ This SHOULD produce a TypeScript error - exact duplicate
const _configDuplicate = defineBuilderConfig({
    builderId: 'test.duplicate',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: EmailListener }, // Exact duplicate!
    ]
})

// ============================================================
// TEST 2: Different Listeners for Same Event - VALID
// ============================================================

// ✅ This should NOT error - different listeners
const _configDifferentListeners = defineBuilderConfig({
    builderId: 'test.different.listeners',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: SmsListener }, // Different listener, OK!
    ]
})

// ============================================================
// TEST 3: Same Listener for Different Events - VALID
// ============================================================

// ✅ This should NOT error - different events
const _configDifferentEvents = defineBuilderConfig({
    builderId: 'test.different.events',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: LoggingListener },
        { event: ProductCreatedEvent, listener: LoggingListener }, // Different event, OK!
    ]
})

// ============================================================
// TEST 4: Partial + Config Duplicate - SHOULD Error
// ============================================================

const partialWithListener = definePartialConfig({
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener }
    ]
})

// ❌ This SHOULD produce a TypeScript error - already in partial
const _configWithPartialDuplicate = defineBuilderConfig({
    builderId: 'test.partial.duplicate',
    extends: [partialWithListener],
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener }, // Already in partial!
    ]
})

// ============================================================
// TEST 5: Partial + Config Different - VALID
// ============================================================

// ✅ This should NOT error - different from partial
const _configWithPartialDifferent = defineBuilderConfig({
    builderId: 'test.partial.different',
    extends: [partialWithListener],
    injections: [],
    listeners: [
        { event: ProductCreatedEvent, listener: SmsListener }, // Different, OK!
    ]
})

// ============================================================
// TEST 6: Optional Listeners - VALID
// ============================================================

// ✅ This should NOT error - no listeners needed
const _configNoListeners = defineBuilderConfig({
    builderId: 'test.no.listeners',
    injections: [
        { token: UserService },
        { token: ProductService }
    ]
    // No listeners property - OK!
})

// ============================================================
// TEST 7: Multiple Valid Listeners - VALID
// ============================================================

// ✅ This should NOT error - all different pairs
const _configMultipleValid = defineBuilderConfig({
    builderId: 'test.multiple.valid',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: SmsListener },
        { event: UserCreatedEvent, listener: LoggingListener },
        { event: ProductCreatedEvent, listener: EmailListener },
        { event: ProductCreatedEvent, listener: SmsListener },
        { event: OrderPlacedEvent, listener: LoggingListener },
    ]
})

// ============================================================
// Export to avoid unused variable warnings
// ============================================================
export {
    _configDuplicate,
    _configDifferentListeners,
    _configDifferentEvents,
    _configWithPartialDuplicate,
    _configWithPartialDifferent,
    _configNoListeners,
    _configMultipleValid,
}

