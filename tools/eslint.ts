import FileSystemService from "@token-ring/filesystem/FileSystemService";
import { ESLint } from "eslint";
import ChatService from "@token-ring/chat/ChatService";
import { z } from "zod";
import {Registry} from "@token-ring/registry";

export interface EslintArgs {
	files?: string[];
}

export type EslintResult = { file: string; output?: string; error?: string };


export async function execute(
	{ files }: EslintArgs,
	registry: Registry,
): Promise<EslintResult[] | { error: string }> {
	const chatService = registry.requireFirstServiceByType(ChatService);

	const filesystem = registry.requireFirstServiceByType(FileSystemService);

	const results: EslintResult[] = [];
	try {
		// Initialize ESLint
		const eslint = new ESLint({
			fix: true,
			useEslintrc: true,
		});

		for (const file of files) {
			const filePath = filesystem.relativeOrAbsolutePathToAbsolutePath(file);
			const relFile = filesystem.resolve(filePath);

			try {
				// Read source file
				const source = await filesystem.readFile(filePath, "utf8");

				// Run ESLint fix
				const lintResults = await eslint.lintText(source, { filePath });
				const [result] = lintResults;

				if (result.output && result.output !== source) {
					// Write fixed code back to file
					await filesystem.writeFile(filePath, result.output, "utf8");
					results.push({ file: relFile, output: "Successfully fixed" });
					chatService.infoLine(`Applied ESLint fixes on ${relFile}`);
					filesystem.setDirty(true);
				} else {
					results.push({ file: relFile, output: "No changes needed" });
					chatService.infoLine(`[INFO] No changes needed for ${relFile}`);
				}
			} catch (err: any) {
				results.push({ file: relFile, error: err.message });
				chatService.errorLine(
					`[ERROR] ESLint fix on ${relFile}: ${err.message}`,
				);
			}
		}
	} catch (e: any) {
		return { error: `Failed to run ESLint: ${e.message}` };
	}
	return results;
}

export const description =
	"Run ESLint with --fix option on JavaScript/TypeScript files in the codebase to automatically fix code style issues.";
export const parameters = z.object({
	files: z
		.array(z.string())
		.describe(
			"List of JavaScript/TypeScript file paths to apply ESLint fixes to.",
		),
});
