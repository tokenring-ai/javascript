import { execa, execaSync } from 'execa';
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import ChatService from "@token-ring/chat/ChatService";
import { z } from "zod";

/**
 * Runs a JavaScript script in the working directory using Node.js.
 * @param {object} args
 * @param {string} args.script - The JavaScript code to run.
 * @param {string} [args.format="esm"] - The module format: "esm" for ES modules or "commonjs" for CommonJS.
 * @param {number} [args.timeoutSeconds=30] - Optional command timeout.
 * @param {object} [args.env={}] - Environment variables, key/value pairs.
 * @param {string} [args.workingDirectory] - Optional working directory (relative to source).
 * @param {TokenRingRegistry} registry - The package registry
 */
export default execute;
export async function execute({ script, format = "esm", timeoutSeconds = 30, env = {}, workingDirectory }, registry) {
  const chatService = registry.requireFirstServiceByType(ChatService);
  const filesystem = registry.requireFirstServiceByType(FileSystemService);
  if (!filesystem) {
    chatService.errorLine(`[ERROR] FileSystem not found, can't perform file operations without knowing the base directory for file paths`);
    return "Couldn't perform file operation due to application misconfiguration, do not retry.";
  }

  const cwd = filesystem.relativeOrAbsolutePathToAbsolutePath(workingDirectory ?? "./");

  if (!script) {
    chatService.errorLine("[runJavaScriptScript] script is required");
    return { error: "script is required" };
  }

  // Validate format
  if (format !== "esm" && format !== "commonjs") {
    chatService.errorLine(`[runJavaScriptScript] Invalid format: ${format}. Must be "esm" or "commonjs"`);
    return { error: `Invalid format: ${format}. Must be "esm" or "commonjs"` };
  }

  // Create a temporary file with the script content
  const tempFileName = `temp-script-${randomBytes(4).toString('hex')}${format === "esm" ? ".mjs" : ".cjs"}`;
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
    const command = `node ${format === "esm" ? "--input-type=module" : ""} ${tempFilePath}`;
    
    chatService.infoLine(`[runJavaScriptScript] Running JavaScript script in ${format} format (cwd=${workingDirectory || "./"})`);

    try {
      // Use execa, pass script path and args directly if not using shell
      // For `node --input-type=module script.mjs` or `node script.cjs`
      // The command is `node`, args are `[formatArg, tempFilePath]`
      const nodeArgs = format === "esm" ? ["--input-type=module", tempFilePath] : [tempFilePath];
      const { stdout, stderr, exitCode } = await execa("node", nodeArgs, execOpts);
      return {
        ok: true,
        exitCode: exitCode,
        stdout: stdout?.trim() || "",
        stderr: stderr?.trim() || "",
        error: null,
        format
      };
    } catch (err) {
      return {
        ok: false,
        exitCode: typeof err.exitCode === "number" ? err.exitCode : 1,
        stdout: err.stdout?.trim() || "",
        stderr: err.stderr?.trim() || "",
        error: err.shortMessage || err.message, // Use shortMessage if available
        format
      };
    }
  } catch (err) {
    chatService.errorLine(`[runJavaScriptScript] Error creating temporary script file: ${err.message}`);
    return {
      ok: false,
      error: `Error creating temporary script file: ${err.message}`,
      format
    };
  } finally {
    // Clean up the temporary file
    try {
      // Using execaSync for cleanup
      execaSync("rm", ["-f", tempFilePath], { cwd });
    } catch (err) {
      chatService.errorLine(`[runJavaScriptScript] Error cleaning up temporary script file: ${err.message}`);
    }
  }
}

export const description = "Run a JavaScript script in the working directory using Node.js. Specify whether the code is in ES module or CommonJS format.";
export const parameters = z.object({
  script: z.string().describe("The JavaScript code to execute."),
  format: z.enum(["esm", "commonjs"]).default("esm").describe("The module format: 'esm' for ES modules or 'commonjs' for CommonJS."),
  timeoutSeconds: z.number().int().min(5).max(300).default(30).describe("Timeout for the script in seconds (default 30, max 300)"),
  env: z.record(z.string()).optional().describe("Environment variables"),
  workingDirectory: z.string().optional().describe("Working directory, relative to source")
});