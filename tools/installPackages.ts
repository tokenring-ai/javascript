import ChatService from "@token-ring/chat/ChatService";
import FileSystemService, {ExecuteCommandResult} from "@token-ring/filesystem/FileSystemService";
import {execute as runShellCommand} from "@token-ring/filesystem/tools/runShellCommand";
import {Registry} from "@token-ring/registry";
import {z} from "zod";

export interface InstallPackagesArgs {
  packageName?: string;
  isDev?: boolean;
}

/**
 * Install a package using the detected package manager.
 * All chatService output is prefixed with `[installPackages]`.
 * Errors are returned as a structured object: { error: string }.
 */
export async function execute(
  {isDev = false, packageName}: InstallPackagesArgs,
  registry: Registry,
): Promise<ExecuteCommandResult | { error: string }> {
  const filesystem = registry.requireFirstServiceByType(FileSystemService);
  const chatService = registry.requireFirstServiceByType(ChatService);
  const toolName = "installPackages";

  if (!packageName) {
    return {error: "packageName is required"};
  }

  try {
    // Detect package manager and run appropriate command
    if (await filesystem.exists("pnpm-lock.yaml")) {
      chatService.infoLine(`[${toolName}] Detected pnpm, installing ${packageName}`);
      return await runShellCommand(
        {
          command: `pnpm add ${isDev ? "-D " : ""}${packageName}`,
        },
        registry,
      );
    }

    if (await filesystem.exists("yarn.lock")) {
      chatService.infoLine(`[${toolName}] Detected yarn, installing ${packageName}`);
      return await runShellCommand(
        {
          command: `yarn add ${isDev ? "--dev " : ""}${packageName}`,
        },
        registry,
      );
    }

    if (await filesystem.exists("package-lock.json")) {
      chatService.infoLine(`[${toolName}] Detected npm, installing ${packageName}`);
      return await runShellCommand(
        {
          command: `npm install ${isDev ? "--save-dev " : ""}${packageName}`,
        },
        registry,
      );
    }

    // No lock file found – cannot determine package manager
    return {error: "No supported package manager lock file found (pnpm-lock.yaml, yarn.lock, package-lock.json)."};
  } catch (e: any) {
    // Return a structured error object
    return {error: e.message};
  }
}

export const description =
  "Installs a package using the detected package manager (pnpm, npm, yarn)";
export const parameters = z.object({
  packageName: z
    .string()
    .describe("One or more package names to install, separated by spaces."),
  isDev: z.boolean().default(false).describe("Install as dev dependency"),
});
