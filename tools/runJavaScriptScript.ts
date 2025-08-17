import ChatService from "@token-ring/chat/ChatService";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import { Registry } from "@token-ring/registry";
import { randomBytes } from "crypto";
import { execa, execaSync } from "execa";
import { writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

export const name = "javascript/runJavaScriptScript";

export interface RunJavaScriptArgs {
  script?: string;
  format?: "esm" | "commonjs";
  timeoutSeconds?: number;
  workingDirectory?: string;
}

export interface RunJavaScriptResult {
  ok: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
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
    workingDirectory,
  }: RunJavaScriptArgs,
  registry: Registry,
): Promise<RunJavaScriptResult> {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const filesystem = registry.requireFirstServiceByType(FileSystemService);

  const cwd = filesystem.relativeOrAbsolutePathToAbsolutePath(
    workingDirectory ?? "./",
  );

  if (!script) {
    throw new Error(`[${name}] script is required`);
  }

  // Validate format
  if (format !== "esm" && format !== "commonjs") {
    throw new Error(
      `[${name}] Invalid format: ${format}. Must be "esm" or "commonjs"`,
    );
  }

  // Create a temporary file with the script content
  const tempFileName = `temp-script-${randomBytes(4).toString("hex")}${
    format === "esm" ? ".mjs" : ".cjs"
  }`;
  const tempFilePath = join(cwd, tempFileName);

  try {
    // Write the script to a temporary file
    await writeFile(tempFilePath, script);

    const timeout = Math.max(5, Math.min(timeoutSeconds || 30, 300));
    const execOpts = {
      cwd,
      env: { ...process.env},
      timeout: timeout * 1000,
      maxBuffer: 1024 * 1024,
    };

    // Determine the command to run based on the format
    // For `node --input-type=module script.mjs` or `node script.cjs`
    const nodeArgs =
      format === "esm" ? ["--input-type=module", tempFilePath] : [tempFilePath];

    chatService.infoLine(
      `[${name}] Running JavaScript script in ${format} format (cwd=${workingDirectory || "./"})`,
    );

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
      format,
    };
  } catch (err: any) {
    // Throw errors instead of returning them
    throw new Error(`[${name}] ${err.shortMessage || err.message}`);
  } finally {
    // Clean up the temporary file
    try {
      // Using execaSync for cleanup
      execaSync("rm", ["-f", tempFilePath], { cwd } as any);
    } catch {
      // Swallow cleanup errors; they are not critical for tool operation
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
  workingDirectory: z
    .string()
    .optional()
    .describe("Working directory, relative to source"),
});
