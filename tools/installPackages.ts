import ChatService from "@token-ring/chat/ChatService";
import {ExecuteCommandResult} from "@token-ring/filesystem/FileSystemProvider";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import {execute as runShellCommand} from "@token-ring/filesystem/tools/runShellCommand";
import {Registry} from "@token-ring/registry";
import {z} from "zod";

// Exported tool name following the required pattern
export const name = "javascript/installPackages";

export interface InstallPackagesArgs {
  packageName?: string;
  isDev?: boolean;
}

/**
 * Install a package using the detected package manager.
 * All chatService output is prefixed with `[${name}]`.
 * Errors are thrown as exceptions rather than returned.
 */
export async function execute(
  {isDev = false, packageName}: InstallPackagesArgs,
  registry: Registry,
): Promise<ExecuteCommandResult> {
  const filesystem = registry.requireFirstServiceByType(FileSystemService);
  const chatService = registry.requireFirstServiceByType(ChatService);

  if (!packageName) {
    throw new Error(`[${name}] packageName is required`);
  }

  // Detect package manager and run appropriate command
  if (await filesystem.exists("pnpm-lock.yaml")) {
    chatService.infoLine(`[${name}] Detected pnpm, installing ${packageName}`);
    return await runShellCommand(
      {
        command: `pnpm add ${isDev ? "-D " : ""}${packageName}`,
      },
      registry,
    );
  }

  if (await filesystem.exists("yarn.lock")) {
    chatService.infoLine(`[${name}] Detected yarn, installing ${packageName}`);
    return await runShellCommand(
      {
        command: `yarn add ${isDev ? "--dev " : ""}${packageName}`,
      },
      registry,
    );
  }

  if (await filesystem.exists("package-lock.json")) {
    chatService.infoLine(`[${name}] Detected npm, installing ${packageName}`);
    return await runShellCommand(
      {
        command: `npm install ${isDev ? "--save-dev " : ""}${packageName}`,
      },
      registry,
    );
  }

  // No lock file found – cannot determine package manager
  throw new Error(
    `[${name}] No supported package manager lock file found (pnpm-lock.yaml, yarn.lock, package-lock.json).`
  );
}

export const description =
  "Installs a package using the detected package manager (pnpm, npm, yarn)";
export const inputSchema = z.object({
  packageName: z
    .string()
    .describe("One or more package names to install, separated by spaces."),
  isDev: z.boolean().default(false).describe("Install as dev dependency"),
});
