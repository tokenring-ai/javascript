import FileSystemService, {ExecuteCommandResult} from "@token-ring/filesystem/FileSystemService";
import {execute as runShellCommand} from "@token-ring/filesystem/tools/runShellCommand";
import {z} from "zod";
import {Registry} from "@token-ring/registry";

export interface RemovePackagesArgs {
	packageName?: string;
}

/**
 * Executes the package removal using the detected package manager.
 * Returns raw command output without tool name prefix; any informational
 * messages should be emitted by the chat service separately.
 * Errors are returned as an object matching the TypeScript type `{ error: string; }`.
 */
export async function execute(
	{ packageName }: RemovePackagesArgs,
	registry: Registry,
): Promise<ExecuteCommandResult|{ error: string }> {
	const filesystem = registry.requireFirstServiceByType(FileSystemService);

	// Validate input
	if (!packageName || packageName.trim() === "") {
		return { error: "Package name must be provided." };
	}

	// Determine which lockfile exists to infer the package manager
	if (await filesystem.exists("pnpm-lock.yaml")) {
		const result = await runShellCommand(
			{
				command: `pnpm remove ${packageName}`,
			},
			registry,
		);
		return result;
	}

	if (await filesystem.exists("yarn.lock")) {
		const result = await runShellCommand(
			{
				command: `yarn remove ${packageName}`,
			},
			registry,
		);
		return result;
	}

	if (await filesystem.exists("package-lock.json")) {
		const result = await runShellCommand(
			{
				command: `npm uninstall ${packageName}`,
			},
			registry,
		);
		return result;
	}

	// No lockfile detected – cannot determine package manager
	return { error: "Unable to detect package manager (no lockfile found)." };
}

export const description =
	"Removes a package using the detected package manager (pnpm, npm, yarn)";
export const parameters = z.object({
	packageName: z
		.string()
		.describe("One or more package names to remove, separated by spaces."),
});
