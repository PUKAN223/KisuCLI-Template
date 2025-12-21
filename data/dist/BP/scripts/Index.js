// packs/scripts/Index.ts
import { SystemBase } from "./KisuLib.js";

// packs/scripts/plugins/SamplePlugin/index.ts
import { PluginBase } from "./KisuLib.js";
var SamplePlugin = class extends PluginBase {
  onLoad() {
    this.logger.info("SamplePlugin has been loaded!");
  }
};

// packs/scripts/Index.ts
var KisuAPI = class extends SystemBase {
  onLoad() {
    this.pluginManagers.registerPlugin(SamplePlugin);
  }
};
new KisuAPI();
//# sourceMappingURL=Index.js.map
