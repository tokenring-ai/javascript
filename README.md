# @tokenring-ai/javascript

## Overview

The `@tokenring-ai/javascript` package provides JavaScript file validation capabilities for the TokenRing AI ecosystem.
This package integrates with the TokenRing lifecycle system to register ESLint-based validation for JavaScript files,
ensuring code quality and consistency across JavaScript projects. Files are automatically validated after they are written.

### Key Features

- ESLint-based validation for JavaScript files (.js, .mjs, .cjs, .jsx)
- Automatic validation after file writes via lifecycle hooks
- Error and warning reporting with line/column information
- Support for both errors and warnings in validation results
- Reusable ESLint instance for performance optimization
- Standalone `JavascriptService` for direct validation access

### Integration Points

- **@tokenring-ai/app**: Plugin framework integration
- **@tokenring-ai/lifecycle**: Lifecycle hooks for post-write validation
- **@tokenring-ai/filesystem**: File validation through hook system

## Installation

```bash
bun add @tokenring-ai/javascript
```

## Features

- JavaScript file validation using ESLint
- Support for multiple JavaScript file extensions (.js, .mjs, .cjs, .jsx)
- Detailed error and warning messages with location information
- Automatic validation after file writes via lifecycle hooks
- Standalone service for manual validation
- Configurable validation through ESLint configuration

## Chat Commands

This package does not define any chat commands.

## Tools

This package does not define any tools.

## Configuration

The package currently has no configuration options. The `packageConfigSchema` is an empty object:

```typescript
import { z } from "zod";

const packageConfigSchema = z.object({});
```

## Core Components

### JavascriptService

The `JavascriptService` is a `TokenRingService` that provides JavaScript file validation using ESLint.

**Interface:**

```typescript
interface TokenRingService {
  readonly name: string;
  readonly description: string;
  validateFile(filePath: string, content: string): Promise<FileValidationResult>;
}
```

**Implementation:**

```typescript
// pkg/javascript/JavascriptService.ts
import type { TokenRingService } from "@tokenring-ai/app/types";
import type { FileValidationResult } from "@tokenring-ai/filesystem/util/runFileValidator";
import { ESLint } from "eslint";

export default class JavascriptService implements TokenRingService {
  readonly name = "JavascriptService";
  readonly description = "A service that implements Javascript validation and linting using eslint.";

  private eslint = new ESLint();

  async validateFile(filePath: string, content: string): Promise<Required<FileValidationResult>> {
    const results = await this.eslint.lintText(content, { filePath });
    const messages = results.flatMap(r => r.messages);
    if (messages.length === 0) return { valid: true, result: "No issues found." };

    const result = messages.map(m => 
      `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`
    ).join("\n");
    return { valid: false, result };
  }
}
```

**Validation Output Format:**

```text
line:column severity message (ruleId)
line:column severity message (ruleId)
...
```

**Example Output:**

```text
5:3 warning 'x' is assigned a value but never used (@typescript-eslint/no-unused-vars)
10:1 error Missing semicolon (semi)
```

### javascriptFileValidator Hook

The `javascriptFileValidator` is a lifecycle hook that automatically validates JavaScript files after they are written.

**Hook Definition:**

```typescript
// pkg/javascript/hooks/javascriptFileValidator.ts
import { FileValidatonAfterFileWrite } from "@tokenring-ai/filesystem/util/runFileValidator";
import type { HookSubscription } from "@tokenring-ai/lifecycle/types";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import JavascriptService from "../JavascriptService.ts";

const name = "javascriptFileValidator";
const displayName = "Javascript/Validate files after write";
const description = "Automatically validates written javascript files using eslint";

const JAVASCRIPT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx"]);

const callbacks = [
  new HookCallback(FileValidatonAfterFileWrite, (data, agent) => {
    if (JAVASCRIPT_EXTENSIONS.has(data.fileExtension)) {
      return agent.requireServiceByType(JavascriptService).validateFile(data.filePath, data.content);
    }
    return null;
  }),
];

export default {
  name,
  displayName,
  description,
  callbacks,
} satisfies HookSubscription<any>;
```

**Hook Behavior:**

- Triggers after any file write operation
- Checks if the file extension is a JavaScript variant (.js, .mjs, .cjs, .jsx)
- If matches, validates the file content using `JavascriptService`
- Returns validation results or null for non-JavaScript files

## Services

### JavascriptService Registration

This package provides the `JavascriptService` which implements JavaScript file validation using ESLint.

**Service Name:** `JavascriptService`

**Description:** A service that implements Javascript validation and linting using eslint.

**Registration:** The service is automatically registered when the plugin is installed:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);

// Access the service
const jsService = await app.getService("JavascriptService");
```

## Usage Examples

### Basic Integration

To use this package in your TokenRing application:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();

// Install the JavaScript validation plugin
await app.installPlugin(javascriptPlugin);

// JavaScript files will now be automatically validated after write
```

### Manual Service Usage

You can use the `JavascriptService` directly for manual validation:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";
import JavascriptService from "@tokenring-ai/javascript/JavascriptService";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);

// Get the service and validate a file
const jsService = await app.getService(JavascriptService);
const result = await jsService.validateFile("src/example.js", "const x = 1;");

if (result.valid) {
  console.log("File is valid:", result.result);
} else {
  console.log("Validation issues:");
  console.log(result.result);
}
```

### Direct Validator Usage

You can also use the validator directly without the service:

```typescript
import { JavascriptFileValidator } from "@tokenring-ai/javascript";

const validator = new JavascriptFileValidator();

const code = `
const x = 1;
const y = 2;
`;

const result = await validator.validateFile("example.js", code);

if (result.valid) {
  console.log("No issues found:", result.result);
} else {
  console.log("Validation issues:");
  console.log(result.result);
}
```

## Integration

### With TokenRingApp

Install the plugin during application setup:

```typescript
import { TokenRingApp } from "@tokenring-ai/app";
import javascriptPlugin from "@tokenring-ai/javascript/plugin";

const app = new TokenRingApp();
await app.installPlugin(javascriptPlugin);
```

### With Lifecycle System

The package integrates with the `@tokenring-ai/lifecycle` package by registering hooks:

```typescript
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import javascriptFileValidator from "@tokenring-ai/javascript/hooks/javascriptFileValidator";

app.waitForService(AgentLifecycleService, lifecycleService => {
  lifecycleService.addHooks(javascriptFileValidator);
});
```

Note: This integration is handled automatically when the plugin is installed.

## Supported File Extensions

The package validates the following JavaScript file extensions:

| Extension | Description               |
|-----------|---------------------------|
| `.js`     | Standard JavaScript files |
| `.mjs`    | ES Module files           |
| `.cjs`    | CommonJS files            |
| `.jsx`    | JavaScript JSX files      |

## Best Practices

### Validation Performance

- The ESLint instance is created once and reused for all validations
- Validation is asynchronous to avoid blocking the event loop
- Consider caching validation results for frequently accessed files

### Error Handling

When validation returns issues:

```typescript
const result = await jsService.validateFile("src/example.js", code);

if (!result.valid) {
  // Parse the validation result
  const issues = result.result.split('\n').map(line => {
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

The package is configured to use vitest for testing. Run the test suite with:

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
import { defineConfig } from "vitest/config";

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

| Package                        | Version    | Purpose                                    |
|--------------------------------|------------|--------------------------------------------|
| `@tokenring-ai/app`            | workspace:* | Plugin framework and application core      |
| `@tokenring-ai/filesystem`     | workspace:* | File validation types and utilities        |
| `@tokenring-ai/lifecycle`      | workspace:* | Lifecycle hook system                      |
| `eslint`                       | ^10.2.0    | JavaScript linting engine                  |
| `zod`                          | ^4.3.6     | Schema validation                          |

### Development Dependencies

| Package      | Version  | Purpose             |
|--------------|----------|---------------------|
| `typescript` | ^6.0.2   | TypeScript compiler |
| `vitest`     | ^4.1.1   | Testing framework   |

## Package Structure

```text
pkg/javascript/
├── index.ts                              # Main entry point (exports)
├── JavascriptService.ts                  # Service implementation
├── hooks/
│   └── javascriptFileValidator.ts        # Lifecycle hook for file validation
├── plugin.ts                             # Plugin export
├── vitest.config.ts                      # Test configuration
├── package.json                          # Package metadata
├── LICENSE                               # MIT License
└── README.md                             # This documentation
```

## Exports

The package provides the following exports:

| Export Path                                        | Description                           |
|----------------------------------------------------|---------------------------------------|
| `@tokenring-ai/javascript`                         | Main entry point (exports all)        |
| `@tokenring-ai/javascript/plugin`                  | Default TokenRingPlugin export        |
| `@tokenring-ai/javascript/JavascriptService`       | JavaScript validation service class   |

## License

MIT License - see [LICENSE](./LICENSE) file for details.
