import type { TokenRingService } from "@tokenring-ai/app/types";
import type { FileValidationResult } from "@tokenring-ai/filesystem/util/runFileValidator";
import { ESLint } from "eslint";

export default class JavascriptService implements TokenRingService {
  readonly name = "JavascriptService";
  readonly description = "A service that implements Javascript validation and linting using eslint.";

  private eslint = new ESLint();

  async validateFile(filePath: string, content: string) : Promise<Required<FileValidationResult>> {
    const results = await this.eslint.lintText(content, { filePath });
    const messages = results.flatMap(r => r.messages);
    if (messages.length === 0) return { valid: true, result: "No issues found." };

    const result = messages.map(m => `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`).join("\n");
    return { valid: false, result };
  }
}
