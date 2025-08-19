import ChatService from "@token-ring/chat/ChatService";
import FileSystemService from "@token-ring/filesystem/FileSystemService";
import {Registry} from "@token-ring/registry";
import {randomBytes} from "crypto";
import {execa} from "execa";
import {z} from "zod";

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

  try {
    // Write the script to a temporary file
    await filesystem.writeFile(tempFileName, script);

    timeoutSeconds = Math.max(5, Math.min(timeoutSeconds || 30, 300));

    chatService.infoLine(
      `[${name}] Running JavaScript script in ${format} format`,
    );

    const {ok, stdout, stderr, exitCode, error} = await filesystem.executeCommand(["node", tempFileName], {
      timeoutSeconds: timeoutSeconds,
    });

    return {
      ok: true,
      exitCode: exitCode,
      stdout: stdout?.trim() || "",
      stderr: stderr?.trim() || "",
      format,
    };
  } finally {
    await filesystem.deleteFile(tempFileName);
  }
}

export const description =
  "Run a JavaScript script in the working directory using Node.js. Specify whether the code is in ES module or CommonJS format.";
export const inputSchema = z.object({
  script: z.string().describe("The JavaScript code to execute. Code is executed in the root directory of the project."),
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
});
