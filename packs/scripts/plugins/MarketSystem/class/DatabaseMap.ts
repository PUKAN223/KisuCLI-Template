import { system, Vector3, world } from "@minecraft/server";

type DynamicPropertyValue = boolean | number | string | Vector3;

export class DatabaseMap<T extends unknown = unknown> {
    protected readonly id: string;
    protected readonly map: Map<string, T>;

    public constructor(id: string) {
        this.id = id;
        this.map = new Map();
        
        const propertyKey = `$DatabaseMap\u241E${this.id}\u241E`;
        for (const dynamicPropertyId of world.getDynamicPropertyIds()) {
            if (!dynamicPropertyId.startsWith(propertyKey)) continue;
            const value = world.getDynamicProperty(dynamicPropertyId)!;
            if (typeof value !== "string") continue;

            const key = dynamicPropertyId.substring(dynamicPropertyId.lastIndexOf("\u241E") + 1);
            this.map.set(key, JSON.parse(value));
        }
    }

    public get size(): number { return this.map.size; }
    public keys(): MapIterator<string> { return this.map.keys(); }
    public values(): MapIterator<T> { return this.map.values(); }
    public entries(): MapIterator<[string, T]> { return this.map.entries(); }
    public [Symbol.iterator](): MapIterator<[string, T]> { return this.entries(); }

    public edit(key: string, callback: (value: T) => T | undefined): void {
        if (!this.has(key)) return;
        const newValue = callback(this.get(key)!);
        if (newValue === undefined) this.delete(key);
        else this.set(key, newValue);
    }

    public set(key: string, value: T, initialSet: boolean = false): void {
        if (this.has(key)) {
            if (initialSet) return;
        }

        this.setLocal(key, JSON.stringify(value));
        this.map.set(key, value);
    }

    public get(key: string): T | undefined {
        return this.map.get(key);
    }

    public delete(key: string): boolean {
        if (this.map.has(key)) {
            this.setLocal(key, undefined);
            this.map.delete(key);
            return true;
        }

        return false;
    }

    public has(key: string): boolean {
        return this.map.has(key);
    }

    public async clearAsync(): Promise<void> {
        if (this.map.size > 0) {
            const _this = this as DatabaseMap<T>;

            return await new Promise((resolve) => {
                function *clearLocal(): Generator<void, void, void> {
                    for (const key of _this.map.keys()) {
                        _this.setLocal(key, undefined);
                        yield;
                    }
    
                    _this.map.clear();
                    resolve();
                }
    
                system.runJob(clearLocal());
            });
        }
    }

    private setLocal(key: string, value: DynamicPropertyValue | undefined = undefined): void {
        world.setDynamicProperty(`$DatabaseMap\u241E${this.id}\u241E${key}`, value);
    }
}