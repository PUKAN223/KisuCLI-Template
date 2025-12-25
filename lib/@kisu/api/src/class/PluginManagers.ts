import { type WorldEvents, EventHandlers, PluginBase, SystemBase } from "@kisu/api";
import { system } from "@minecraft/server";

class PluginManagers {
    private plugins: Map<string, PluginBase> = new Map();
    private pausedListeners: Map<string, Map<string, ((payload: unknown) => void)[]>> = new Map();
    private eventHandlers: EventHandlers<WorldEvents>;
    private SystemBase: SystemBase;

    constructor(event: EventHandlers<WorldEvents>, system: SystemBase) {
        this.eventHandlers = event;
        this.SystemBase = system;
    }

    public registerPlugin(...plugin: typeof PluginBase[]): void {
        for (const p of plugin) {
            const instance = new p(this.eventHandlers, this.SystemBase);
            this.plugins.set(instance.name, instance);
            system.run(() => this.applyPluginState(instance));
        }
    }

    public getPlugin(name: string): PluginBase | null {
        return this.plugins.get(name) || null;
    }

    public getPlugins(): PluginBase[] {
        return Array.from(this.plugins.values());
    }

    public isEnabled(name: string): boolean {
        const plugin = this.plugins.get(name);
        if (!plugin) return false;

        return plugin.isEnabled();
    }

    public applyPluginState(plugin: PluginBase): void {
        if (plugin.isEnabled()) {
            this.enablePlugin(plugin);
            return;
        }

        this.disablePlugin(plugin);
    }

    public setPluginEnabled(name: string, enabled: boolean): void {
        const plugin = this.plugins.get(name);
        if (!plugin) return;

        const config = plugin.config.get() ?? {};
        const settings = plugin.getPluginSettings();
        if (!settings.Enabled) return;
        config.Enabled = { ...settings.Enabled, value: enabled };
        plugin.config.set(config);

        this.applyPluginState(plugin);
    }

    private disablePlugin(plugin: PluginBase): void {
        if (this.pausedListeners.has(plugin.name)) return;

        const paused = this.eventHandlers.suspendPlugin(plugin);
        this.pausedListeners.set(plugin.name, paused);
    }

    private enablePlugin(plugin: PluginBase): void {
        const paused = this.pausedListeners.get(plugin.name);
        if (!paused) {
            return;
        }

        console.warn(`Enabling plugin: ${plugin.name}`);
        if (!plugin.isLoaded) {
            console.warn(`Loading plugin fresh: ${plugin.name} (discarding paused listeners to avoid duplicates)`);
            plugin.load();
            this.pausedListeners.delete(plugin.name);
            return;
        }

        this.eventHandlers.resumePlugin(plugin, paused);
        this.pausedListeners.delete(plugin.name);
    }
}

export { PluginManagers };