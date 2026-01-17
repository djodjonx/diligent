import { defineBuilderConfig } from '../../../index'
import { UserService, ProductService } from '../fixtures'


// ❌ ERROR: Duplicate class token
const errorDuplicateClassToken = defineBuilderConfig({
    builderId: 'error.duplicate.class',
    injections: [
        { token: UserService },
        { token: UserService }, // ❌ Duplicate!
        // Expected error: Type error on second entry
    ],
})

// ❌ ERROR: Duplicate class token (from injection-validation)
const configDuplicateClass = defineBuilderConfig({
    builderId: 'test.error.class',
    injections: [
        { token: ProductService },
        { token: ProductService }, // ❌ Error: Duplicate class token
    ],
})

