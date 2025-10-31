import {
  ShutdownEvent,
  StartupEvent,
  System,
  system,
  SystemAfterEvents,
  SystemBeforeEvents,
  World,
  world,
  WorldAfterEvents,
  WorldBeforeEvents,
} from "@minecraft/server";
import { EventHandlers } from "./EventHanlders.ts";
import { AfterEvents, WorldEvents } from "../types/WorldEvents.ts";
import { PluginManagers } from "./PluginManagers.ts";
import { ConfigManagers } from "./ConfigManagers.ts";
import { Logger } from "./Logger.ts";
import { SettingMenuBuilders } from "./SettingMenuBuilders.ts";
import { SystemBaseOptions } from "../types/SystemBaseOptions.ts";

class SystemBase {
  public world: World;
  public system: System;
  public configManager: ConfigManagers;
  public events: EventHandlers<WorldEvents>;
  public pluginManagers: PluginManagers;
  public logger: Logger;
  public settingMenuBuilders: SettingMenuBuilders;
  private options: SystemBaseOptions = {
    settingItemType: "minecraft:clock",
  };

  constructor(options?: SystemBaseOptions) {
    this.world = world;
    this.system = system;
    this.events = new EventHandlers<WorldEvents>();
    this.logger = new Logger("SYSTEM");
    this.configManager = new ConfigManagers();
    this.pluginManagers = new PluginManagers(this.events, this);
    this.settingMenuBuilders = new SettingMenuBuilders();
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.initializeEvents();
  }

  private initializeEvents() {
    this.mapEvents();

    this.events.on("AfterItemUse", (ev) => {
      if (ev.itemStack.typeId !== this.options.settingItemType) return;

      this.settingMenuBuilders.settingMenu(ev.source, this.pluginManagers);
    });

    this.events.on("BeforeStartup", (ev) => this.onStartup(ev));
    this.events.on("BeforeShutdown", (ev) => this.onShutdown(ev));
  }

  public onLoad(ev: StartupEvent): void {
    ev;
  }

  private onStartup(ev: StartupEvent): void {
    this.onLoad(ev);

    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onEnable(ev);
    }
  }

  private onShutdown(ev: ShutdownEvent): void {
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onDisable(ev);
    }
  }

  private mapEvents() {
    const AfterEventKeys = getEventsKeys(world.afterEvents);
    const BeforeEventKeys = getEventsKeys(world.beforeEvents);

    const BeforeSystemEventKeys = getEventsKeys(system.beforeEvents);
    const AfterSystemEventKeys = getEventsKeys(system.afterEvents);

    AfterEventKeys.forEach((eventKey) => {
      const typedKey = eventKey as keyof WorldAfterEvents;

      this.world.afterEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("After", eventKey) as keyof AfterEvents;

        this.events.emit(emitName, arg);
      });
    });

    BeforeEventKeys.forEach((eventKey) => {
      const typedKey = eventKey as keyof WorldBeforeEvents;

      this.world.beforeEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("Before", eventKey) as keyof WorldEvents;
        this.events.emit(emitName, arg);
      });
    });

    BeforeSystemEventKeys.forEach((eventKey) => {
      const typedKey = eventKey as keyof SystemBeforeEvents;

      this.system.beforeEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("Before", eventKey) as keyof WorldEvents;
        this.events.emit(emitName, arg);
      });
    });

    AfterSystemEventKeys.forEach((eventKey) => {
      const typedKey = eventKey as keyof SystemAfterEvents;

      this.system.afterEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("After", eventKey) as keyof AfterEvents;
        this.events.emit(emitName, arg);
      });
    });
  }
}

function getEventsKeys(event: unknown) {
  const prototype = Object.getPrototypeOf(event);
  const propertiesName = Object.getOwnPropertyNames(prototype);

  return propertiesName.filter((k) => k !== "constructor");
}

function getEmitName(prefix: string, eventKey: string) {
  return `${prefix}${eventKey.charAt(0).toUpperCase()}${eventKey.slice(1)}`;
}

export { SystemBase };