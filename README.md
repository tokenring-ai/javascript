# @tokenring-ai/javascript

## Overview

The `@tokenring-ai/javascript` package provides JavaScript/TypeScript development tools for the TokenRing AI ecosystem. This package integrates with TokenRing agents to enable code linting, package management, and script execution capabilities. It serves as a plugin for TokenRing AI agents, providing specialized tools for JavaScript development workflows.

## Installation

```bash
bun install @tokenring-ai/javascript
```

## Package Purpose

This package registers tools that allow AI agents to:

- Run ESLint with auto-fix on JavaScript/TypeScript files to automatically fix code style issues
- Install and remove packages using detected package managers (pnpm, npm, yarn)
- Execute JavaScript scripts in both ESM and CommonJS formats with timeout controls

## Package Structure

The package exports a `TokenRingPlugin` that integrates with the TokenRing app framework:

```typescript
import { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { z } from "zod";
import packageJSON from './package.json' with { type: 'json' };
import tools from "./tools.ts";

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools(packageJSON.name, tools)
    );
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
```

## Available Tools

### 1. eslint (`javascript_eslint`)

**Description**: Run ESLint with --fix option on JavaScript/TypeScript files in the codebase to automatically fix code style issues.

**Parameters**:
- `files` (string[]): List of JavaScript/TypeScript file paths to apply ESLint fixes to.

**Returns**: Array of `{ file: string; output?: string; error?: string }` objects

**Example**:
```typescript
const results = await agent.tools.javascript_eslint.execute({
  files: ['src/main.ts', 'utils/helper.js']
}, agent);

results.forEach(result => {
  if (result.output) {
    console.log(`${result.file}: ${result.output}`);
  } else if (result.error) {
    console.error(`${result.file}: ${result.error}`);
  }
});
```

### 2. installPackages (`javascript_installPackages`)

**Description**: Installs a package using the detected package manager (pnpm, npm, yarn).

**Parameters**:
- `packageName` (string): One or more package names to install, separated by spaces.
- `isDev` (boolean, optional): Install as dev dependency (default: false)

**Returns**: Command execution result with stdout, stderr, and exit code

**Example**:
```typescript
const result = await agent.tools.javascript_installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (result.ok) {
  console.log('Package installed successfully');
}
```

### 3. removePackages (`javascript_removePackages`)

**Description**: Removes a package using the detected package manager (pnpm, npm, yarn).

**Parameters**:
- `packageName` (string): One or more package names to remove, separated by spaces.

**Returns**: Command execution result with stdout, stderr, and exit code

**Example**:
```typescript
const result = await agent.tools.javascript_removePackages.execute({
  packageName: 'lodash'
}, agent);

if (result.ok) {
  console.log('Package removed successfully');
}
```

### 4. runJavaScriptScript (`javascript_runJavaScriptScript`)

**Description**: Run a JavaScript script in the working directory using Node.js. Specify whether the code is in ES module or CommonJS format.

**Parameters**:
- `script` (string): The JavaScript code to execute. Code is executed in the root directory of the project.
- `format` ('esm' | 'commonjs', optional): The module format: 'esm' for ES modules or 'commonjs' for CommonJS (default: 'esm')
- `timeoutSeconds` (number, optional): Timeout for the script in seconds (default: 30, max: 300, min: 5)

**Returns**: `{ ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: "esm" | "commonjs" }`

**Example**:
```typescript
const result = await agent.tools.javascript_runJavaScriptScript.execute({
  script: 'console.log("Hello from JavaScript!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
}, agent);

console.log('Exit code:', result.exitCode);
console.log('Output:', result.stdout);
if (result.stderr) {
  console.error('Error:', result.stderr);
}
```

## Package Manager Detection

The package management tools automatically detect the appropriate package manager based on lockfile presence:
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm

If no supported lockfile is found, an error will be thrown.

## Testing

```bash
bun run test
```

```bash
bun run test:watch  # Watch mode
bun run test:coverage  # Coverage report
```

## License

MIT License - see [LICENSE](./LICENSE) file for details.
