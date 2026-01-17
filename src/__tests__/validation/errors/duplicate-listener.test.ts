import { defineBuilderConfig } from '../../../index'
import { UserCreatedEvent, EmailNotificationListener, EmailListener } from '../fixtures'


// ❌ ERROR: Duplicate listener (same event + same listener)
const errorDuplicateListener = defineBuilderConfig({
    builderId: 'error.duplicate.listener',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener },
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Duplicate!
        // Expected error: Type missing properties 'error', 'hint'
    ],
})

// ❌ This SHOULD produce a TypeScript error - exact duplicate
const _configDuplicate = defineBuilderConfig({
    builderId: 'test.duplicate',
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener },
        { event: UserCreatedEvent, listener: EmailListener }, // Exact duplicate!
    ]
})

