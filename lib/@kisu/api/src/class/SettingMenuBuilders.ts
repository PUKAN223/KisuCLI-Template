import { Player } from "@minecraft/server";
import IActionForm from "./forms/IActionForm.ts";
import { PluginBase } from "./PluginBase.ts";
import { PluginManagers } from "./PluginManagers.ts";

class SettingMenuBuilders {
  private menus = new Map<string, SettingMenu>();

  constructor() {
  }

  public registerMenu(menu: SettingMenu, plugin: PluginBase): void {
    this.menus.set(plugin.name, menu);
  }

  public settingMenu(pl: Player, pluginManagers: PluginManagers): void {
    const settingMain = new IActionForm(
      `Settings Menu`,
      `§fHello, §e${pl.name}§r\n\nThis is the configuration menu.\nYou can manage settings here.`,
    );
    settingMain.addDivider();

    const plugins = pluginManagers.getPlugins();
    settingMain.addLabel(`§7Plugins (§c${plugins.length}§7)§r`);
    for (const plugin of plugins) {
      const btn = plugin.getSettings().buttons;
      const page = plugin.getSettings().mainPage(pl, (pl: Player) => this.settingMenu(pl, pluginManagers));

      settingMain.addButton(
        btn.name + `\n§8[${plugin.isEnabled() ? "§2Enabled" : "§cDisabled"}§8]`,
        btn.icon,
        () => {
          page.show(pl);
        },
      );
    }
    settingMain.show(pl);
  }
}

class SettingMenu {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get buttons() {
    return {
      name: this.plugin.name,
      description: `Settings for ${this.plugin.name} plugin`,
      icon: "textures/items/diamond",
    };
  }

  private pages(pl: Player, previousForm: (pl: Player) => void) {
    const forms = new IActionForm(
      `${this.plugin.name} Settings`,
      this.buttons.description,
      previousForm
    );
    forms.addDivider();
    forms.addButton("§cBack", "", () => {
      previousForm(pl);
    });

    return forms;
  }

  public mainPage(pl: Player, previousForm: (pl: Player) => void) {
    const pages = this.pages(pl, previousForm);
    return pages;
  }
}

export { SettingMenu, SettingMenuBuilders };
