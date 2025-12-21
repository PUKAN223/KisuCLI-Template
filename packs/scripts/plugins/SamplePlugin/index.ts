import { PluginBase } from "@kisu/api";

class SamplePlugin extends PluginBase {
    public override onLoad(): void {
      this.logger.info("SamplePlugin has been loaded!");
    }
}

export { SamplePlugin };