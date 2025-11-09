import { PluginBase } from "@kisu/api";
import { MarketUi } from "./class/MarketUi.ts";
import { QuickItemDatabase } from "./class/QickItemDatabase.ts";

class MarketSystem extends PluginBase {
  public override name: string = "MarketSystem";
  public override version: string = "1.0.0";
  private itemDB: QuickItemDatabase = null as unknown as QuickItemDatabase;

  public override onLoad(): void {
    this.itemDB = new QuickItemDatabase("it_market", 5, 1);
    if (this.itemDB == null) return;

    this.events.on("AfterItemUse", (ev) => {
      const { source, itemStack } = ev;

      if (itemStack.typeId == "minecraft:compass") {
        if (source.isSneaking) {
          this.itemDB.clear();
          this.world.clearDynamicProperties();
          this.world.structureManager.getWorldStructureIds().forEach((id) => {
            if (id.includes("it_market")) {
              this.world.structureManager.delete(id);
            }
          })
          console.warn(
            `[MarketSystem] Cleared all market data by ${source.name}`,
          );
          this.itemDB.clear();
          return;
        }
        const ui = new MarketUi({ moneyScore: "money" });
        ui.showMainUi(source, this.itemDB);
      }
    });
  }
}

export { MarketSystem };
