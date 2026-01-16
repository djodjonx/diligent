# Test IDE - Mini projet DDD

Ce dossier contient un mini-projet pour tester le plugin DI Validator dans l'IDE.

## 🚀 Comment tester dans l'IDE

### Étape 1 : Préparer le plugin

```bash
# Depuis la racine du projet WireDI
cd /Users/jonathan/projects/WireDI

# Compiler le plugin
pnpm build:plugin
```

### Étape 2 : Installer les dépendances du test

```bash
cd test/ide
npm install
```

### Étape 3 : Ouvrir dans l'IDE

#### VS Code

1. **Ouvrir le dossier `test/ide` comme workspace séparé** :
   ```bash
   code /Users/jonathan/projects/WireDI/test/ide
   ```

2. **Sélectionner la version TypeScript du workspace** :
   - `Cmd+Shift+P` → "TypeScript: Select TypeScript Version"
   - Choisir "Use Workspace Version"

3. **Redémarrer le serveur TypeScript** :
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"

#### IntelliJ IDEA / WebStorm

1. **Ouvrir le dossier `test/ide` comme nouveau projet**

2. **Configurer TypeScript** :
   - Settings → Languages & Frameworks → TypeScript
   - Cocher "TypeScript Language Service"
   - S'assurer que "TypeScript" pointe vers `node_modules/typescript`

3. **Redémarrer l'IDE**

### Étape 4 : Tester une erreur

1. Ouvrir `Presentation/builder/myBuilder/partials/repositories.ts`

2. Commenter la ligne `ProductRepository` :
   ```typescript
   export const repositoriesPartial = definePartialConfig({
       injections: [
           { token: TOKENS.UserRepository, provider: InMemoryUserRepository },
           // { token: TOKENS.ProductRepository, provider: InMemoryProductRepository },
       ],
       listeners: [],
   })
   ```

3. **Vérifier que l'erreur apparaît** dans :
   - `Application/UseCase/ListProductsUseCase.ts` (paramètre du constructeur)
   - Ou `Presentation/builder/myBuilder/index.ts` (sur l'enregistrement)

### Alternative : Test via CLI

Si le plugin IDE ne fonctionne pas, utilisez le CLI :

```bash
# Depuis la racine du projet
pnpm validate:di test/ide/Presentation/builder/myBuilder/index.ts test/ide/Presentation/builder/myBuilder/partials/*.ts
```

## Architecture

```
test/ide/
├── Domain/                          # Couche Domaine
│   ├── Entity/                      # Entités métier
│   │   ├── User.ts
│   │   └── Product.ts
│   ├── Repository/                  # Interfaces des repositories
│   │   ├── UserRepositoryInterface.ts
│   │   └── ProductRepositoryInterface.ts
│   └── Service/                     # Interfaces des services
│       └── LoggerInterface.ts
│
├── Application/                     # Couche Application
│   └── UseCase/                     # Cas d'utilisation
│       ├── GetUserByIdUseCase.ts
│       └── ListProductsUseCase.ts
│
├── Infrastructure/                  # Couche Infrastructure
│   ├── Repository/                  # Implémentations des repositories
│   │   ├── InMemoryUserRepository.ts
│   │   └── InMemoryProductRepository.ts
│   └── Logger/                      # Implémentation du logger
│       └── ConsoleLogger.ts
│
├── Presentation/                    # Couche Présentation
│   ├── builder/                     # Configuration DI
│   │   └── myBuilder/
│   │       ├── index.ts             # Builder principal + useMyBuilder()
│   │       ├── tokens.ts            # Tokens d'injection
│   │       └── partials/            # Configurations partielles
│   │           ├── commonServices.ts
│   │           └── repositories.ts
│   │
│   ├── composables/                 # Composables Vue.js style
│   │   ├── useUser.ts
│   │   └── useProducts.ts
│   │
│   └── __tests__/                   # Tests avec erreurs intentionnelles
│       └── errorCase.ts
│
├── shared/                          # Utilitaires partagés
│   └── vue-mock.ts                  # Mock Vue.js reactivity
│
└── tsconfig.json                    # Config TypeScript avec plugin DI
```

## Comment tester

### Via CLI

```bash
# Valider la configuration complète (devrait passer)
pnpm validate:di test/ide/Presentation/builder/myBuilder/index.ts test/ide/Presentation/builder/myBuilder/partials/*.ts

# Valider le fichier avec erreurs (devrait échouer)
pnpm validate:di test/ide/Presentation/__tests__/errorCase.ts
```

### Via IDE

1. Ouvrir ce dossier comme projet séparé dans l'IDE
2. Le `tsconfig.json` inclut le plugin DI Validator
3. Les erreurs devraient apparaître dans `Presentation/__tests__/errorCase.ts`

## Cas de test

### ✅ Configuration correcte (`myBuilder/index.ts`)

Le builder principal étend les partials `commonServicesPartial` et `repositoriesPartial` qui fournissent toutes les dépendances nécessaires :
- `TOKENS.Logger` → `ConsoleLogger`
- `TOKENS.UserRepository` → `InMemoryUserRepository`
- `TOKENS.ProductRepository` → `InMemoryProductRepository`

### ❌ Configuration avec erreurs (`__tests__/errorCase.ts`)

Ce fichier définit un builder incomplet sans les partials :
- `TOKENS.Logger` → **non enregistré** → Erreur
- `TOKENS.UserRepository` → **non enregistré** → Erreur

## Utilisation des composables

```typescript
import { useUser } from './Presentation/composables/useUser'
import { useProducts } from './Presentation/composables/useProducts'

// Dans un composant Vue
const { user, isLoading, fetchUser } = useUser()
const { products, fetchProducts } = useProducts()

// Charger les données
await fetchUser('user-123')
await fetchProducts()
```

