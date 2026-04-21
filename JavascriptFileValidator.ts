import type { FileValidator } from "@tokenring-ai/filesystem/FileSystemService";
import { ESLint } from "eslint";

export default class JavascriptFileValidator implements FileValidator {
  private eslint = new ESLint();

  async validateFile(filePath: string, content: string) {
    const results = await this.eslint.lintText(content, { filePath });
    const messages = results.flatMap(r => r.messages);
    if (messages.length === 0) return null;
    return messages.map(m => `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`).join("\n");
  }
}
