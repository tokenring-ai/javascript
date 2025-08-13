import { execa, execaSync } from "execa";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import ChatService from "@token-ring/chat/ChatService";
import { z } from "zod";
import {Registry} from "@token-ring/registry";

export interface RunJavaScriptArgs {
	script?: string;
	format?: "esm" | "commonjs";
	timeoutSeconds?: number;
	env?: Record<string, string>;
	workingDirectory?: string;
}

export interface RunJavaScriptResult {
	ok: boolean;
	exitCode?: number;
	stdout?: string;
	stderr?: string;
	error?: string | null;
	format: "esm" | "commonjs";
}

/**
 * Runs a JavaScript script in the working directory using Node.js.
 */
export async function execute(
	{
		script,
		format = "esm",
		timeoutSeconds = 30,
		env = {},
		workingDirectory,
	}: RunJavaScriptArgs,
	registry: Registry,
): Promise<RunJavaScriptResult | { error: string }> {
	const chatService = registry.requireFirstServiceByType(ChatService);
	const filesystem = registry.requireFirstServiceByType(FileSystemService);

	const cwd = filesystem.relativeOrAbsolutePathToAbsolutePath(
		workingDirectory ?? "./",
	);

	if (!script) {
		chatService.errorLine("[runJavaScriptScript] script is required");
		return { error: "script is required" };
	}

	// Validate format
	if (format !== "esm" && format !== "commonjs") {
		chatService.errorLine(
			`[runJavaScriptScript] Invalid format: ${format}. Must be "esm" or "commonjs"`,
		);
		return { error: `Invalid format: ${format}. Must be "esm" or "commonjs"` };
	}

	// Create a temporary file with the script content
	const tempFileName = `temp-script-${randomBytes(4).toString("hex")}${format === "esm" ? ".mjs" : ".cjs"}`;
	const tempFilePath = join(cwd, tempFileName);

	try {
		// Write the script to a temporary file
		await writeFile(tempFilePath, script);

		const timeout = Math.max(5, Math.min(timeoutSeconds || 30, 300));
		const execOpts = {
			cwd,
			env: { ...process.env, ...env },
			timeout: timeout * 1000,
			maxBuffer: 1024 * 1024,
		};

		// Determine the command to run based on the format
		// For `node --input-type=module script.mjs` or `node script.cjs`
		const nodeArgs = format === "esm" ? ["--input-type=module", tempFilePath] : [tempFilePath];

		chatService.infoLine(
			`[runJavaScriptScript] Running JavaScript script in ${format} format (cwd=${workingDirectory || "./"})`,
		);

		try {
			const { stdout, stderr, exitCode } = await execa(
				"node",
				nodeArgs,
				execOpts as any,
			);
			return {
				ok: true,
				exitCode: exitCode,
				stdout: stdout?.trim() || "",
				stderr: stderr?.trim() || "",
				error: null,
				format,
			};
		} catch (err: any) {
			return {
				ok: false,
				exitCode: typeof err.exitCode === "number" ? err.exitCode : 1,
				stdout: err.stdout?.trim() || "",
				stderr: err.stderr?.trim() || "",
				error: err.shortMessage || err.message,
				format,
			};
		}
	} catch (err: any) {
		chatService.errorLine(
			`[runJavaScriptScript] Error creating temporary script file: ${err.message}`,
		);
		return {
			ok: false,
			error: `Error creating temporary script file: ${err.message}`,
			format,
		};
	} finally {
		// Clean up the temporary file
		try {
			// Using execaSync for cleanup
			execaSync("rm", ["-f", tempFilePath], { cwd } as any);
		} catch (err: any) {
			chatService.errorLine(
				`[runJavaScriptScript] Error cleaning up temporary script file: ${err.message}`,
			);
		}
	}
}

export const description =
	"Run a JavaScript script in the working directory using Node.js. Specify whether the code is in ES module or CommonJS format.";
export const parameters = z.object({
	script: z.string().describe("The JavaScript code to execute."),
 format: z
		.enum(["esm", "commonjs"])
		.default("esm")
		.describe(
			"The module format: 'esm' for ES modules or 'commonjs' for CommonJS.",
		),
	timeoutSeconds: z
		.number()
		.int()
		.min(5)
		.max(300)
		.default(30)
		.describe("Timeout for the script in seconds (default 30, max 300)"),
	env: z.record(z.string()).optional().describe("Environment variables"),
	workingDirectory: z
		.string()
		.optional()
		.describe("Working directory, relative to source"),
});
