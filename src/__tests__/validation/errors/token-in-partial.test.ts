import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { TOKENS, ConsoleLogger, __FileLogger } from '../fixtures'
import { partialBasic } from '../partials/basic-partial.test'


// ❌ ERROR: Token already in partial
const errorTokenInPartial = defineBuilderConfig({
    builderId: 'error.token.partial',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
        }),
    ],
    injections: [
        { token: TOKENS.Logger, provider: __FileLogger }, // ❌ Already in partial!
        // Expected error: 'provider' does not exist in type { error: "..."; token: ...; hint: "..." }
    ],
})

// ❌ ERROR: Token already in partial (from injection-validation)
const configDuplicateFromPartial = defineBuilderConfig({
    builderId: 'test.error.partial',
    extends: [partialBasic],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ❌ Error: Already in partial
    ],
})

