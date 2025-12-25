import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {randomBytes} from "crypto";
import {z} from "zod";

const name = "javascript_runJavaScriptScript";
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
async function execute(
  {
    script,
    format = "esm",
    timeoutSeconds = 30,
  }: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<RunJavaScriptResult> {
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

    agent.infoLine(
      `[${name}] Running JavaScript script in ${format} format`,
    );

    const {ok, stdout, stderr, exitCode, error} = await filesystem.executeCommand(["node", tempFileName], {
      timeoutSeconds: timeoutSeconds,
    }, agent);

    return {
      ok: true,
      exitCode: exitCode,
      stdout: stdout?.trim() || "",
      stderr: stderr?.trim() || "",
      format,
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
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;