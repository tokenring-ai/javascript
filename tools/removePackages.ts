import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/schema";
import {FileSystemService} from "@tokenring-ai/filesystem";
import {TerminalService} from "@tokenring-ai/terminal";
import {z} from "zod";

const name = "javascript_removePackages";
const displayName = "Javascript/removePackages";

/**
 * Executes the package removal using the detected package manager.
 * Returns raw command output without tool name prefix.
 */
async function execute(
  {packageName}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<string> {
  const terminal = agent.requireServiceByType(TerminalService);
  const filesystem = agent.requireServiceByType(FileSystemService);

  // Validate input
  if (!packageName || packageName.trim() === "") {
    throw new Error(`[${name}] package name must be provided.`);
  }

  // Determine which lockfile exists to infer the package manager
  if (await filesystem.exists("bun.lock", agent)) {
    const result = await terminal.executeCommand("bun", ['remove', packageName], {}, agent);
    if (result.status === "success") return `Package ${packageName} removed`;
    const output = result.status === "badExitCode" ? result.output : result.status === "unknownError" ? result.error : "Timeout";
    return `Package ${packageName} could not be removed:\n${output}`;
  }

  if (await filesystem.exists("pnpm-lock.yaml", agent)) {
    const result = await terminal.executeCommand("pnpm", ['remove', packageName], {}, agent);
    if (result.status === "success") return `Package ${packageName} removed`;
    const output = result.status === "badExitCode" ? result.output : result.status === "unknownError" ? result.error : "Timeout";
    return `Package ${packageName} could not be removed:\n${output}`;
  }

  if (await filesystem.exists("yarn.lock", agent)) {
    const result = await terminal.executeCommand("yarn", ['remove', packageName], {}, agent);
    if (result.status === "success") return `Package ${packageName} removed`;
    const output = result.status === "badExitCode" ? result.output : result.status === "unknownError" ? result.error : "Timeout";
    return `Package ${packageName} could not be removed:\n${output}`;
  }

  if (await filesystem.exists("package-lock.json", agent)) {
    const result = await terminal.executeCommand("npm", ['remove', packageName], {}, agent);
    if (result.status === "success") return `Package ${packageName} removed`;
    const output = result.status === "badExitCode" ? result.output : result.status === "unknownError" ? result.error : "Timeout";
    return `Package ${packageName} could not be removed:\n${output}`;
  }

  // No lockfile detected – cannot determine package manager
  throw new Error(`[${name}] unable to detect package manager (no lockfile found).`);
}

const description =
  "Removes a package using the detected package manager (bun, pnpm, npm, yarn)";
const inputSchema = z.object({
  packageName: z
    .string()
    .describe("One or more package names to remove, separated by spaces."),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;