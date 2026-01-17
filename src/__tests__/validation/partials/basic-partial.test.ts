import { definePartialConfig } from '../../../index'
import { TOKENS, ConsoleLogger } from '../fixtures'

// ✅ Partial with provider
export const partialBasic = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})
