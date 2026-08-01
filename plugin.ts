import type { TokenRingPlugin } from "@tokenring-ai/app";
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import javascriptFileValidator from "./hooks/javascriptFileValidator.ts";
import JavascriptService from "./JavascriptService.ts";
import packageJSON from "./package.json" with { type: "json" };

export default {
  name: packageJSON.name,
  displayName: "JavaScript Tooling",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app) {
    app.addService(new JavascriptService());

    // Register hooks with the lifecycle service
    app.waitForService(AgentLifecycleService, lifecycleService => {
      lifecycleService.addHooks(javascriptFileValidator);
    });
  },
} satisfies TokenRingPlugin;
