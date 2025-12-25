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
import {
  ConfigManagers,
  EventHandlers,
  Logger,
  PluginManagers,
  SettingMenuBuilders,
  type SystemBaseOptions,
  type WorldEvents,
} from "@kisu/api";
import { PlayerManagers } from "./PlayerManagers.ts";
import { SystemPlugin } from "../plugins/SystemPlugin/index.ts";
// import { SystemPlugin } from "../plugins/SystemPlugin/index.ts";

class SystemBase {
  public world: World;
  public system: System;
  public configManager: ConfigManagers;
  public events: EventHandlers<WorldEvents>;
  public pluginManagers: PluginManagers;
  public logger: Logger;
  public settingMenuBuilders: SettingMenuBuilders;
  public playerManagers: PlayerManagers;
  private options: SystemBaseOptions = {
    settingItemType: "minecraft:clock",
  };
  
  // Track subscribed handlers alongside their owning signal so we can unsubscribe with the same callback
  private eventSubscriptions = new Map<string, { signal: { unsubscribe: (cb: (arg: unknown) => void) => void }; handler: (arg: unknown) => void }>();
  private startTime: number = Date.now();

  constructor(options?: SystemBaseOptions) {
    this.world = world;
    this.system = system;
    this.events = new EventHandlers<WorldEvents>();
    this.logger = new Logger("SYSTEM");
    this.configManager = new ConfigManagers();
    this.pluginManagers = new PluginManagers(this.events, this);
    this.settingMenuBuilders = new SettingMenuBuilders();
    this.playerManagers = new PlayerManagers();
    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.setupDynamicEventMapping();
    this.initializeEvents();
  }

  private initializeEvents() {
    this.events.on("AfterItemUse", (ev) => {
      if (ev.itemStack.typeId !== this.options.settingItemType) return;
      this.settingMenuBuilders.settingMenu(ev.source, this.pluginManagers);
    });

    this.events.on("BeforeStartup", (ev) => this.onStartup(ev));
    this.events.on("BeforeShutdown", (ev) => this.onShutdown(ev));

    system.runInterval(() => {
      this.events.emit("AfterTick", { currentTick: system.currentTick });
    });
  }

  private setupDynamicEventMapping() {
    this.events.setSubscriptionHandlers(
      (event) => this.subscribeToEvent(event),
      (event) => {
        this.unsubscribeFromEvent(event)
      },
    );
  }

  private subscribeToEvent(eventName: string) {
    if (this.eventSubscriptions.has(eventName)) return;

    const isAfter = eventName.startsWith("After");
    const baseEventName = eventName.replace(/^(After|Before)/, "");
    const lowerEventName = baseEventName.charAt(0).toLowerCase() +
      baseEventName.slice(1);

    // Try world events first
    if (isAfter && lowerEventName in world.afterEvents) {
      const typedKey = lowerEventName as keyof WorldAfterEvents;
      const handler = (arg: unknown) => {
        this.events.emit(eventName as keyof WorldEvents, arg as WorldEvents[keyof WorldEvents]);
      };
      world.afterEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, { signal: world.afterEvents[typedKey], handler });
    } else if (!isAfter && lowerEventName in world.beforeEvents) {
      const typedKey = lowerEventName as keyof WorldBeforeEvents;
      const handler = (arg: unknown) => {
        this.events.emit(eventName as keyof WorldEvents, arg as WorldEvents[keyof WorldEvents]);
      };
      world.beforeEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, { signal: world.beforeEvents[typedKey], handler });
    } // Try system events
    else if (isAfter && lowerEventName in system.afterEvents) {
      const typedKey = lowerEventName as keyof SystemAfterEvents;
      const handler = (arg: unknown) => {
        this.events.emit(eventName as keyof WorldEvents, arg as WorldEvents[keyof WorldEvents]);
      };
      system.afterEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, { signal: system.afterEvents[typedKey], handler });
    } else if (!isAfter && lowerEventName in system.beforeEvents) {
      const typedKey = lowerEventName as keyof SystemBeforeEvents;
      const handler = (arg: unknown) => {
        this.events.emit(eventName as keyof WorldEvents, arg as WorldEvents[keyof WorldEvents]);
      };
      system.beforeEvents[typedKey].subscribe(handler);
      this.eventSubscriptions.set(eventName, { signal: system.beforeEvents[typedKey], handler });
    }
  }

  private unsubscribeFromEvent(eventName: string) {
    const subscription = this.eventSubscriptions.get(eventName);
    if (!subscription) return;

    system.run(() => subscription.signal.unsubscribe(subscription.handler));
    this.eventSubscriptions.delete(eventName);
  }

  public onLoad(_ev: StartupEvent): void {}

  private onStartup(ev: StartupEvent): void {
    try {
      this.onLoad(ev);
    } catch (error) {
      this.logger.error(`Error during onLoad: ${(error as Error)}`);
    }
    this.pluginManagers.registerPlugin(SystemPlugin);
    const plugins = this.pluginManagers.getPlugins();
    let pluginLoadCount = 0;
    for (const plugin of plugins) {
      try {
        plugin.onEnable(ev);
      } catch (error) {
        this.logger.error(
          `Error during onEnable of plugin ${plugin.name}: ${(error as Error)}`,
        );
      }
      pluginLoadCount++;
    }

    system.run(() => {
      const endTime = Date.now();
      const loadDuration = endTime - this.startTime;

      this.playerManagers.eachPlayer((pl) => {
        pl.sendToast(
          "",
          `${"Plugin Loaded".mcColors().grey} (${pluginLoadCount.toString().mcColors().green}/${plugins.length.toString().mcColors().red}) ${`in ${loadDuration}ms`.mcColors().grey}`,
          "textures/items/compass_item",
          "textures/ui/greyBorder",
        );
      });
    });
  }

  private onShutdown(ev: ShutdownEvent): void {
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onDisable(ev);
    }
  }
}

export { SystemBase };
