import { defineBuilderConfig } from '../../../index'
import { TOKENS, __WrongLogger } from '../fixtures'


// ❌ ERROR: Type mismatch - provider doesn't implement interface
// Note: This is detected by the LSP plugin, not by TypeScript alone
const errorTypeMismatch = defineBuilderConfig({
    builderId: 'error.type.mismatch',
    injections: [
        { token: TOKENS.Logger, provider: __WrongLogger }, // ❌ _WrongLogger doesn't implement LoggerInterface
        // Expected LSP error: Type incompatible
    ],
})

