import { PluginBase } from "@kisu/api";

class BlueApple extends PluginBase {
  public override name: string = "BlueApple";
  public override version: string = "1.0.0";

  public override onLoad(): void {
    this.events.on("AfterItemUse", (ev) => {
      this.logger.info(`BlueApple detected item use: ${ev.itemStack.typeId}`);
    })
  }
}

export { BlueApple };
