import { defineBuilderConfig } from '../../../index'
import { TOKENS, ConsoleLogger, __FileLogger, UserService } from '../fixtures'


// ❌ ERROR: Multiple duplicates (complex case)
const errorMultipleDuplicates = defineBuilderConfig({
    builderId: 'error.multiple',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, factory: () => new __FileLogger() }, // ❌ Duplicate
        { token: UserService },
        { token: UserService }, // ❌ Duplicate
    ],
})

// ❌ ERROR: Mixed duplicates (provider + factory)
const configMixedDuplicate = defineBuilderConfig({
    builderId: 'test.error.mixed',
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
        { token: TOKENS.Logger, factory: () => new ConsoleLogger() }, // ❌ Error: Duplicate
    ],
})

