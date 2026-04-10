import type {FileValidator} from "@tokenring-ai/filesystem/FileSystemService";
import {ESLint} from "eslint";

const eslint = new ESLint();

const JavascriptFileValidator: FileValidator = async (filePath, content) => {
  const results = await eslint.lintText(content, {filePath});
  const messages = results.flatMap((r) => r.messages);
  if (messages.length === 0) return null;
  return messages
    .map(
      (m) =>
        `${m.line}:${m.column} ${m.severity === 2 ? "error" : "warning"} ${m.message} (${m.ruleId})`,
    )
    .join("\n");
};

export default JavascriptFileValidator;
