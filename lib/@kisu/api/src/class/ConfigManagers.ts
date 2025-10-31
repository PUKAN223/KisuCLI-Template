import { world, World } from "@minecraft/server";

class ConfigManagers {
    constructor() {

    }

    public getConfig(name: string): Config | null {
        return new Config(name);
    }

    public clearAll() {
        const properties = world.getDynamicPropertyIds();
        for (const key in properties) {
            if (key.startsWith("config.")) {
                world.setDynamicProperty(key);
            }
        }
    }
}

class Config {
    private name: string;
    private world: World;
    private prefix: string;

    constructor(name: string) {
        this.name = name;
        this.world = world;
        this.prefix = `config.${this.name}`;
    }

    set<T>(key: string, value: T): void {
        this.world.setDynamicProperty(`${this.prefix}.${key}`, JSON.stringify(value));
        return;
    }

    get<T>(key: string): T | null {
        const value = this.world.getDynamicProperty(`${this.prefix}.${key}`) as string;
        if (!value) return null;
        return JSON.parse(value) as T;
    }

    delete(key: string): void {
        this.world.setDynamicProperty(`${this.prefix}.${key}`);
        return;
    }

    has(key: string): boolean {
        const value = this.world.getDynamicProperty(`${this.prefix}.${key}`);
        return value !== undefined;
    }

    clear(): void {
        const properties = this.world.getDynamicPropertyIds();
        for (const key in properties) {
            if (key.startsWith(this.prefix)) {
                this.world.setDynamicProperty(key);
            }
        }
    }
}

export { ConfigManagers, Config };