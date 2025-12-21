import { SystemBase } from "@kisu/api";
import { SamplePlugin } from "./plugins/SamplePlugin/index.ts";

class KisuAPI extends SystemBase {
    public override onLoad(): void {
        this.pluginManagers.registerPlugin(SamplePlugin)
    }
};

new KisuAPI();