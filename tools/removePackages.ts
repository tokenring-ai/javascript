import FileSystemService from "@token-ring/filesystem/FileSystemService";
import {execute as runShellCommand} from "@token-ring/filesystem/tools/runShellCommand";
import {z} from "zod";
import {Registry} from "@token-ring/registry";

export interface RemovePackagesArgs {
	packageName?: string;
}


export async function execute(
	{ packageName }: RemovePackagesArgs,
	registry: Registry,
): Promise<any> {
	const filesystem = registry.requireFirstServiceByType(FileSystemService);

	if (filesystem.existsSync("pnpm-lock.yaml")) {
		return runShellCommand(
			{
				command: `pnpm remove ${packageName}`,
			},
			registry,
		);
	}

	if (filesystem.existsSync("yarn.lock")) {
		return runShellCommand(
			{
				command: `yarn remove ${packageName}`,
			},
			registry,
		);
	}

	if (filesystem.existsSync("package-lock.json")) {
		return runShellCommand(
			{
				command: `npm uninstall ${packageName}`,
			},
			registry,
		);
	}
}

export const description =
	"Removes a package using the detected package manager (pnpm, npm, yarn)";
export const parameters = z.object({
	packageName: z
		.string()
		.describe("One or more package names to remove, separated by spaces."),
});
