import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {TerminalService} from "@tokenring-ai/terminal";
import {randomBytes} from "crypto";
import {z} from "zod";

const name = "javascript_runJavaScriptScript";
const displayName = "Javascript/runJavaScriptScript";
export interface RunJavaScriptResult {
  ok: boolean;
  exitCode?: number;
  output: string;
  format: "esm" | "commonjs";
}

/**
 * Runs a JavaScript script in the working directory using Node.js.
 */
async function execute(
  {
    script,
    format = "esm",
    timeoutSeconds = 30,
  }: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<RunJavaScriptResult>> {
  const terminal = agent.requireServiceByType(TerminalService);
  const filesystem = agent.requireServiceByType(FileSystemService);

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
    await filesystem.writeFile(tempFileName, script, agent);

    timeoutSeconds = Math.max(5, Math.min(timeoutSeconds || 30, 300));

    agent.infoMessage(
      `[${name}] Running JavaScript script in ${format} format`,
    );

    const result = await terminal.executeCommand("node", [tempFileName], {
      timeoutSeconds: timeoutSeconds,
    }, agent);

    return {
      type: "json",
      data: {
        ok: result.status === "success",
        output: result.status === "success" || result.status === "badExitCode" ? result.output : result.status === "unknownError" ? result.error : "Timeout",
        exitCode: result.status === "badExitCode" ? result.exitCode : 0,
        format,
      }
    };
  } finally {
    await filesystem.deleteFile(tempFileName, agent);
  }
}

const description =
  "Run a JavaScript script in the working directory using Node.js. Specify whether the code is in ES module or CommonJS format.";
const inputSchema = z.object({
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

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;