import { EventHandlers, WorldEvents } from "@kisu/api";
import { PluginBase } from "./PluginBase.ts";

class PluginEventHandlers {
  private plugin: PluginBase;
  private eventHandlers: EventHandlers<WorldEvents>;

  constructor(plugin: PluginBase, eventHandlers: EventHandlers<WorldEvents>) {
    this.plugin = plugin;
    this.eventHandlers = eventHandlers;
  }

  on<T extends keyof WorldEvents>(event: T, listener: (payload: WorldEvents[T]) => void): void {
    this.eventHandlers.on(this.plugin, event, listener)
  }

  emit<T extends keyof WorldEvents>(event: T, payload: WorldEvents[T]): void {
    this.eventHandlers.emit(event, payload);
  }
}

export { PluginEventHandlers };
