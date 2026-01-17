# DI Validator Plugin

Plugin TypeScript Language Service pour valider les injections de dépendances avec `tsyringe`.

## Fonctionnalités

- ✅ Analyse statique des configurations `defineBuilderConfig` et `definePartialConfig`
- ✅ Détection des dépendances de constructeur non enregistrées
- ✅ Vérification de compatibilité de type entre providers et interfaces attendues
- ✅ Support de l'héritage via `extends`
- ✅ Support des décorateurs `@inject(token)`
- ✅ Support de l'injection par type (tsyringe emitDecoratorMetadata)
- ✅ Localisation précise des erreurs (dans le fichier où le provider est défini)

## Installation

### Via npm (recommandé)

```bash
npm install @djodjonx/wiredi
# ou
pnpm add @djodjonx/wiredi
```

### Configuration TypeScript

Ajoutez le plugin dans votre `tsconfig.json` :

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@djodjonx/wiredi/plugin",
        "verbose": true
      }
    ]
  }
}
```

> **Note**: L'option `verbose` est optionnelle et active les logs de debug.

### Configuration IDE

#### VS Code

1. Ajoutez dans `.vscode/settings.json` :

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

2. Ouvrez la palette de commandes (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Tapez "TypeScript: Select TypeScript Version"
4. Sélectionnez **"Use Workspace Version"**

#### IntelliJ IDEA / WebStorm

1. Ouvrez **Settings** → **Languages & Frameworks** → **TypeScript**
2. Cochez **Use TypeScript Language Service**
3. Assurez-vous que le chemin TypeScript pointe vers `node_modules/typescript`
4. Redémarrez l'IDE

#### Neovim (avec nvim-lspconfig)

Le plugin fonctionne automatiquement avec `tsserver` si votre `tsconfig.json` est correctement configuré.

## Erreurs détectées

### Dépendance non enregistrée

```typescript
class UserService {
    constructor(
        private logger: Logger, // ❌ Error: Logger non enregistré
    ) {}
}

const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: UserService }, // UserService nécessite Logger
    ],
    // listeners is optional
})
```

**Solution :** Ajouter `Logger` à la configuration :

```typescript
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: Logger },      // ✅ Ajouter Logger
        { token: UserService },
    ],
    // listeners is optional
})
```

### Token @inject non enregistré

```typescript
const MY_TOKEN = Symbol('MY_TOKEN')

class OrderService {
    constructor(
        @inject(MY_TOKEN) private dep: unknown, // ❌ Error: MY_TOKEN non enregistré
    ) {}
}
```

**Solution :** Enregistrer le token avec un provider :

```typescript
const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: MY_TOKEN, provider: MyProvider }, // ✅ Ajouter le token
        { token: OrderService },
    ],
    // listeners is optional
})
```

### Type incompatible

```typescript
interface ProductRepositoryInterface {
    findById(id: string): Promise<Product>
    findAll(): Promise<Product[]>
}

// ❌ ConsoleLogger n'implémente pas ProductRepositoryInterface
@injectable()
class ConsoleLogger {
    log(msg: string) { console.log(msg) }
}

const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.ProductRepository, provider: ConsoleLogger }, // ❌ Type mismatch!
    ],
    // listeners is optional
})
```

**Solution :** Utiliser un provider qui implémente l'interface attendue :

```typescript
@injectable()
class InMemoryProductRepository implements ProductRepositoryInterface {
    async findById(id: string) { /* ... */ }
    async findAll() { /* ... */ }
}

const config = defineBuilderConfig({
    builderId: 'app',
    injections: [
        { token: TOKENS.ProductRepository, provider: InMemoryProductRepository }, // ✅
    ],
    // listeners is optional
})
```

> **Note**: L'erreur est reportée sur le provider dans le fichier où il est défini, même si c'est dans un partial séparé.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verbose` | `boolean` | `false` | Active les logs de debug dans le language service |

## Architecture

```
src/LanguageServer/plugin/
├── index.ts                 # Point d'entrée du plugin TS
├── types.ts                 # Types et interfaces
├── ValidationEngine.ts      # Orchestrateur de validation
├── ConfigurationAnalyzer.ts # Parse defineBuilderConfig/definePartialConfig
├── DependencyAnalyzer.ts    # Analyse les constructeurs des classes
├── TokenNormalizer.ts       # Normalisation des tokens (Symbol, Class, String)
└── package.json             # Config CommonJS pour le plugin
```

## Limitations

- Les factories (`{ token, factory: (container) => ... }`) ne sont pas analysées (résolution dynamique)
- Les values (`{ token, value: ... }`) ne sont pas validées pour la compatibilité de type
- Les tokens définis dans des fichiers externes non importés ne sont pas détectés
- Le plugin nécessite que les configurations soient dans des fichiers `.ts` (pas `.json`)

## Troubleshooting

### Le plugin ne s'active pas

1. **Vérifiez que TypeScript utilise la version workspace**
   - VS Code : Regardez dans la barre de statut (en bas) la version TypeScript utilisée
   - Relancez "TypeScript: Select TypeScript Version" → "Use Workspace Version"

2. **Vérifiez la configuration `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "plugins": [{ "name": "@djodjonx/wiredi/plugin" }]
     }
   }
   ```

3. **Redémarrez le serveur TypeScript**
   - VS Code : `Cmd+Shift+P` → "TypeScript: Restart TS Server"
   - IntelliJ : Redémarrez l'IDE ou invalidez les caches

### Les erreurs n'apparaissent pas

1. **Vérifiez que le fichier est inclus dans le projet TypeScript**
   - Le fichier doit être couvert par `include` dans `tsconfig.json`
   - Les fichiers `node_modules` sont ignorés

2. **Activez le mode verbose** pour voir les logs :
   ```json
   { "name": "@djodjonx/wiredi/plugin", "verbose": true }
   ```
   - VS Code : Ouvrez "Output" → "TypeScript" pour voir les logs
   - IntelliJ : Regardez les logs dans "Help" → "Diagnostic Tools" → "Debug Log Settings"

### Erreur "Cannot find module '@djodjonx/wiredi/plugin'"

Assurez-vous que `@djodjonx/wiredi` est installé :
```bash
npm install @djodjonx/wiredi
# ou
pnpm add @djodjonx/wiredi
```

