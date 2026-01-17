import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { TOKENS, ConsoleLogger, __FileLogger, UserCreatedEvent, EmailNotificationListener } from '../fixtures'


// ❌ ERROR: Cross-partial duplication
const errorCrossPartialDuplication = defineBuilderConfig({
    builderId: 'error.cross.partial',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
            listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
        }),
    ],
    injections: [
        { token: TOKENS.Logger, provider: __FileLogger }, // ❌ Already in partial
    ],
    listeners: [
        { event: UserCreatedEvent, listener: EmailNotificationListener }, // ❌ Already in partial
    ],
})

