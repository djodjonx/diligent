import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { UserCreatedEvent, EmailNotificationListener, EmailListener } from '../fixtures'

const partialWithListener = definePartialConfig({
    listeners: [
        { event: UserCreatedEvent, listener: EmailListener }
    ]
})


// ❌ ERROR: Listener already in partial
const errorListenerInPartial = defineBuilderConfig({
    builderId: 'error.listener.partial',
    extends: [
        definePartialConfig({
            listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
        }),
    ],
    injections: [],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Already in partial!
        // Expected error: Type missing properties 'error', 'hint'
    ],
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

