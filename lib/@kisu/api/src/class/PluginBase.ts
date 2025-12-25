import {
  ShutdownEvent,
  StartupEvent,
  System,
  system,
  World,
  world
} from "@minecraft/server";
import {
  Config,
  EventHandlers,
  Logger,
  PluginEventHandlers,
  type PluginSettingOptions,
  SettingMenu,
  SystemBase,
  type WorldEvents,
} from "@kisu/api";
import { PlayerManagers } from "./PlayerManagers.ts";
import { ItemActionManager } from "./ItemActionManager.ts";

class PluginBase {
  public isLoaded: boolean = false;
  public events: PluginEventHandlers;
  public name: string = "PluginBase";
  public version: string = "1.0.0";
  public icon: string = ""
  public world: World;
  public system: System;
  public systemBase: SystemBase;
  public settingMenu: SettingMenu;
  public playerManagers: PlayerManagers;
  public itemActionManager: ItemActionManager;
  public isRuntime: boolean = false;

  constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
    this.events = new PluginEventHandlers(this, events);
    this.world = world;
    this.system = system;
    this.systemBase = systemBase;
    this.settingMenu = new SettingMenu(this, this.getPluginSettings());
    this.playerManagers = new PlayerManagers();
    this.itemActionManager = new ItemActionManager(this);
    this.system.run(() => {
      if (!this.isEnabled()) return;
      this.systemBase.pluginManagers.applyPluginState(this);
      this.load();
    });
  }

  get config(): Config<PluginSettingOptions> {
    return this.systemBase.configManager.getConfig(this.name)!;
  }

  get logger() {
    return new Logger(this.name.toUpperCase());
  }

  public load() {
    this.initializeConfig();
    this.onLoad();
    this.isLoaded = true;
  }

  public getName(): string {
    return this.name;
  }

  public onEnable(_ev: StartupEvent): void {
  }

  public onLoad(): void {
  }

  public onDisable(_ev: ShutdownEvent): void {
  }

  public isEnabled(): boolean {
    const config = this.config.get();
    const enabledSetting = (config as PluginSettingOptions | undefined)?.["Enabled"];

    if (enabledSetting && "value" in enabledSetting) {
      return Boolean(enabledSetting.value);
    }

    if (enabledSetting && "default" in enabledSetting) {
      return Boolean(enabledSetting.default);
    }

    return true;
  }

  public registerSettings(menu: typeof SettingMenu): void {
    this.settingMenu = new menu(this, this.getPluginSettings());
  }

  public getPluginSettings(): PluginSettingOptions {
    return {
      ["Enabled"]: {
        description: "Toggle this plugin on or off.",
        type: "boolean",
        default: true,
      },
      ...this.getSettings(),
    };
  }

  public getSettings(): PluginSettingOptions {
    return {};
  }

  public getAdvancedSettings(_pl: Player, _plugin: PluginBase): (() => void) | null {
    return null;
  }

  private initializeConfig() {
    let config = this.config.get();
    if (!config) {
      this.config.set({});
      config = this.config.get()!;
    }

    const pluginSettings = this.getPluginSettings();
    const configUnUsedKeys = Object.keys(config).filter(
      (key) => !(key in pluginSettings),
    );
    for (const key of configUnUsedKeys) {
      delete config[key];
    }

    for (const [key, setting] of Object.entries(pluginSettings)) {
      if (!(key in config) || config[key]?.type !== setting.type || config[key]?.description !== setting.description || config[key]?.default !== setting.default) {
        config[key] = { ...setting, value: config[key]?.value ?? setting.default };
      }
    }
    this.config.set(config);
  }
}

export { PluginBase };
