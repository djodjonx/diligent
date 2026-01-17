import { defineBuilderConfig } from '../../../index'
import { TOKENS, ConsoleLogger, __FileLogger } from '../fixtures'


// ❌ ERROR: Duplicate token in same array
const errorDuplicateToken = defineBuilderConfig({
    builderId: 'error.duplicate.token',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, provider: __FileLogger }, // ❌ Duplicate!
        // Expected error: 'provider' does not exist in type { error: "..."; token: ...; hint: "..." }
    ],
})

// ❌ ERROR: Duplicate token in same array (from injection-validation)
const configDuplicateToken = defineBuilderConfig({
    builderId: 'test.error.duplicate',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ❌ Error: Duplicate token
    ],
})

