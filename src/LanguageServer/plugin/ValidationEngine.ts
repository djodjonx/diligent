import type ts from 'typescript'
import type {
    AnalyzedConfig,
    AnalyzedClass,
    DIValidationError,
    RegisteredProvider,
    RequiredDependency,
    TokenId,
} from './types'
import { ConfigurationAnalyzer } from './ConfigurationAnalyzer'
import { DependencyAnalyzer } from './DependencyAnalyzer'

/**
 * Moteur de validation des dépendances DI
 *
 * Orchestre l'analyse des configurations et des classes pour
 * détecter les dépendances manquantes.
 */
export class ValidationEngine {
    private configAnalyzer: ConfigurationAnalyzer
    private dependencyAnalyzer: DependencyAnalyzer
    private typescript: typeof ts

    constructor(
        typescript: typeof ts,
        private checker: ts.TypeChecker,
        private logger: (msg: string) => void,
    ) {
        this.typescript = typescript
        this.configAnalyzer = new ConfigurationAnalyzer(typescript, checker, logger)
        this.dependencyAnalyzer = new DependencyAnalyzer(typescript, checker, logger)
    }

    /**
     * Valide un programme TypeScript et retourne les erreurs
     */
    validate(program: ts.Program): DIValidationError[] {
        const errors: DIValidationError[] = []

        // Phase 1: Collecter toutes les configurations
        const allConfigs = this.collectAllConfigs(program)
        this.logger(`Trouvé ${allConfigs.size} configuration(s)`)

        // Phase 2: Collecter toutes les classes analysées
        const allClasses = this.collectAllClasses(program)
        this.logger(`Trouvé ${allClasses.size} classe(s) avec dépendances`)

        // Phase 3: Valider chaque configuration de type 'builder'
        for (const [_symbol, config] of allConfigs) {
            if (config.type !== 'builder') continue

            const configErrors = this.validateConfig(config, allConfigs, allClasses)
            errors.push(...configErrors)
        }

        return errors
    }

    /**
     * Collecte toutes les configurations du programme
     */
    private collectAllConfigs(program: ts.Program): Map<ts.Symbol, AnalyzedConfig> {
        const configs = new Map<ts.Symbol, AnalyzedConfig>()

        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile) continue

            const fileConfigs = this.configAnalyzer.analyzeSourceFile(sourceFile)
            for (const config of fileConfigs) {
                if (config.symbol) {
                    configs.set(config.symbol, config)
                }
            }
        }

        return configs
    }

    /**
     * Collecte toutes les classes analysées du programme
     */
    private collectAllClasses(program: ts.Program): Map<ts.Symbol, AnalyzedClass> {
        const classes = new Map<ts.Symbol, AnalyzedClass>()

        for (const sourceFile of program.getSourceFiles()) {
            if (sourceFile.isDeclarationFile) continue

            const fileClasses = this.dependencyAnalyzer.analyzeSourceFile(sourceFile)
            for (const cls of fileClasses) {
                classes.set(cls.symbol, cls)
            }
        }

        return classes
    }

    /**
     * Valide une configuration spécifique
     */
    private validateConfig(
        config: AnalyzedConfig,
        allConfigs: Map<ts.Symbol, AnalyzedConfig>,
        allClasses: Map<ts.Symbol, AnalyzedClass>,
    ): DIValidationError[] {
        const errors: DIValidationError[] = []
        const visitedSet = new Set<ts.Symbol>()

        // Résoudre tous les tokens fournis (avec héritage)
        const providedTokens = this.configAnalyzer.resolveAllProvidedTokens(
            config,
            allConfigs,
            visitedSet,
        )

        this.logger(`Config "${config.builderId}": ${providedTokens.size} token(s) fournis`)

        // Collecter toutes les classes à valider (providers)
        const classesToValidate = this.collectClassesToValidate(config, allConfigs, new Set())

        // Valider chaque classe
        for (const [classSymbol, provider] of classesToValidate) {
            const analyzedClass = allClasses.get(classSymbol)

            if (!analyzedClass) {
                // La classe n'a peut-être pas de dépendances ou n'a pas été analysée
                continue
            }

            const classErrors = this.validateClassDependencies(
                analyzedClass,
                providedTokens,
                provider,
                config,
            )
            errors.push(...classErrors)
        }

        return errors
    }

    /**
     * Collecte toutes les classes qui doivent être validées pour une configuration
     */
    private collectClassesToValidate(
        config: AnalyzedConfig,
        allConfigs: Map<ts.Symbol, AnalyzedConfig>,
        visitedSet: Set<ts.Symbol>,
    ): Map<ts.Symbol, RegisteredProvider> {
        const classes = new Map<ts.Symbol, RegisteredProvider>()

        // Ajouter les providers locaux
        for (const provider of config.localProviders) {
            if (provider.providerClass) {
                classes.set(provider.providerClass, provider)
            }
        }

        // Ajouter les providers des configs parentes
        for (const parentSymbol of config.parentConfigs) {
            const parentConfig = allConfigs.get(parentSymbol)
            if (parentConfig) {
                const parentClasses = this.collectClassesToValidate(
                    parentConfig,
                    allConfigs,
                    visitedSet,
                )
                for (const [classSymbol, provider] of parentClasses) {
                    if (!classes.has(classSymbol)) {
                        classes.set(classSymbol, provider)
                    }
                }
            }
        }

        return classes
    }

    /**
     * Valide les dépendances d'une classe contre les tokens fournis
     */
    private validateClassDependencies(
        analyzedClass: AnalyzedClass,
        providedTokens: Map<TokenId, RegisteredProvider>,
        provider: RegisteredProvider,
        config: AnalyzedConfig,
    ): DIValidationError[] {
        const errors: DIValidationError[] = []

        for (const dependency of analyzedClass.dependencies) {
            const registeredProvider = providedTokens.get(dependency.token.id)

            if (!registeredProvider) {
                // Token non enregistré
                errors.push(this.createMissingDependencyError(
                    analyzedClass,
                    dependency,
                    provider,
                    config,
                ))
            } else {
                // Vérifier la compatibilité de type
                const typeError = this.checkTypeCompatibility(
                    dependency,
                    registeredProvider,
                    analyzedClass,
                    config,
                )
                if (typeError) {
                    errors.push(typeError)
                }
            }
        }

        return errors
    }

    /**
     * Vérifie la compatibilité de type entre le provider enregistré et le type attendu
     */
    private checkTypeCompatibility(
        dependency: RequiredDependency,
        registeredProvider: RegisteredProvider,
        analyzedClass: AnalyzedClass,
        config: AnalyzedConfig,
    ): DIValidationError | null {
        // Skip si pas de type attendu ou pas de type provider
        if (!dependency.expectedType || !registeredProvider.providerType) {
            return null
        }

        // Skip pour les factories et values (type dynamique)
        if (registeredProvider.registrationType === 'factory' ||
            registeredProvider.registrationType === 'value') {
            return null
        }

        const expectedType = dependency.expectedType
        const providerType = registeredProvider.providerType

        // Vérifier si le type du provider est assignable au type attendu
        // On utilise isTypeAssignableTo pour vérifier la compatibilité structurelle
        const isCompatible = this.checker.isTypeAssignableTo(providerType, expectedType)

        if (!isCompatible) {
            const expectedTypeName = this.checker.typeToString(expectedType)
            const providerTypeName = this.checker.typeToString(providerType)
            const className = analyzedClass.name
            const tokenName = dependency.token.displayName
            const paramIndex = dependency.parameterIndex
            const _builderId = config.builderId || config.variableName || 'unknown'

            // L'erreur est reportée sur le provider là où il est ENREGISTRÉ
            // (peut être dans un partial différent du builder)
            const errorNode = registeredProvider.node
            const errorSourceFile = errorNode.getSourceFile() // Fichier où le provider est défini

            return {
                message:
                    `[WireDI] Type mismatch: Provider doesn't match expected type\n\n` +
                    `Service '${className}' expects type '${expectedTypeName}' for '${tokenName}' (parameter #${paramIndex}),\n` +
                    `but the registered provider '${registeredProvider.providerClassName || 'unknown'}' ` +
                    `returns '${providerTypeName}'.\n\n` +
                    `💡 Fix: Register a provider that implements '${expectedTypeName}' or use a factory to adapt the type.`,
                file: errorSourceFile,
                start: errorNode.getStart(errorSourceFile),
                length: errorNode.getWidth(errorSourceFile),
                relatedInformation: [
                    {
                        file: dependency.parameterNode.getSourceFile(),
                        start: dependency.parameterNode.getStart(),
                        length: dependency.parameterNode.getWidth(),
                        message: `The type '${expectedTypeName}' is expected here`,
                    },
                ],
            }
        }

        return null
    }

    /**
     * Crée une erreur de dépendance manquante
     */
    private createMissingDependencyError(
        analyzedClass: AnalyzedClass,
        dependency: RequiredDependency,
        provider: RegisteredProvider,
        config: AnalyzedConfig,
    ): DIValidationError {
        const className = analyzedClass.name
        const tokenName = dependency.token.displayName
        const builderId = config.builderId || config.variableName || 'unknown'
        const paramIndex = dependency.parameterIndex

        // L'erreur est reportée sur le provider dans la configuration
        const errorNode = provider.node
        const errorSourceFile = config.sourceFile

        return {
            message:
                `[WireDI] Missing dependency: '${className}' requires '${tokenName}' but it's not registered\n\n` +
                `The service '${className}' expects '${tokenName}' as parameter #${paramIndex}, ` +
                `but this token is not provided in the '${builderId}' configuration or its partials.\n\n` +
                `💡 Fix: Add '{ token: ${tokenName} }' to your injections array.`,
            file: errorSourceFile,
            start: errorNode.getStart(errorSourceFile),
            length: errorNode.getWidth(errorSourceFile),
            relatedInformation: [
                {
                    file: dependency.parameterNode.getSourceFile(),
                    start: dependency.parameterNode.getStart(),
                    length: dependency.parameterNode.getWidth(),
                    message: `The dependency '${tokenName}' is required here`,
                },
            ],
        }
    }

    /**
     * Convertit les erreurs de validation en diagnostics TypeScript
     */
    convertToDiagnostics(errors: DIValidationError[]): ts.Diagnostic[] {
        const ts = this.typescript

        return errors.map(error => {
            const diagnostic: ts.Diagnostic = {
                file: error.file,
                start: error.start,
                length: error.length,
                messageText: error.message,
                category: ts.DiagnosticCategory.Error,
                code: 90001, // Code arbitraire unique au plugin
                source: 'di-validator',
            }

            if (error.relatedInformation && error.relatedInformation.length > 0) {
                diagnostic.relatedInformation = error.relatedInformation.map(info => ({
                    file: info.file,
                    start: info.start,
                    length: info.length,
                    messageText: info.message,
                    category: ts.DiagnosticCategory.Message,
                    code: 90001,
                }))
            }

            return diagnostic
        })
    }
}
