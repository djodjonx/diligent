import type ts from 'typescript'
import type { AnalyzedConfig, RegisteredProvider, TokenId } from './types'
import { TokenNormalizer } from './TokenNormalizer'

/**
 * Analyseur des configurations DI (defineBuilderConfig / definePartialConfig)
 *
 * Effectue une analyse sémantique profonde en utilisant le TypeChecker
 * pour résoudre correctement les imports et les références.
 */
export class ConfigurationAnalyzer {
    private tokenNormalizer: TokenNormalizer
    private typescript: typeof ts

    constructor(
        typescript: typeof ts,
        private checker: ts.TypeChecker,
        private logger: (msg: string) => void,
    ) {
        this.typescript = typescript
        this.tokenNormalizer = new TokenNormalizer(typescript, checker)
    }

    /**
     * Analyse un fichier source pour trouver toutes les configurations DI
     */
    analyzeSourceFile(sourceFile: ts.SourceFile): AnalyzedConfig[] {
        const configs: AnalyzedConfig[] = []
        this.visitNode(sourceFile, sourceFile, configs)
        return configs
    }

    private visitNode(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        configs: AnalyzedConfig[],
    ): void {
        const ts = this.typescript

        // Chercher les déclarations de variables avec defineBuilderConfig ou definePartialConfig
        if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
                    const config = this.analyzeCallExpression(
                        declaration.initializer,
                        sourceFile,
                        ts.isIdentifier(declaration.name) ? declaration.name.text : undefined,
                        declaration,
                    )
                    if (config) {
                        configs.push(config)
                    }
                }
            }
        }

        // Chercher les exports par défaut: export default defineBuilderConfig(...)
        if (ts.isExportAssignment(node) && node.expression && ts.isCallExpression(node.expression)) {
            const config = this.analyzeCallExpression(node.expression, sourceFile)
            if (config) {
                configs.push(config)
            }
        }

        ts.forEachChild(node, (child: ts.Node) => this.visitNode(child, sourceFile, configs))
    }

    /**
     * Analyse un appel de fonction pour déterminer si c'est une config DI
     */
    private analyzeCallExpression(
        node: ts.CallExpression,
        sourceFile: ts.SourceFile,
        variableName?: string,
        declaration?: ts.VariableDeclaration,
    ): AnalyzedConfig | null {
        const ts = this.typescript
        const functionName = this.getCalledFunctionName(node)

        if (functionName !== 'defineBuilderConfig' && functionName !== 'definePartialConfig') {
            return null
        }

        // Vérifier sémantiquement que c'est bien la fonction de notre librairie
        if (!this.isFromContainerBuilder(node)) {
            this.logger(`Fonction ${functionName} trouvée mais pas de WireDI`)
            return null
        }

        const isBuilder = functionName === 'defineBuilderConfig'
        const arg = node.arguments[0]

        if (!arg || !ts.isObjectLiteralExpression(arg)) {
            this.logger(`Argument de ${functionName} n'est pas un objet littéral`)
            return null
        }

        const config: AnalyzedConfig = {
            type: isBuilder ? 'builder' : 'partial',
            variableName,
            localProviders: [],
            providedTokens: new Map(),
            parentConfigs: [],
            callNode: node,
            sourceFile,
        }

        // Obtenir le symbole de la variable si disponible
        if (declaration) {
            const symbol = this.checker.getSymbolAtLocation(declaration.name)
            if (symbol) {
                config.symbol = symbol
            }
        }

        // Parser les propriétés de l'objet de configuration
        for (const prop of arg.properties) {
            if (!ts.isPropertyAssignment(prop)) continue

            const propName = this.getPropertyName(prop)

            if (propName === 'builderId' && ts.isStringLiteral(prop.initializer)) {
                config.builderId = prop.initializer.text
            }

            if (propName === 'injections' && ts.isArrayLiteralExpression(prop.initializer)) {
                this.parseInjections(prop.initializer, sourceFile, config)
            }

            if (propName === 'extends' && ts.isArrayLiteralExpression(prop.initializer)) {
                this.parseExtends(prop.initializer, sourceFile, config)
            }
        }

        return config
    }

    /**
     * Vérifie si l'appel de fonction provient de WireDI
     * Utilise le TypeChecker pour une vérification sémantique
     */
    private isFromContainerBuilder(node: ts.CallExpression): boolean {
        const signature = this.checker.getResolvedSignature(node)
        if (!signature) {
            // Si pas de signature, accepter quand même si le nom de fonction correspond
            // Cela permet de fonctionner même quand le type checker n'a pas toutes les infos
            return true
        }

        const declaration = signature.getDeclaration()
        if (!declaration) {
            return true // Accepter par défaut
        }

        const declSourceFile = declaration.getSourceFile()
        const fileName = declSourceFile.fileName

        // Vérifier si le fichier provient de WireDI ou du projet courant
        return fileName.includes('WireDI') ||
               fileName.includes('/src/index') ||
               !fileName.includes('node_modules')
    }

    /**
     * Obtient le nom de la fonction appelée
     */
    private getCalledFunctionName(node: ts.CallExpression): string | null {
        const ts = this.typescript

        if (ts.isIdentifier(node.expression)) {
            return node.expression.text
        }

        if (ts.isPropertyAccessExpression(node.expression)) {
            return node.expression.name.text
        }

        return null
    }

    /**
     * Obtient le nom d'une propriété
     */
    private getPropertyName(prop: ts.PropertyAssignment): string {
        const ts = this.typescript

        if (ts.isIdentifier(prop.name)) {
            return prop.name.text
        }

        if (ts.isStringLiteral(prop.name)) {
            return prop.name.text
        }

        return ''
    }

    /**
     * Parse le tableau injections de la configuration
     */
    private parseInjections(
        array: ts.ArrayLiteralExpression,
        sourceFile: ts.SourceFile,
        config: AnalyzedConfig,
    ): void {
        const ts = this.typescript

        for (const element of array.elements) {
            if (!ts.isObjectLiteralExpression(element)) continue

            const provider = this.parseInjectionEntry(element, sourceFile)
            if (provider) {
                config.localProviders.push(provider)
                config.providedTokens.set(provider.token.id, provider)
            }
        }
    }

    /**
     * Parse une entrée d'injection individuelle
     */
    private parseInjectionEntry(
        element: ts.ObjectLiteralExpression,
        sourceFile: ts.SourceFile,
    ): RegisteredProvider | null {
        const ts = this.typescript

        let tokenNode: ts.Node | null = null
        let providerNode: ts.Node | null = null
        let hasValue = false
        let hasFactory = false

        for (const prop of element.properties) {
            if (!ts.isPropertyAssignment(prop)) continue

            const propName = this.getPropertyName(prop)

            if (propName === 'token') {
                tokenNode = prop.initializer
            }

            if (propName === 'provider') {
                providerNode = prop.initializer
            }

            if (propName === 'value') {
                hasValue = true
            }

            if (propName === 'factory') {
                hasFactory = true
            }
        }

        if (!tokenNode) return null

        const token = this.tokenNormalizer.normalize(tokenNode, sourceFile)
        if (!token) {
            this.logger(`Impossible de normaliser le token: ${tokenNode.getText(sourceFile)}`)
            return null
        }

        // Déterminer le type d'enregistrement
        let registrationType: RegisteredProvider['registrationType'] = 'class'
        let providerClass: ts.Symbol | undefined
        let providerClassName: string | undefined

        if (hasFactory) {
            registrationType = 'factory'
        } else if (hasValue) {
            registrationType = 'value'
        } else if (providerNode) {
            registrationType = 'symbol-provider'

            // Résoudre la classe provider
            if (ts.isIdentifier(providerNode)) {
                const symbol = this.checker.getSymbolAtLocation(providerNode)
                if (symbol) {
                    providerClass = this.resolveAlias(symbol)
                    providerClassName = providerNode.text
                }
            }
        } else {
            // Token est directement la classe
            if (ts.isIdentifier(tokenNode)) {
                const symbol = this.checker.getSymbolAtLocation(tokenNode)
                if (symbol) {
                    providerClass = this.resolveAlias(symbol)
                    providerClassName = tokenNode.text
                }
            }
        }

        // Capturer le type d'INSTANCE du provider pour la vérification de compatibilité
        // On veut le type de l'instance, pas le type du constructeur (typeof Class)
        let providerType: ts.Type | undefined
        if (providerClass) {
            const declaration = providerClass.valueDeclaration || providerClass.declarations?.[0]
            if (declaration) {
                const constructorType = this.checker.getTypeOfSymbolAtLocation(providerClass, declaration)
                // Obtenir le type d'instance via les signatures de construction
                const constructSignatures = constructorType.getConstructSignatures()
                if (constructSignatures.length > 0) {
                    // Le type de retour de la signature de construction est le type d'instance
                    providerType = constructSignatures[0].getReturnType()
                } else {
                    // Fallback: utiliser le type directement (peut être une interface/type)
                    providerType = constructorType
                }
            }
        }

        return {
            token,
            providerClass,
            providerClassName,
            registrationType,
            node: element,
            providerType,
        }
    }

    /**
     * Parse le tableau extends de la configuration
     */
    private parseExtends(
        array: ts.ArrayLiteralExpression,
        _sourceFile: ts.SourceFile,
        config: AnalyzedConfig,
    ): void {
        const ts = this.typescript

        for (const element of array.elements) {
            if (ts.isIdentifier(element)) {
                const symbol = this.checker.getSymbolAtLocation(element)
                if (symbol) {
                    const resolved = this.resolveAlias(symbol)
                    if (resolved) {
                        config.parentConfigs.push(resolved)
                    }
                }
            }
        }
    }

    /**
     * Résout l'ensemble complet des tokens fournis (avec héritage)
     * Gère la détection de cycles
     */
    resolveAllProvidedTokens(
        config: AnalyzedConfig,
        allConfigs: Map<ts.Symbol, AnalyzedConfig>,
        visitedSet: Set<ts.Symbol>,
    ): Map<TokenId, RegisteredProvider> {
        // Vérifier les cycles
        if (config.symbol && visitedSet.has(config.symbol)) {
            this.logger(`Cycle détecté dans la configuration: ${config.variableName}`)
            return config.providedTokens
        }

        if (config.symbol) {
            visitedSet.add(config.symbol)
        }

        // Commencer avec les tokens locaux
        const allTokens = new Map(config.providedTokens)

        // Ajouter les tokens des parents
        for (const parentSymbol of config.parentConfigs) {
            const parentConfig = allConfigs.get(parentSymbol)
            if (parentConfig) {
                const parentTokens = this.resolveAllProvidedTokens(
                    parentConfig,
                    allConfigs,
                    visitedSet,
                )

                // Fusionner (les tokens locaux ont priorité)
                for (const [tokenId, provider] of parentTokens) {
                    if (!allTokens.has(tokenId)) {
                        allTokens.set(tokenId, provider)
                    }
                }
            }
        }

        return allTokens
    }

    /**
     * Résout un alias d'import
     */
    private resolveAlias(symbol: ts.Symbol): ts.Symbol {
        const ts = this.typescript

        let current = symbol
        while (current.flags & ts.SymbolFlags.Alias) {
            try {
                current = this.checker.getAliasedSymbol(current)
            } catch {
                return current
            }
        }

        return current
    }
}
