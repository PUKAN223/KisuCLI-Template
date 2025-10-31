import { ShutdownEvent, StartupEvent, system, System, world, World, WorldLoadAfterEvent } from "@minecraft/server";
import { WorldEvents } from "../types/WorldEvents.ts";
import { EventHandlers } from "./EventHanlders.ts";
import { Logger } from "./Logger.ts";
import { SystemBase } from "./SystemBase.ts";
import { Config } from "./ConfigManagers.ts";
import { SettingMenu } from "./SettingMenuBuilders.ts";
import { PluginEventHandlers } from "./PluginEventHanlders.ts";

class PluginBase {
    public events: PluginEventHandlers;
    public name: string = "PluginBase";
    public version: string = "1.0.0";
    public world: World;
    public system: System;
    public systemBase: SystemBase;
    public settingMenu: SettingMenu;

    constructor(events: EventHandlers<WorldEvents>, systemBase: SystemBase) {
        this.events = new PluginEventHandlers(this, events);
        this.world = world;
        this.system = system;
        this.systemBase = systemBase;
        this.settingMenu = new SettingMenu(this);
        this.events.on("AfterWorldLoad", (ev) => this.onLoad(ev));
    }

    get config(): Config {
        return this.systemBase.configManager.getConfig(this.name)!;
    }

    get logger() {
        return new Logger(this.name.toUpperCase());
    }

    public getName(): string {
        return this.name;
    }

    public onEnable(ev: StartupEvent): void {
        ev;
    }

    public onLoad(ev: WorldLoadAfterEvent): void {
        ev;
    }

    public onDisable(ev: ShutdownEvent): void {
        ev;
    }

    public isEnabled(): boolean {
        return true;
    }

    public registerSettings(menu: typeof SettingMenu): void {
        this.settingMenu = new menu(this);
    }
    
    public getSettings() {
        return this.settingMenu;
    }
}

export { PluginBase };