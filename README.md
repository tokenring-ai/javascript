# JavaScript Package Documentation

## Overview

The `@tokenring-ai/javascript` package provides integration tools for JavaScript development and execution within the TokenRing AI agent ecosystem. It enables AI agents to perform tasks such as running JavaScript scripts in a sandboxed environment, installing and removing npm packages using detected package managers (npm, yarn, pnpm), and automatically fixing code style issues with ESLint. This package is designed for use in AI-driven coding assistants, allowing agents to interact with JavaScript codebases securely via the `@tokenring-ai/filesystem` service.

The package exports a `TokenRingPackage` object that registers four main tools: `eslint`, `installPackages`, `removePackages`, and `runJavaScriptScript`. These tools leverage the agent's filesystem and logging capabilities for operations within a virtual filesystem.

## Installation/Setup

This package is intended for integration into TokenRing AI agent projects. Install it via npm:

```bash
npm install @tokenring-ai/javascript
```

Ensure you have the peer dependencies installed:

- `@tokenring-ai/agent` (for agent context)
- `@tokenring-ai/filesystem` (for file operations)

The package uses ES modules (`type: "module"`) and supports Node.js environments. No additional build steps are required for basic usage, but run `npm test` with Vitest for verification.

## Package Structure

The package follows a simple structure:

- **index.ts**: Main entry point. Exports the `TokenRingPackage` with package metadata and tools.
- **tools.ts**: Re-exports individual tools for modularity.
- **tools/eslint.ts**: Tool for running ESLint with auto-fix on JS/TS files.
- **tools/installPackages.ts**: Tool for installing npm packages via detected manager.
- **tools/removePackages.ts**: Tool for removing npm packages.
- **tools/runJavaScriptScript.ts**: Tool for executing JS scripts in ESM or CommonJS format.
- **package.json**: Defines metadata, dependencies, and exports.
- **LICENSE**: MIT license file.
- **README.md**: This documentation.

Directories are auto-created as needed during operations.

## Core Components

The package revolves around four tools, each with an `execute` function that takes arguments and an `Agent` instance. Tools use Zod schemas for input validation and return structured results. They interact via the agent's `FileSystemService` for file I/O and command execution.

### ESLint Tool

**Description**: Runs ESLint with the `--fix` option on specified JavaScript/TypeScript files to automatically resolve code style issues. It reads files, applies fixes, writes changes back if any, and logs results. Supports relative or absolute paths.

**Key Methods/Properties**:
- `execute({ files }: EslintArgs, agent: Agent): Promise<EslintResult[]>`
  - `files`: Array of file paths (optional; if omitted, may process defaults but typically specify).
  - Returns: Array of `{ file: string; output?: string; error?: string }` objects.

**Interactions**: Uses `FileSystemService` to read/write files and agent's logging for info/error messages. Sets filesystem as dirty on changes.

### Install Packages Tool

**Description**: Detects the package manager (pnpm, yarn, npm) from lockfiles and installs one or more packages. Throws errors if no manager is detected or input is invalid.

**Key Methods/Properties**:
- `execute({ packageName, isDev = false }: InstallPackagesArgs, agent: Agent): Promise<ExecuteCommandResult>`
  - `packageName`: Required string of package names (space-separated for multiples).
  - `isDev`: Boolean to install as dev dependency.
  - Returns: Command execution result with stdout, stderr, exitCode, etc.

**Interactions**: Delegates to `runShellCommand` from filesystem tools, prefixing logs with `[javascript/installPackages]`.

### Remove Packages Tool

**Description**: Similar to install, but removes packages using the detected package manager. Supports space-separated package names.

**Key Methods/Properties**:
- `execute({ packageName }: RemovePackagesArgs, agent: Agent): Promise<ExecuteCommandResult>`
  - `packageName`: Required string of package names.
  - Returns: Command execution result.

**Interactions**: Uses `runShellCommand` and logs with `[javascript/removePackages]`.

### Run JavaScript Script Tool

**Description**: Executes JavaScript code in a temporary file using Node.js, supporting ESM or CommonJS formats. Runs in the agent's working directory with configurable timeout. Cleans up temp files afterward.

**Key Methods/Properties**:
- `execute({ script, format = 'esm', timeoutSeconds = 30, workingDirectory }: RunJavaScriptArgs, agent: Agent): Promise<RunJavaScriptResult>`
  - `script`: Required string of JS code.
  - `format`: 'esm' or 'commonjs'.
  - `timeoutSeconds`: Integer (5-300s).
  - Returns: `{ ok: boolean; exitCode?: number; stdout?: string; stderr?: string; format: string }`.

**Interactions**: Writes to temp file via `FileSystemService`, executes with `executeCommand`, and logs execution details.

## Usage Examples

### 1. Running a Simple JS Script
In an agent context, invoke the tool to compute something:

```typescript
import { createAgent } from '@tokenring-ai/agent';
// Assume agent is set up with filesystem

const result = await agent.tools.javascript.runJavaScriptScript.execute({
  script: 'console.log("Hello from JS!"); console.log(2 + 2);',
  format: 'esm',
  timeoutSeconds: 10
}, agent);

console.log(result.stdout); // "Hello from JS!\n4"
```

### 2. Installing a Package
```typescript
const result = await agent.tools.javascript.installPackages.execute({
  packageName: 'lodash',
  isDev: false
}, agent);

if (result.ok) {
  console.log('Package installed:', result.stdout);
}
```

### 3. Fixing Code with ESLint
```typescript
const results = await agent.tools.javascript.eslint.execute({
  files: ['src/main.ts']
}, agent);

results.forEach(r => {
  if (r.output) console.log(`${r.file}: ${r.output}`);
  else if (r.error) console.error(`${r.file}: ${r.error}`);
});
```

## Configuration Options

- **ESLint**: Configured with `fix: true` by default. Uses global ESLint config from the project.
- **Package Management**: Auto-detects from lockfiles (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`). No custom config.
- **Script Execution**: `timeoutSeconds` (default 30s, clamped 5-300s). `format` defaults to ESM. `workingDirectory` optional.
- Environment: Relies on Node.js for execution; ensure it's available in the agent's runtime.

No additional environment variables or configs are exposed.

## API Reference

- **TokenRingPackage** (from index.ts): `{ name: string; version: string; description: string; tools: object }`
- **Tools** (from tools.ts):
  - `eslint`: `{ name: string; description: string; inputSchema: ZodSchema; execute: Function }`
  - `installPackages`: Similar structure.
  - `removePackages`: Similar.
  - `runJavaScriptScript`: Similar, with result typing.

Each `execute` function requires an `Agent` instance and validates inputs via Zod. Errors are thrown with prefixed messages.

## Dependencies

- `@tokenring-ai/agent` (^0.1.0): Agent framework.
- `@tokenring-ai/filesystem` (^0.1.0): Filesystem operations.
- `eslint` (^9.33.0): Linting and fixing.
- `execa` (^9.6.0): Command execution (internal).
- `jiti` (^2.5.1): Runtime transpilation.
- `jscodeshift` (^17.3.0): Code transformation utilities.
- `zod`: Schema validation.

## Contributing/Notes

- **Testing**: Run `npm test` with Vitest.
- **Building**: No build step; direct ES module usage.
- **Limitations**: Script execution is sandboxed but uses Node.js directly—avoid untrusted code. Package management assumes lockfiles exist. ESLint requires valid JS/TS syntax.
- **License**: MIT.
- Contributions: Fork, add features/tests, and submit PRs. Focus on enhancing tool safety and integration.