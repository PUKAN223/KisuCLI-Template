import { SystemBase } from "@kisu/api";
import { MarketSystem } from "./plugins/MarketSystem/index.ts";

new class KisuAPI extends SystemBase {
    public override onLoad(): void {
        console.warn(`[KisuAPI] Loading MarketSystem Plugin...`);
        this.pluginManagers.registerPlugin(MarketSystem)
    }
}();