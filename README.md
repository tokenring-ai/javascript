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
- Install and remove bun packages using detected package managers (pnpm, npm, yarn)
- Execute JavaScript scripts in both ESM and CommonJS formats with timeout controls

## Package Structure

The package exports a `TokenRingPlugin` that integrates with the TokenRing app framework:

```typescript
import TokenRingApp from "@tokenring-ai/app";
import {ChatService} from "@tokenring-ai/chat";
import {TokenRingPlugin} from "@tokenring-ai/app";

export default {
  name: "@tokenring-ai/javascript",
  version: "0.2.0",
  description: "TokenRing Coder Javascript Integration",
  install(app: TokenRingApp) {
    app.waitForService(ChatService, chatService =>
      chatService.addTools("@tokenring-ai/javascript", tools)
    );
  }
} satisfies TokenRingPlugin;
```

## Available Tools

### 1. eslint (`javascript_eslint`)

**Description**: Run ESLint with `--fix` option on JavaScript/TypeScript files to automatically fix code style issues.

**Parameters**:
- `files` (string[]): Array of file paths to apply ESLint fixes to

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

**Description**: Install packages using the detected package manager (npm, yarn, or pnpm)

**Parameters**:
- `packageName` (string): Package name(s) to install (space-separated for multiple packages)
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

**Description**: Remove packages using the detected package manager

**Parameters**:
- `packageName` (string): Package name(s) to remove (space-separated for multiple packages)

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

**Description**: Execute JavaScript code in a temporary file using Node.js with timeout control

**Parameters**:
- `script` (string): JavaScript code to execute
- `format` ('esm' | 'commonjs', optional): Module format (default: 'esm')
- `timeoutSeconds` (number, optional): Timeout in seconds (default: 30, min: 5, max: 300)

**Returns**: `{ ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: string }`

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

## Dependencies

- `@tokenring-ai/agent` (^0.2.0): Agent framework
- `@tokenring-ai/filesystem` (^0.2.0): Filesystem operations
- `eslint` (^9.39.2): Code linting and fixing
- `execa` (^9.6.1): Command execution
- `jiti` (^2.6.1): Runtime transpilation
- `jscodeshift` (^17.3.0): Code transformation utilities
- `zod`: Schema validation

## Testing

```bash
bun run test
```

```bash
bun run test:watch  # Watch mode
bun run test:coverage  # Coverage report
```

## License

MIT License