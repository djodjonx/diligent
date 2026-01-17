import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { TOKENS, ConsoleLogger, UserRepository, ProductCreatedEvent, SmsListener, EmailListener } from '../fixtures'
import { partialBasic } from './basic-partial.test'

// ✅ Config extending partial with different tokens
export const configExtendsPartialDifferent = defineBuilderConfig({
    builderId: 'valid.partial.different',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
        }),
    ],
    injections: [
        { token: TOKENS.UserRepository, provider: UserRepository },
    ],
})

// ✅ Partial with different token in config - should be valid
// Note: We're reusing partialBasic from another file to test cross-file
export const configValidPartialDifferent = defineBuilderConfig({
    builderId: 'test.valid.partial',
    extends: [partialBasic],
    injections: [
        { token: TOKENS.UserRepository, provider: UserRepository },
    ],
})

const partialWithListener = definePartialConfig({
    listeners: [
        { event: ProductCreatedEvent, listener: EmailListener }
    ]
})

// ✅ This should NOT error - different from partial
export const _configWithPartialDifferent = defineBuilderConfig({
    builderId: 'test.partial.different.listeners',
    extends: [partialWithListener],
    injections: [],
    listeners: [
        { event: ProductCreatedEvent, listener: SmsListener }, // Different, OK!
    ]
})
