# Weaviate Add Collection (minimal)

**[Live demo → weaviate.github.io/weaviate-add-collection](https://weaviate.github.io/weaviate-add-collection/)**

A minimal React app (Vite) with a Collection component to compose a Weaviate collection JSON.

[This project is used in Weaviate Studio](https://github.com/muleyprasad/weaviate-studio/)

**✨ New**: Programmatic schema access via `onChange` and `onSubmit` callbacks — no more DOM scraping needed!

**✨ New**: Version-aware UI via the `weaviateVersion` prop — fields, options, and sections are automatically shown or hidden based on what your Weaviate instance supports. Unavailable options are disabled with a tooltip indicating the minimum required version.

## Quick Start (macOS, zsh)

```bash
# install deps
npm install

# start dev server
npm run dev
```

## Using as a Package

```bash
npm install @weaviate/add-collection
```

`react` and `react-dom` (18 or 19) are peer dependencies. The package ships prebuilt ESM and CommonJS bundles in `lib/`; styles are imported separately:

```javascript
import '@weaviate/add-collection/styles.css';
```

You can import the `Collection` component into your own React application:

```javascript
// Default import
import Collection from '@weaviate/add-collection';

// Named import
import { Collection } from '@weaviate/add-collection';
```

### Example Usage

```jsx
import React from 'react';
import Collection from '@weaviate/add-collection';

function App() {
  return (
    <div>
      <h1>My Weaviate Collection Builder</h1>
      <Collection
        initialJson={{ name: 'MyCollection', description: 'A sample collection' }}
        availableModules={serverModules}
        nodesNumber={3}
        weaviateVersion="1.36.0"
      />
    </div>
  );
}
```

### Props

The `Collection` component accepts the following props:

- **`initialJson`** (optional): JSON object to prepopulate the form with `name` and `description`
- **`availableModules`** (optional): Object containing available vectorizer modules from the server. If not provided, all default modules are available.
- **`nodesNumber`** (optional): Number representing the number of nodes (used as max for replication factor)
- **`weaviateVersion`** (optional): Semver string (e.g. `"1.36.0"`) representing the target Weaviate instance version. Controls which fields, options, and sections are shown based on version availability. Defaults to the latest supported version when omitted. See [Version-Gated UI](#version-gated-ui) below.
- **`onChange`** (optional): Callback function `(schema: object) => void` called whenever the schema changes. Provides programmatic access to the current JSON schema without DOM scraping.
- **`onSubmit`** (optional): Callback function `(schema: object) => void` called when the "Create Collection" button is clicked. If provided, a submit button will be displayed below the JSON preview.

### Programmatic Schema Access

Instead of scraping the DOM to get the generated schema, you can use the callback props:

```jsx
import React from 'react';
import Collection from '@weaviate/add-collection';

function App() {
  const handleSchemaChange = (schema) => {
    console.log('Schema updated:', schema);
    // Do something with the schema as it changes
  };

  const handleSubmit = async (schema) => {
    console.log('Creating collection with schema:', schema);
    // Send the schema to your Weaviate instance
    try {
      const response = await fetch('http://localhost:8080/v1/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      });
      if (response.ok) {
        alert('Collection created successfully!');
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  return (
    <div>
      <h1>My Weaviate Collection Builder</h1>
      <Collection
        initialJson={{ name: 'MyCollection', description: 'A sample collection' }}
        availableModules={serverModules}
        nodesNumber={3}
        weaviateVersion="1.36.0"
        onChange={handleSchemaChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

## Version-Gated UI

The `weaviateVersion` prop enables version-aware rendering: fields, dropdown options, and entire sections are shown, disabled, or hidden based on whether the target Weaviate instance supports them.

Pass the version of the Weaviate instance your user is connecting to:

```jsx
<Collection weaviateVersion="1.36.0" ... />
```

When `weaviateVersion` is omitted the component behaves as if the latest supported version is in use, showing all features.

### How it works

| Element | Behaviour when unavailable |
|---------|---------------------------|
| Individual field / checkbox | Hidden entirely |
| Dropdown option | Kept in list but `disabled`, label appended with `— Requires Weaviate ≥ X.Y.Z` |
| Collapsible section | Toggle button shown but disabled, same tooltip |

### Version feature registry

All version gates are centralised in [`src/constants/versionFeatures.js`](src/constants/versionFeatures.js). Each entry maps a feature identifier to the minimum Weaviate version that introduced it:

```js
// src/constants/versionFeatures.js
export const VERSION_FEATURES = {
  dynamicIndexType: '1.25.0',
  textAnalyzer:     '1.37.2',
  // ...
}
```

To add a new gate, add an entry there and use one of the gating helpers from [`src/context/VersionContext.jsx`](src/context/VersionContext.jsx):

- **`<VersionGated featureId="…">`** — wraps any JSX; greys it out behind a click-capture overlay and shows a `data-version-tooltip` when unavailable. The content stays in the DOM.
- **`<VersionGatedSection featureId="…" title="…">`** — wraps a collapsible section; disables the toggle when unavailable and does not render the panel.
- **`useVersionFilteredOptions(opts)`** — keeps options but marks them `disabled` and appends "— Requires Weaviate ≥ X.Y.Z" to the label.

**Establish the minimum version from Weaviate core, not from a client release.**
A feature usually appears in the TypeScript client some releases after the
server gained it, and occasionally before the server ships it at all. Both
directions cause real bugs: gating too late greys out a working control, and
gating too early offers a control the server will reject. Find the commit that
introduced the field in `weaviate/weaviate`, then check which tag first
contains it:

```bash
gh api "repos/weaviate/weaviate/compare/<sha>...v1.34.0" --jq '.status'
# "ahead"  -> that tag contains the commit
# "behind" -> it does not
```

See `CLAUDE.md` for step-by-step instructions on adding new version-gated fields, options, and sections.

## Testing

This project includes integration tests that work with a local Weaviate instance.

```bash
# Run tests (requires Weaviate running on localhost:8080)
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## How it Works
- Open the app at http://localhost:5173 (default Vite port).
- Fill the name and description fields. The generated JSON will update live below the form.
- You can also import a JSON file with `name` and `description` keys to prepopulate the form.
 - Use the "Copy" button to copy the generated JSON, or "Download" to save it as `{CollectionName}_weaviate_schema.json`.

# UI Rules

## Property

### Conditional Field Display

The following fields are shown conditionally based on the selected data type:

#### **Tokenization**
- **Visible only for:** `text` data type
- **Options:** word, whitespace, lowercase, field, gse, gse_ch, trigram, kagome_ja, kagome_kr
- **Default:** word
- **Purpose:** Defines how text is tokenized for search indexing
- **Note:** `gse`, `gse_ch`, `kagome_ja` and `kagome_kr` each need their own
  `ENABLE_TOKENIZER_*` environment variable set on the server, otherwise
  Weaviate rejects the property at creation time

#### **Text Analyzer**
- **Visible only for:** `text` data type
- **Requires:** Weaviate 1.37.2+
- **Purpose:** Per-property accent folding and stopword selection
- **Fields:**
  - **ASCII Fold** — folds accents to base characters, so "école" matches
    "ecole". Immutable after the property is created.
  - **ASCII Fold Ignore** — characters to leave unfolded. Editable later, but
    only affects data indexed after the change.
  - **Stopword Preset** — overrides the collection-level stopwords for this
    property. Offers the built-in `en` and `none` plus any preset defined under
    Inverted Index Configuration. Only applies to `word` tokenization, so the
    field is hidden for every other method.
- **Example Output:**
  ```json
  {
    "name": "title",
    "dataType": ["text"],
    "tokenization": "word",
    "textAnalyzer": {
      "asciiFold": true,
      "asciiFoldIgnore": ["é"],
      "stopwordPreset": "fr"
    }
  }
  ```

#### **Vectorization Settings (per-property)**
- **Visible only for:** `text` data type
- **Type:** Checkboxes
- **Purpose:** Control how individual text properties are vectorized
- **Options:**
  - **Vectorize Property Name** - Include the property name itself when creating embeddings (default: false)
- **Note:** These settings are applied to all active vectorizers in the vectorConfig and generate a `moduleConfig` object for each property
- **Example Output:**
  ```json
  {
    "name": "description",
    "dataType": ["text"],
    "moduleConfig": {
      "text2vec-openai": {
        "vectorizePropertyName": true
      }
    }
  }
  ```

#### **indexSearchable**
- **Visible only for:** `text` data type
- **Type:** Checkbox
- **Default:** true
- **Purpose:** Enables inverted index for text search capabilities

#### **indexRangeFilters**
- **Visible only for:** `int`, `number`, `date` data types
- **Type:** Checkbox
- **Default:** false
- **Purpose:** Enables range filtering for numeric and date values

#### **indexFilterable**
- **Visible for:** All data types
- **Type:** Checkbox
- **Default:** true
- **Purpose:** Enables general filtering on this property

### Data Types

Available data types:
- `text` - Text strings (shows tokenization and indexSearchable options)
- `int` - Integer numbers (shows indexRangeFilters option)
- `number` - Floating-point numbers (shows indexRangeFilters option)
- `date` - Date values (shows indexRangeFilters option)
- `boolean` - True/false values
- `geoCoordinates` - Geographic coordinates
- `phoneNumber` - Phone number values
- `uuid` - UUID values
- `blob` - Binary data

### Array Support

Any data type can be configured as an array by checking the "array" checkbox. This appends `[]` to the data type in the generated JSON (e.g., `text[]`, `int[]`).

### JSON Field Mapping

The following UI fields are mapped differently in the generated JSON:

- Collection UI field `name` → JSON field `class`
- Property UI field `name` → JSON field `name` (unchanged)

## Vectorizer Configuration

### Overview

The Vectorizer Configuration section allows you to add multiple vector configurations to your collection. Each configuration generates a `vectorConfig` entry in the JSON output.

### Vector Config Fields

Each vector configuration has the following fields:

#### **Name**
- **Type:** Text input
- **Required:** Yes (auto-generated if empty)
- **Default:** `vector_config_1`, `vector_config_2`, etc.
- **Purpose:** Unique identifier for this vector configuration
- **Examples:** `default`, `semantic`, `contextual`

#### **Vectorize Class Name**
- **Type:** Checkbox
- **Default:** false
- **Purpose:** Whether to include the collection/class name in vectorization
- **Note:** Common to all vectorizer modules

#### **Properties to Vectorize**
- **Type:** Multi-select checkboxes
- **Constraint:** Only text properties are available for selection
- **Purpose:** Select which text fields should be included when creating embeddings
- **Features:**
  - Select All / Deselect All buttons for quick management
  - Only properties with `dataType: text` are shown
  - Shows count of selected properties
  - If no text properties exist, displays a helpful message
- **Note:** Non-text properties (int, number, boolean, date, etc.) cannot be vectorized and won't appear in the list

### Tabbed Interface

The vector configuration is organized into **three tabs** for better organization:

#### Tab 1: Vectorizer Module
Configure which embedding model to use and its specific settings.

- **Vectorizer Module** (Dropdown)
  - Select from 40+ available modules
  - Categories: text2vec-*, multi2vec-*, ref2vec-*, etc.
  
- **Module Configuration** (Dynamic)
  - Automatically shows relevant fields based on selected module
  - Examples: model, dimensions, projectId, baseURL, etc.
  - Required fields marked with *

**Note:** Backup, generative, and reranker modules are filtered out.

#### Tab 2: Index Configuration
Configure the vector index type and optimization parameters.

- **Index Types:**
  - **HNSW** - Fast approximate search (recommended)
  - **Flat** - Exact search for small datasets
  - **Dynamic** - Auto-switches based on collection size

- **HNSW Parameters:**
  - Distance Metric (cosine, dot, l2-squared, manhattan, hamming)
  - ef Construction (build quality)
  - ef (search quality)
  - Max Connections (graph density)

- **Flat Parameters:**
  - Distance Metric only

- **Dynamic Parameters:**
  - Distance Metric
  - Threshold (when to switch from flat to HNSW)

#### Tab 3: Compression/Quantization
Reduce memory usage by compressing vectors.

**Note:** This tab is hidden when using Dynamic index type, as quantization is configured separately for each sub-index (HNSW and Flat).

- **Quantization Types:**
  - **None** - Full precision (default)
  - **PQ** - Product Quantization (8x-32x compression)
  - **BQ** - Binary Quantization (32x compression)
  - **SQ** - Scalar Quantization (4x compression)

- **PQ Parameters:**
  - Segments, Centroids, Training Limit, Distribution

- **BQ/SQ Parameters:**
  - Rescore Limit, Training Limit

**Important:** For flat indexes, only binary quantization is available. This can speed up search performance significantly. See [Weaviate Compression Considerations](https://docs.weaviate.io/weaviate/starter-guides/managing-resources/compression#compression-considerations) for more details.

### Dynamic Index Quantization

When using the **Dynamic** index type, quantization is configured separately for each sub-index:

- **HNSW Sub-index:** Supports all quantization types (PQ, BQ, SQ, None)
- **Flat Sub-index:** Only supports Binary Quantization (BQ) or None

This allows for optimal compression strategies based on the index type being used at different collection sizes.

**Important Note:** For flat indexes, only binary quantization is available. This can speed up search performance significantly. See [Weaviate Compression Considerations](https://docs.weaviate.io/weaviate/starter-guides/managing-resources/compression#compression-considerations) for more details.

See [TABS_DOCUMENTATION.md](TABS_DOCUMENTATION.md) for detailed information about each tab.

### Dynamic Module Configuration

When you select a vectorizer module, the application renders a configuration form built from a table of field definitions transcribed from the `weaviate-client` TypeScript types.

#### How It Works

1. **Field Definitions:** `src/utils/moduleConfigExtractor.js` holds a table of the configuration fields for each module, transcribed by hand from the `weaviate-client` type definitions. Despite the file's name nothing is extracted at build or runtime — keeping it current is a manual step on each client bump.

2. **Dynamic Form Generation:** Based on the selected module, a configuration form is automatically generated with the appropriate fields.

3. **Field Types:** The form intelligently renders different input types:
   - **String fields:** Text inputs
   - **Number fields:** Numeric inputs
   - **Boolean fields:** Checkboxes
   - **Array fields:** Comma-separated text inputs
   - **Object fields:** JSON textarea editors

4. **Required Fields:** Fields marked as required in the type definitions are indicated with a red asterisk (*).

#### Example Module Configurations

**text2vec-openai:**
- `model` (string) - The model to use (e.g., text-embedding-ada-002)
- `modelVersion` (string) - The model version
- `type` (string) - The type of embeddings (text, code)
- `baseURL` (string) - The base URL for OpenAI API
- `dimensions` (number) - The dimensionality of the vector
- `vectorizeClassName` (boolean) - Whether to vectorize the class name

**text2vec-google:**
- `projectId` (string) * - The project ID of the model in GCP
- `location` (string) - The location where the model runs
- `model` (string) - The model to use
- `dimensions` (number) - The dimensionality of the vector
- `vectorizeClassName` (boolean) - Whether to vectorize the class name

**multi2vec-clip:**
- `imageFields` (string[]) - The image fields used when vectorizing
- `inferenceUrl` (string) - The URL where inference requests are sent
- `textFields` (string[]) - The text fields used when vectorizing
- `vectorizeCollectionName` (boolean) - Whether the collection name is vectorized
- `weights` (object) - The weights of the fields used for vectorization

### Usage

1. Click "Add Vector Config" to create a new configuration
2. Enter a unique name for the configuration
3. Select a vectorizer module from the dropdown
4. **Configure module settings:** Once a module is selected, a dynamic configuration form will appear with module-specific options
5. Fill in the module configuration fields as needed (required fields are marked with *)
6. Choose an index type (default is HNSW)
7. Click the documentation link (if available) to learn more about the selected module
8. Repeat to add multiple vector configurations

### Generated JSON Structure

The vector configurations are output in the `vectorConfig` object with module-specific settings:

```json
{
  "class": "MyCollection",
  "description": "This is a demo collection",
  "properties": [
    {
      "name": "property1",
      "dataType": [
        "text"
      ],
      "indexFilterable": true,
      "indexSearchable": true,
      "tokenization": "word",
      "indexRangeFilters": false
    },
    {
      "name": "original_id",
      "dataType": [
        "text"
      ],
      "indexFilterable": true,
      "indexSearchable": true,
      "tokenization": "field",
      "indexRangeFilters": false
    }
  ],
  "vectorConfig": {
    "default": {
      "vectorizer": {
        "text2vec-openai": {
          "properties": [
            "property1"
          ],
          "model": "text-embedding-3-small"
        }
      },
      "vectorIndexType": "dynamic",
      "vectorIndexConfig": {
        "hnsw": {
          "rq": {
            "enabled": true
          }
        },
        "flat": {
          "rq": {
            "enabled": true
          }
        }
      }
    }
  },
  "moduleConfig": {
    "generative-cohere": {},
    "reranker-cohere": {}
  },
  "invertedIndexConfig": {
    "indexNullState": true,
    "indexTimestamps": true,
    "stopwords": {
      "additions": [
        "something"
      ]
    }
  },
  "multiTenancyConfig": {
    "enabled": true,
    "autoTenantCreation": true,
    "autoTenantActivation": true
  },
  "objectTtlConfig": {
    "enabled": true,
    "deleteOn": "creationTime",
    "timeToLive": 400,
    "filterExpiredObjects": true
  },
  "replicationConfig": {
    "factor": 3,
    "asyncEnabled": true,
    "deletionStrategy": "DeleteOnConflict"
  },
  "shardingConfig": {
    "desiredCount": 2,
    "virtualPerPhysical": 128,
    "desiredVirtualCount": 256
  }
}
```

## Sharding Configuration

Exposes the three create-time `shardingConfig` fields: `desiredCount`,
`virtualPerPhysical` and `desiredVirtualCount`.

A schema read back from a running Weaviate also carries `actualCount`,
`actualVirtualCount`, `key`, `strategy` and `function`. Those are accepted on
import so a round-tripped schema is not silently altered, but they are never
emitted — they are outputs, not settings.

Weaviate treats sharding and replication as mutually exclusive. This component
emits each from its own effect and auto-sets the replication factor from
`nodesNumber`, so both can end up in one schema; the section shows a warning
rather than blocking, and the server has the final say.

## Architecture

### Module Configuration System

The module configuration tables mirror the type definitions in the
`weaviate-client` library so the UI stays in sync with the API.

> **These tables are maintained by hand.** Nothing reads the `.d.ts` files at
> build or runtime. When bumping `weaviate-client`, diff the `Vectorizer`,
> `GenerativeSearch` and `Reranker` unions in
> `src/collections/config/types/` against `VECTORIZER_CONFIG_FIELDS` and
> `allAvailableModules`. `moduleConfigExtractor.test.js` asserts that those two
> repo files agree with each other, but it cannot know about a module neither
> of them has heard of.

#### Components

1. **moduleConfigExtractor.js** (`src/utils/`)
   - Extracts configuration field definitions for each vectorizer module
   - Based on TypeScript type definitions from `weaviate-client`
   - Provides validation and helper functions
   - Contains metadata about each field (name, type, description, required)

2. **ModuleConfigForm.jsx** (`src/components/`)
   - Dynamically renders configuration forms based on module selection
   - Handles different field types (string, number, boolean, array, object)
   - Provides appropriate input controls for each type
   - Displays field descriptions and marks required fields

3. **VectorConfigItem.jsx** (`src/components/`)
   - Manages individual vector configuration items
   - Integrates the ModuleConfigForm component
   - Handles state updates for module configuration

4. **Collection.jsx** (`src/components/`)
   - Orchestrates the entire collection configuration
   - Merges module configurations into the final JSON output
   - Maintains state for all vector configurations

#### Data Flow

```
User selects module
    ↓
VectorConfigItem detects change
    ↓
ModuleConfigForm queries moduleConfigExtractor
    ↓
Form fields are rendered based on module type
    ↓
User fills in configuration
    ↓
Config stored in vectorConfig state
    ↓
Collection.jsx merges into final JSON
```

#### Type Mapping

The system maps TypeScript types to form inputs:

| TypeScript Type | Form Input | Example |
|----------------|------------|---------|
| `string` | Text input | `model: "text-embedding-ada-002"` |
| `number` | Number input | `dimensions: 1536` |
| `boolean` | Checkbox | `vectorizeClassName: false` |
| `string[]` | Comma-separated text | `imageFields: ["image1", "image2"]` |
| `object` | JSON textarea | `weights: {"imageFields": [0.7]}` |

#### Benefits

1. **Type Safety:** Configurations match the actual API requirements
2. **Self-Documenting:** Field descriptions are embedded in the UI
3. **Validation:** Required fields are enforced
4. **Consistency:** A parity test keeps the field tables and the module dropdown in agreement, so a module can never have configuration options it cannot be selected to use

### Examples

See `examples/moduleConfigExamples.js` for complete working examples of different vectorizer configurations.


