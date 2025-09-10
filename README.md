# @tokenring-ai/javascript

Utilities for working with JavaScript/TypeScript projects in the Token Ring ecosystem. This package exposes a small set
of tools that help you:

- Run ESLint with automatic fixes over files
- Install or remove npm packages using the package manager found in your repo
- Execute quick throwaway JavaScript snippets with Node.js (ESM or CommonJS)

The package is designed to be used from a Token Ring registry (services + tools), but the individual tools can also be
invoked programmatically.

## Installation

This package is part of the Token Ring monorepo and is normally consumed via workspace tooling. If you need the package
name and version:

- Name: `@tokenring-ai/javascript`
- Version: `0.1.0`

Peer packages typically present in a Token Ring app:

- `@tokenring-ai/registry`
- `@tokenring-ai/filesystem`
- `@tokenring-ai/chat`

## Exports

- `tools.eslint` — Run ESLint with fixes
- `tools.installPackages` — Install one or more packages via pnpm/yarn/npm
- `tools.removePackages` — Remove packages via pnpm/yarn/npm
- `tools.runJavaScriptScript` — Execute an ad-hoc JS script with Node (esm or commonjs)

---

## Tool: tools.eslint

Run ESLint with the `--fix` option on one or more files. Writes changes back to disk when fixes are produced.

Signature:

- `async execute({ files }, registry): Promise<EslintResult[] | { error: string }>`

Parameters:

- `files: string[]` — Paths of JS/TS files to lint and fix.

Behavior:

- Uses your local ESLint configuration (`useEslintrc: true`).
- For each file:
- Lints the in-memory source
- Writes fixed code if ESLint produced changes
- Returns a per-file result `{ file, output? | error? }`
- Logs progress and errors through `ChatService`.

Example (programmatic):

```ts
import {tools as jsTools} from "@tokenring-ai/javascript";
import {ServiceRegistry} from "@tokenring-ai/registry";

const registry = new ServiceRegistry();
// ...register FileSystemService and ChatService here...

const result = await jsTools.eslint.execute({files: ["src/index.ts", "src/util.ts"]}, registry);
console.log(result);
```

---

## Tool: tools.installPackages

Installs packages using the first detected package manager in your repo.

Supported managers (auto-detected by lock file):

- pnpm (when `pnpm-lock.yaml` exists)
- yarn (when `yarn.lock` exists)
- npm (when `package-lock.json` exists)

Signature:

- `async execute({ packageName, isDev }, registry): Promise<any>`

Parameters:

- `packageName: string` — One or more package names separated by spaces (e.g., "eslint@^9 prettier").
- `isDev?: boolean` — Install as a dev dependency (default false).

Examples:

```ts
await jsTools.installPackages.execute({packageName: "eslint prettier", isDev: true}, registry);
```

---

## Tool: tools.removePackages

Removes packages using the first detected package manager.

Signature:

- `async execute({ packageName }, registry): Promise<any>`

Parameters:

- `packageName: string` — One or more package names separated by spaces.

Example:

```ts
await jsTools.removePackages.execute({packageName: "eslint prettier"}, registry);
```

---

## Tool: tools.runJavaScriptScript

Runs a small JavaScript snippet in Node.js by writing it to a temporary file and executing it. Supports both ESM and
CommonJS.

Signature:

-

`async execute({ script, format, timeoutSeconds, env, workingDirectory }, registry): Promise<RunJavaScriptResult | { error: string }>`

Parameters:

- `script: string` — The JavaScript code to execute.
- `format?: "esm" | "commonjs"` — Module format (default `"esm"`).
- `timeoutSeconds?: number` — Execution timeout in seconds (min 5, max 300, default 30).
- `env?: Record<string,string>` — Additional environment variables for the process.
- `workingDirectory?: string` — Working directory relative to the repository root.

Returns `RunJavaScriptResult` on success or failure:

- `ok: boolean`
- `exitCode?: number`
- `stdout?: string`
- `stderr?: string`
- `error?: string | null`
- `format: "esm" | "commonjs"`

Example (ESM):

```ts
const res = await jsTools.runJavaScriptScript.execute({
  script: "console.log('hello from esm')",
  format: "esm",
}, registry);
console.log(res.stdout);
```

Example (CommonJS):

```ts
const res = await jsTools.runJavaScriptScript.execute({
  script: "console.log(require('path').sep)",
  format: "commonjs",
}, registry);
```

Notes:

- The tool creates a temporary .mjs or .cjs file in the working directory and removes it afterwards.
- Output and errors are captured and returned; failures include `exitCode` and `stderr`.

---

## Development

- Scripts:
- `pnpm -F @tokenring-ai/javascript test` — run tests (if present in this package)
- `pnpm -F @tokenring-ai/javascript eslint` — run ESLint with `--fix` over the package

- Requirements:
- Node.js 18+
- A workspace that provides the Token Ring services you intend to use at runtime (Registry, FileSystemService,
  ChatService).

## License

MIT
