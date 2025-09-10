import Agent from "@tokenring-ai/agent/Agent";
import {ExecuteCommandResult} from "@tokenring-ai/filesystem/FileSystemProvider";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {execute as runShellCommand} from "@tokenring-ai/filesystem/tools/runShellCommand";
import {z} from "zod";

export const name = "javascript/removePackages";

export interface RemovePackagesArgs {
  packageName?: string;
}

/**
 * Executes the package removal using the detected package manager.
 * Returns raw command output without tool name prefix.
 */
export async function execute(
  {packageName}: RemovePackagesArgs,
  agent: Agent,
): Promise<ExecuteCommandResult> {
  const filesystem = agent.requireFirstServiceByType(FileSystemService);

  // Validate input
  if (!packageName || packageName.trim() === "") {
    throw new Error(`[${name}] package name must be provided.`);
  }

  // Determine which lockfile exists to infer the package manager
  if (await filesystem.exists("pnpm-lock.yaml")) {
    return await runShellCommand(
      {
        command: `pnpm remove ${packageName}`,
      },
      agent,
    );
  }

  if (await filesystem.exists("yarn.lock")) {
    return await runShellCommand(
      {
        command: `yarn remove ${packageName}`,
      },
      agent,
    );
  }

  if (await filesystem.exists("package-lock.json")) {
    return await runShellCommand(
      {
        command: `npm uninstall ${packageName}`,
      },
      agent,
    );
  }

  // No lockfile detected – cannot determine package manager
  throw new Error(`[${name}] unable to detect package manager (no lockfile found).`);
}

export const description =
  "Removes a package using the detected package manager (pnpm, npm, yarn)";
export const inputSchema = z.object({
  packageName: z
    .string()
    .describe("One or more package names to remove, separated by spaces."),
});
