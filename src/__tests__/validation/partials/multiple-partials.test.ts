import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { TOKENS, ConsoleLogger, UserRepository, UserService } from '../fixtures'

// ✅ Multiple partials
export const multiplePartials = defineBuilderConfig({
    builderId: 'valid.multiple.partials',
    extends: [
        definePartialConfig({
            injections: [{ token: TOKENS.Logger, provider: ConsoleLogger }],
        }),
        definePartialConfig({
            injections: [{ token: TOKENS.UserRepository, provider: UserRepository }],
        }),
    ],
    injections: [
        { token: UserService },
    ],
})
