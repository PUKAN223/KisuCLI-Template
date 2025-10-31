import { PluginBase } from "@kisu/api";

class RedApple extends PluginBase {
  public override name: string = "RedApple";
  public override version: string = "1.0.0";

  public override onLoad(): void {
  }
}

export { RedApple };
