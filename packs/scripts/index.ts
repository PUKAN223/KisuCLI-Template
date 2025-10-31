import { SystemBase } from "@kisu/api";
import { BlueApple } from "./plugins/BlueApple.ts";
import { RedApple } from "./plugins/RedApple.ts";

new class KisuAPI extends SystemBase {
    public override onLoad(): void {
        this.pluginManagers.registerPlugin(BlueApple, RedApple)
    }
}();