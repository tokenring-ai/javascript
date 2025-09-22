import Agent from "@tokenring-ai/agent/Agent";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {ESLint} from "eslint";
import {z} from "zod";

export const name = "javascript/eslint";

export interface EslintArgs {
  files?: string[];
}

export type EslintResult = { file: string; output?: string; error?: string };

export async function execute(
  {files}: EslintArgs,
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
      const filePath = filesystem.relativeOrAbsolutePathToAbsolutePath(file);
      const relFile = filesystem.relativeOrAbsolutePathToRelativePath(filePath);

      try {
        // Read source file
        const source = await filesystem.readFile(filePath, "utf8");

        // Run ESLint fix
        const lintResults = await eslint.lintText(source, {filePath});
        const [result] = lintResults;

        if (result.output && result.output !== source) {
          // Write fixed code back to file
          await filesystem.writeFile(filePath, result.output);
          results.push({file: relFile, output: "Successfully fixed"});
          agent.infoLine(`[${name}] Applied ESLint fixes on ${relFile}`);
          filesystem.setDirty(true);
        } else {
          results.push({file: relFile, output: "No changes needed"});
          agent.infoLine(`[${name}] No changes needed for ${relFile}`);
        }
      } catch (err: any) {
        results.push({file: relFile, error: err.message});
        agent.errorLine(`[${name}] ESLint fix on ${relFile}: ${err.message}`);
      }
    }
  } catch (e: any) {
    throw new Error(`[${name}] Failed to run ESLint: ${e.message}`);
  }
  return results;
}

export const description =
  "Run ESLint with --fix option on JavaScript/TypeScript files in the codebase to automatically fix code style issues.";
export const inputSchema = z.object({
  files: z
    .array(z.string())
    .describe(
      "List of JavaScript/TypeScript file paths to apply ESLint fixes to.",
    ),
});
