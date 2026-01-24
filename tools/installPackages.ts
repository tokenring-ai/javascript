import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {ExecuteCommandResult} from "@tokenring-ai/filesystem/FileSystemProvider";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {execute as bash} from "@tokenring-ai/filesystem/tools/bash";
import {z} from "zod";

// Exported tool name following the required pattern
const name = "javascript_installPackages";
const displayName = "Javascript/installPackages";

export interface InstallPackagesArgs {
  packageName?: string;
  isDev?: boolean;
}

/**
 * Install a package using the detected package manager.
 * All agent output is prefixed with `[${name}]`.
 * Errors are thrown as exceptions rather than returned.
 */
async function execute(
  {isDev = false, packageName}: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<ExecuteCommandResult> {
  const filesystem = agent.requireServiceByType(FileSystemService);

  if (!packageName) {
    throw new Error(`[${name}] packageName is required`);
  }

  // Detect package manager and run appropriate command
  if (await filesystem.exists("pnpm-lock.yaml", agent)) {
    agent.infoMessage(`[${name}] Detected pnpm, installing ${packageName}`);
    return await bash(
      {
        command: `pnpm add ${isDev ? "-D " : ""}${packageName}`,
      },
      agent,
    );
  }

  if (await filesystem.exists("yarn.lock", agent)) {
    agent.infoMessage(`[${name}] Detected yarn, installing ${packageName}`);
    return await bash(
      {
        command: `yarn add ${isDev ? "--dev " : ""}${packageName}`,
      },
      agent,
    );
  }

  if (await filesystem.exists("package-lock.json", agent)) {
    agent.infoMessage(`[${name}] Detected npm, installing ${packageName}`);
    return await bash(
      {
        command: `npm install ${isDev ? "--save-dev " : ""}${packageName}`,
      },
      agent,
    );
  }

  // No lock file found – cannot determine package manager
  throw new Error(
    `[${name}] No supported package manager lock file found (pnpm-lock.yaml, yarn.lock, package-lock.json).`
  );
}

const description =
  "Installs a package using the detected package manager (pnpm, npm, yarn)";
const inputSchema = z.object({
  packageName: z
    .string()
    .describe("One or more package names to install, separated by spaces."),
  isDev: z.boolean().default(false).describe("Install as dev dependency"),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;