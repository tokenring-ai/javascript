import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {ESLint} from "eslint";
import {z} from "zod";

const name = "javascript/eslint";

export interface EslintArgs {
  files?: string[];
}

export type EslintResult = { file: string; output?: string; error?: string };

async function execute(
  {files}: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<EslintResult[]> {

  const filesystem = agent.requireServiceByType(FileSystemService);

  const results: EslintResult[] = [];
  try {
    // Initialize ESLint with fix enabled
    const eslint = new ESLint({
      fix: true,
    });

    const filesArr = files ?? [];
    for (const file of filesArr) {
      try {
        // Read source file
        const source = await filesystem.readFile(file, "utf8");

        // Run ESLint fix
        const lintResults = await eslint.lintText(source, {filePath: file});
        const [result] = lintResults;

        if (result.output && result.output !== source) {
          // Write fixed code back to file
          await filesystem.writeFile(file, result.output);
          results.push({file: file, output: "Successfully fixed"});
          agent.infoLine(`[${name}] Applied ESLint fixes on ${file}`);
          filesystem.setDirty(true);
        } else {
          results.push({file: file, output: "No changes needed"});
          agent.infoLine(`[${name}] No changes needed for ${file}`);
        }
      } catch (err: any) {
        results.push({file: file, error: err.message});
        agent.errorLine(`[${name}] ESLint fix on ${file}: ${err.message}`);
      }
    }
  } catch (e: any) {
    throw new Error(`[${name}] Failed to run ESLint: ${e.message}`);
  }
  return results;
}

const description =
  "Run ESLint with --fix option on JavaScript/TypeScript files in the codebase to automatically fix code style issues.";
const inputSchema = z.object({
  files: z
    .array(z.string())
    .describe(
      "List of JavaScript/TypeScript file paths to apply ESLint fixes to.",
    ),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
