# @tokenring-ai/javascript

## Overview

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem. This package integrates with the TokenRing FileSystemService to register ESLint-based validation for JavaScript files, ensuring code quality and consistency across JavaScript/TypeScript projects.

## Installation

```bash
bun install @tokenring-ai/javascript
```

## Package Purpose

This package registers a file validator that automatically validates JavaScript files using ESLint. When integrated with a TokenRing application, it enables:

- Automatic ESLint validation for JavaScript files (.js, .mjs, .cjs, .jsx)
- Integration with the FileSystemService for seamless file validation
- Error and warning reporting with line/column information
- Support for both errors and warnings in validation results

## Package Structure

The package consists of the following components:

### Core Files

- **`JavascriptFileValidator.ts`**: The main file validator implementation using ESLint
- **`plugin.ts`**: TokenRing plugin that registers the validator with FileSystemService
- **`index.ts`**: Package entry point (currently empty, exports via plugin.ts)

### Plugin Export

The package exports a `TokenRingPlugin` that integrates with the TokenRing app framework:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {z} from "zod";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(FileSystemService, fileSystemService => {
      for (const ext of [".js", ".mjs", ".cjs", ".jsx"]) {
        fileSystemService.registerFileValidator(ext, JavascriptFileValidator);
      }
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Core Components

### JavascriptFileValidator

The `JavascriptFileValidator` is a file validator implementation that uses ESLint to validate JavaScript files.

**Type Signature:**
```typescript
type FileValidator = (filePath: string, content: string) => Promise<string | null>;
```

**Implementation Details:**

- Uses ESLint to analyze JavaScript code
- Returns `null` if no issues are found
- Returns a formatted string with all issues if validation fails
- Each issue includes line, column, severity, message, and rule ID

**Validation Output Format:**
```
line:column severity message (ruleId)
line:column severity message (ruleId)
...
```

**Example Output:**
```
5:3 warning 'x' is assigned a value but never used (@typescript-eslint/no-unused-vars)
10:1 error Missing semicolon (semi)
```

## Usage

### Basic Integration

To use this package in your TokenRing application:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// Now all JavaScript files will be automatically validated
```

### File Validation Example

When a JavaScript file is validated through the FileSystemService:

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

// Get the file service (assuming it's registered)
const fileService = await app.getService(FileSystemService);

// Validate a JavaScript file
const validationResult = await fileService.validateFile("src/example.js", "const x = 1;");

if (validationResult === null) {
  console.log("File is valid");
} else {
  console.log("Validation issues:");
  console.log(validationResult);
}
```

## Supported File Extensions

The package registers validators for the following JavaScript file extensions:

- `.js` - Standard JavaScript files
- `.mjs` - ES Module files
- `.cjs` - CommonJS files
- `.jsx` - JavaScript JSX files

## Configuration

The package currently has no configuration options. The `packageConfigSchema` is an empty object:

```typescript
const packageConfigSchema = z.object({});
```

## Integration

### With FileSystemService

The package integrates with the `@tokenring-ai/filesystem` package by registering file validators:

```typescript
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";

app.waitForService(FileSystemService, fileSystemService => {
  // Register validators for all JavaScript extensions
  fileSystemService.registerFileValidator(".js", JavascriptFileValidator);
  fileSystemService.registerFileValidator(".mjs", JavascriptFileValidator);
  fileSystemService.registerFileValidator(".cjs", JavascriptFileValidator);
  fileSystemService.registerFileValidator(".jsx", JavascriptFileValidator);
});
```

### With TokenRingApp

Install the plugin during application setup:

```typescript
import {TokenRingApp} from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);
```

## Best Practices

### ESLint Configuration

This package uses ESLint with the project's existing ESLint configuration. Ensure you have:

1. A valid `.eslintrc` or `eslint.config.js` file in your project
2. All necessary ESLint plugins installed
3. Proper TypeScript support if validating TypeScript files

### Validation Performance

- The ESLint instance is created once and reused for all validations
- Validation is asynchronous to avoid blocking the event loop
- Consider caching validation results for frequently accessed files

### Error Handling

When validation returns issues:

```typescript
const result = await fileService.validateFile("src/example.js", code);

if (result) {
  // Parse the validation result
  const issues = result.split('\n').map(line => {
    const [location, severity, ...messageParts] = line.split(' ');
    const [lineNum, column] = location.split(':');
    return {
      line: parseInt(lineNum),
      column: parseInt(column),
      severity,
      message: messageParts.join(' ')
    };
  });
  
  console.log(`Found ${issues.length} issues`);
}
```

## Testing

Run the test suite with:

```bash
bun run test
```

Watch mode for development:

```bash
bun run test:watch
```

Generate coverage report:

```bash
bun run test:coverage
```

## Dependencies

### Runtime Dependencies

- **`@tokenring-ai/app`** (0.2.0): Plugin framework and application core
- **`@tokenring-ai/filesystem`** (0.2.0): FileSystemService for file validation
- **`eslint`** (^10.0.2): JavaScript linting engine
- **`zod`** (^4.3.6): Schema validation

### Development Dependencies

- **`typescript`** (^5.9.3): TypeScript compiler
- **`vitest`** (^4.0.18): Testing framework

## License

MIT License - see [LICENSE](./LICENSE) file for details.
