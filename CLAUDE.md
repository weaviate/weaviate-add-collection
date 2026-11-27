# Weaviate Add Collection — Claude Notes

## Project Overview
React component library + demo app for configuring Weaviate collection schemas.
Entry point (library): `index.js` — exports Collection, constants, and utilities.
Demo app entry: `src/App.jsx` → renders in `dist/index.html` (built via Vite).

## Key Architecture

### Component Hierarchy
```
App.jsx
├── version input (weaviateVersion state)
├── JsonSchemaImport.jsx    — file upload + textarea import
└── Collection.jsx          — root schema editor
    ├── VersionProvider     — wraps everything, passes version to context
    ├── PropertySection / PropertyItem / NestedPropertySection
    ├── VectorConfigSection / VectorConfigItem / ModuleConfigForm / ModuleConfigField
    ├── GenerativeConfigSection
    ├── RerankerConfigSection
    ├── InvertedIndexConfigSection
    ├── MultiTenancyConfigSection
    └── ReplicationConfigSection
```

### Version-Based Feature Gating
All logic lives in three files:

| File | Purpose |
|------|---------|
| `src/utils/versionUtils.js` | `parseVersion()`, `isVersionAtLeast()` — pure semver helpers |
| `src/constants/versionFeatures.js` | Central registry: `featureId → minVersion` |
| `src/context/VersionContext.jsx` | `VersionProvider`, `useVersionFeature(id)`, `useVersionFilteredOptions(opts)`, `VersionGated` component |

**To add a new gated field:**
1. Add an entry to `src/constants/versionFeatures.js`:
   ```js
   myNewFeature: '1.29.0',
   ```
2. Wrap the field in the component:
   ```jsx
   <VersionGated featureId="myNewFeature">
     <div className="field">...</div>
   </VersionGated>
   ```

**To add a new gated dropdown option:**
1. Add an entry to `src/constants/versionFeatures.js`.
2. Add `featureId` to the option object in the options array:
   ```js
   { value: 'myOption', label: 'My Option', featureId: 'myNewFeature' }
   ```
3. Use `useVersionFilteredOptions` in the component:
   ```js
   const filtered = useVersionFilteredOptions(myOptionsArray)
   // use filtered in the <select>
   ```
   Unavailable options are kept but rendered with `disabled` and `"— Requires Weaviate ≥ X.Y.Z"` appended to the label.

**To gate an entire collapsible section:**
1. Add an entry to `src/constants/versionFeatures.js`.
2. Replace the `<div className="collapsible">...</div>` block with `VersionGatedSection`:
   ```jsx
   import { VersionGatedSection } from '../context/VersionContext'

   <VersionGatedSection
     featureId="myNewFeature"
     title="Section Title"
     isOpen={openState}
     onToggle={() => setOpenState(s => !s)}
   >
     <MySection ... />
   </VersionGatedSection>
   ```
   When unavailable, the toggle button is shown disabled with `"— Requires Weaviate ≥ X.Y.Z"` in the title. Panel content is not rendered.

**Tooltip CSS** is in `src/styles.css` under `/* ── Version-gated tooltip */`.
The `data-version-tooltip` attribute drives the CSS `::after` tooltip — no JS library needed.

### Constants & Options
- `src/constants/options.js` — tokenization options, data types, index types (with `featureId` on `dynamic`), module lists
- `src/constants/versionFeatures.js` — version gate registry (edit here to change gating)

### Utilities
- `src/utils/collectionNameValidator.js` — `validateCollectionName`, `sanitizeCollectionName`
- `src/utils/propertyNameValidator.js` — `validatePropertyName`, `sanitizePropertyName`
- `src/utils/moduleConfigExtractor.js` — dynamic field definitions per vectorizer/generative/reranker module
- `src/utils/versionUtils.js` — `parseVersion`, `isVersionAtLeast`

## Common Tasks

### Running the dev server
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
# or
npm run test:ui
```

### Deploying demo to GitHub Pages
```bash
npm run deploy   # predeploy builds dist/; header shows version + commit
```

### Publishing to npm (@weaviate/add-collection)
```bash
npm version patch   # or minor / major
npm run release     # prepublishOnly runs tests + build:lib first
```

## Coding Patterns
- All components are functional with hooks; no class components.
- Config sections receive `{ config, setConfig }` props; internal `update(field, value)` helper merges changes.
- `Collection.jsx` is the single source of truth for schema state; all children call back up via `onChange`.
- `initialJson` prop triggers a `useEffect` in `Collection.jsx` that loads the JSON into individual state variables.
- Generated JSON is assembled in a `useEffect` that watches all state; output via `onChange(generatedJson)`.
