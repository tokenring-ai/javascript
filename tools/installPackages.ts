import FileSystemService from "@token-ring/filesystem/FileSystemService";
import { execute as runShellCommand } from "@token-ring/filesystem/tools/runShellCommand";
import { z } from "zod";
import {Registry} from "@token-ring/registry";

export interface InstallPackagesArgs {
	packageName?: string;
	isDev?: boolean;
}


export async function execute(
	{ isDev = false, packageName }: InstallPackagesArgs,
	registry: Registry,
): Promise<any> {
	const filesystem = registry.requireFirstServiceByType(FileSystemService);

	if (filesystem.existsSync("pnpm-lock.yaml")) {
		return runShellCommand(
			{
				command: `pnpm add ${isDev ? "-D " : ""} ${packageName}`,
			},
			registry,
		);
	}

	if (filesystem.existsSync("yarn.lock")) {
		return runShellCommand(
			{
				command: `yarn add ${isDev ? "--dev " : ""} ${packageName}`,
			},
			registry,
		);
	}
	if (filesystem.existsSync("package-lock.json")) {
		return runShellCommand(
			{
				command: `npm install ${isDev ? "--save-dev " : ""} ${packageName}`,
			},
			registry,
		);
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
