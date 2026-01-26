# @tokenring-ai/javascript

## Overview

The `@tokenring-ai/javascript` package provides JavaScript/TypeScript development tools for the TokenRing AI ecosystem. This package integrates with TokenRing agents to enable code linting, package management, and script execution capabilities. It serves as a plugin for TokenRing AI agents, providing specialized tools for JavaScript development workflows.

## Installation

```bash
bun install @tokenring-ai/javascript
```

## Package Purpose

This package registers tools that allow AI agents to:

- Run ESLint with auto-fix on JavaScript/TypeScript files in the codebase to automatically fix code style issues
- Install and remove packages using detected package managers (pnpm, npm, yarn)
- Execute JavaScript scripts in both ESM and CommonJS formats with timeout controls

## Package Structure

The package exports a `TokenRingPlugin` that integrates with the TokenRing app framework:

```typescript
import {TokenRingPlugin} from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {z} from "zod";
import packageJSON from './package.json' with {type: 'json'};
import tools from "./tools.ts";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(tools)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Available Tools

### 1. eslint

**Tool Name**: `javascript_eslint`

**Description**: Run ESLint with auto-fix on JavaScript/TypeScript files. Reads files, applies ESLint fixes in memory, and writes corrected code back to files.

**Parameters**:
- `files` (string[]): List of JavaScript/TypeScript file paths to apply ESLint fixes to.

**Returns**: Array of `{ file: string; output?: string; error?: string }` objects
- `file`: Path of the file processed
- `output`: "Successfully fixed" or "No changes needed"
- `error`: Error message if fix failed

**Example**:
```typescript
const results = await agent.executeTool('javascript_eslint', {
  files: ['src/main.ts', 'utils/helper.js']
});

for (const result of results) {
  if (result.output) {
    agent.infoMessage(`[${result.file}]: ${result.output}`);
  } else if (result.error) {
    agent.errorMessage(`[${result.file}]: ${result.error}`);
  }
}
```

### 2. installPackages

**Tool Name**: `javascript_installPackages`

**Description**: Installs a package using the detected package manager (pnpm, npm, yarn). Automatically detects package manager from lockfile presence.

**Parameters**:
- `packageName` (string): One or more package names to install, separated by spaces.
- `isDev` (boolean, optional): Install as dev dependency (default: false).

**Returns**: `{ ok: boolean; stdout?: string; stderr?: string }`

**Example**:
```typescript
const result = await agent.executeTool('javascript_installPackages', {
  packageName: 'lodash',
  isDev: false
});

if (result.ok) {
  agent.infoMessage('Package installed successfully');
  agent.infoMessage(result.stdout);
} else if (result.stderr) {
  agent.errorMessage(result.stderr);
}
```

### 3. removePackages

**Tool Name**: `javascript_removePackages`

**Description**: Removes a package using the detected package manager (pnpm, npm, yarn). Automatically detects package manager from lockfile presence.

**Parameters**:
- `packageName` (string): One or more package names to remove, separated by spaces.

**Returns**: `{ ok: boolean; stdout?: string; stderr?: string }`

**Example**:
```typescript
const result = await agent.executeTool('javascript_removePackages', {
  packageName: 'lodash'
});

if (result.ok) {
  agent.infoMessage('Package removed successfully');
  agent.infoMessage(result.stdout);
} else if (result.stderr) {
  agent.errorMessage(result.stderr);
}
```

### 4. runJavaScriptScript

**Tool Name**: `javascript_runJavaScriptScript`

**Description**: Run a JavaScript script in the working directory using Node.js. Creates temporary files (.mjs for ESM, .cjs for CommonJS) and executes them. Specify whether the code is in ES module or CommonJS format.

**Parameters**:
- `script` (string): The JavaScript code to execute. Code is executed in the root directory of the project.
- `format` ('esm' | 'commonjs', optional): The module format: 'esm' for ES modules or 'commonjs' for CommonJS (default: 'esm').
- `timeoutSeconds` (number, optional): Timeout for the script in seconds (default: 30, range: 5-300).

**Returns**:
```typescript
{
  ok: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  format: "esm" | "commonjs";
}
```

**Example**:
```typescript
const result = await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'console.log("Hello from JavaScript!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
});

if (result.ok) {
  agent.infoMessage(`Exit code: ${result.exitCode}`);
  agent.infoMessage(`Output: ${result.stdout}`);
  agent.infoMessage(`Format: ${result.format}`);
} else {
  agent.errorMessage(`Error: ${result.stderr}`);
}

// CommonJS example
const cjsResult = await agent.executeTool('javascript_runJavaScriptScript', {
  script: 'const sum = (a, b) => a + b; console.log(sum(1, 2));',
  format: 'commonjs',
  timeoutSeconds: 30
});
```

## Package Manager Detection

The package management tools automatically detect the appropriate package manager based on lockfile presence:
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm

If no supported lockfile is found, an error will be thrown with a descriptive message.

## Error Handling

All tools prefix their output and errors with `[toolName]` for consistent logging:

```typescript
// Error handling example
try {
  const result = await agent.executeTool('javascript_installPackages', {
    packageName: 'nonexistent-package'
  });
} catch (error) {
  // Error will include prefix from tool name
  agent.errorMessage(`Failed: ${error}`);
}
```

## Testing

```bash
bun run test
```

```bash
bun run test:watch  # Watch mode
```

```bash
bun run test:coverage  # Coverage report
```

## Dependencies

This package depends on:
- `eslint`: For code linting and fixing
- `execa`: For node command execution
- `jiti`: For JavaScript package execution
- `jscodeshift`: For AST-based transformations

The package also depends on core TokenRing packages:
- `@tokenring-ai/app`: Plugin framework
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/agent`: Agent system
- `@tokenring-ai/filesystem`: File operations and command execution

## License

MIT License - see [LICENSE](./LICENSE) file for details.
