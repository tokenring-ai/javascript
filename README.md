# @tokenring-ai/javascript

## Overview

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem. This package integrates with the TokenRing FileSystemService to register ESLint-based validation for JavaScript files, ensuring code quality and consistency across JavaScript projects.

### Key Features

- Automatic ESLint validation for JavaScript files (.js, .mjs, .cjs, .jsx)
- Integration with the FileSystemService for seamless file validation
- Error and warning reporting with line/column information
- Support for both errors and warnings in validation results
- Reusable ESLint instance for performance optimization

### Integration Points

- **@tokenring-ai/app**: Plugin framework integration
- **@tokenring-ai/filesystem**: FileSystemService for file validation

## Installation

```bash
bun add @tokenring-ai/javascript
```

## Features

- JavaScript file validation using ESLint
- Support for multiple JavaScript file extensions (.js, .mjs, .cjs, .jsx)
- Detailed error and warning messages with location information
- Seamless integration with TokenRing FileSystemService
- Configurable validation through ESLint configuration

## Core Components

### JavascriptFileValidator

The `JavascriptFileValidator` is a file validator implementation that uses ESLint to validate JavaScript files.

**Type Signature:**

```typescript
type FileValidator = (filePath: string, content: string) => Promise<string | null>;
```

**Implementation:**

```typescript
// pkg/javascript/JavascriptFileValidator.ts
import type {FileValidator} from "@tokenring-ai/filesystem/FileSystemService";
import {ESLint} from "eslint";

const eslint = new ESLint();

const JavascriptFileValidator: FileValidator = async (filePath, content) => {
  const results = await eslint.lintText(content, {filePath});
  const messages = results.flatMap(r => r.messages);
  if (messages.length === 0) return null;
  return messages.map(m => `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`).join("\n");
};

export default JavascriptFileValidator;
```

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

## Services

This package does not define a `TokenRingService`. Instead, it integrates with the existing `FileSystemService` from `@tokenring-ai/filesystem` by registering file validators for JavaScript file extensions.

## Configuration

The package currently has no configuration options. The `packageConfigSchema` is an empty object:

```typescript
import {z} from "zod";

const packageConfigSchema = z.object({});
```

## Usage Examples

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

### Manual Validator Usage

You can also use the validator directly:

```typescript
import JavascriptFileValidator from "@tokenring-ai/javascript/JavascriptFileValidator";

const code = `
const x = 1;
const y = 2;
`;

const result = await JavascriptFileValidator("example.js", code);

if (result) {
  console.log("Validation issues:");
  console.log(result);
} else {
  console.log("No issues found");
}
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

## Supported File Extensions

The package registers validators for the following JavaScript file extensions:

| Extension | Description |
|-----------|-------------|
| `.js` | Standard JavaScript files |
| `.mjs` | ES Module files |
| `.cjs` | CommonJS files |
| `.jsx` | JavaScript JSX files |

## Best Practices

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

### ESLint Setup

Ensure your project has proper ESLint configuration:

```bash
# Install ESLint and necessary plugins
bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Create ESLint configuration
npx eslint --init
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

### Test Configuration

The package uses vitest for testing with the following configuration:

```typescript
// vitest.config.ts
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tokenring-ai/app` | 0.2.0 | Plugin framework and application core |
| `@tokenring-ai/filesystem` | 0.2.0 | FileSystemService for file validation |
| `eslint` | ^10.1.0 | JavaScript linting engine |
| `zod` | ^4.3.6 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^6.0.2 | TypeScript compiler |
| `vitest` | ^4.1.1 | Testing framework |

## Package Structure

```
pkg/javascript/
├── index.ts                    # Main entry point (exports)
├── JavascriptFileValidator.ts  # File validator implementation
├── plugin.ts                   # Plugin export
├── vitest.config.ts           # Test configuration
├── package.json               # Package metadata
├── LICENSE                    # MIT License
└── README.md                  # This documentation
```

## Exports

The package provides the following exports:

| Export Path | Description |
|-------------|-------------|
| `@tokenring-ai/javascript` | Main entry point (exports all) |
| `@tokenring-ai/javascript/plugin` | Default TokenRingPlugin export |
| `@tokenring-ai/javascript/JavascriptFileValidator` | File validator function |

## License

MIT License - see [LICENSE](./LICENSE) file for details.
