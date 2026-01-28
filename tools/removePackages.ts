import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import {ExecuteCommandResult} from "@tokenring-ai/filesystem/FileSystemProvider";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {execute as bash} from "@tokenring-ai/filesystem/tools/bash";
import {z} from "zod";

const name = "javascript_removePackages";
const displayName = "Javascript/removePackages";

export interface RemovePackagesArgs {
  packageName?: string;
}

/**
 * Executes the package removal using the detected package manager.
 * Returns raw command output without tool name prefix.
 */
async function execute(
  {packageName}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<ExecuteCommandResult>> {
  const filesystem = agent.requireServiceByType(FileSystemService);

  // Validate input
  if (!packageName || packageName.trim() === "") {
    throw new Error(`[${name}] package name must be provided.`);
  }

  // Determine which lockfile exists to infer the package manager
  if (await filesystem.exists("pnpm-lock.yaml", agent)) {
    const result = await bash(
      {
        command: `pnpm remove ${packageName}`,
      },
      agent,
    );
    return {
      type: "json",
      data: result.data
    };
  }

  if (await filesystem.exists("yarn.lock", agent)) {
    const result = await bash(
      {
        command: `yarn remove ${packageName}`,
      },
      agent,
    );
    return {
      type: "json",
      data: result.data
    };
  }

  if (await filesystem.exists("package-lock.json", agent)) {
    const result = await bash(
      {
        command: `npm uninstall ${packageName}`,
      },
      agent,
    );
    return {
      type: "json",
      data: result.data
    };
  }

  // No lockfile detected – cannot determine package manager
  throw new Error(`[${name}] unable to detect package manager (no lockfile found).`);
}

const description =
  "Removes a package using the detected package manager (pnpm, npm, yarn)";
const inputSchema = z.object({
  packageName: z
    .string()
    .describe("One or more package names to remove, separated by spaces."),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;