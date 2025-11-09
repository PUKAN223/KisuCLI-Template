import { ItemStack, world } from "@minecraft/server";
import { DatabaseMap } from "./DatabaseMap.ts";
import { IProductData } from "../types/IProductData.ts";
import { QuickItemDatabase } from "./QickItemDatabase.ts";
import { RandomCode } from "../utils/RandomCode.ts";

export enum ProductGetOptions {
    owners,
    typeid,
    all
}

export class Product {
    private itemStack: ItemStack
    private owners: string
    private prices: number
    private db: DatabaseMap<IProductData>
    private itemDB: QuickItemDatabase
    constructor(itemStack: ItemStack, owners: string, prices: number, page: number, itemDB: QuickItemDatabase) {
        this.itemStack = itemStack
        this.owners = owners
        this.prices = prices
        this.db = new DatabaseMap<IProductData>(`market:${page}`)
        this.itemDB = itemDB
    }

    public addProduct() {
        const key = `${RandomCode(5, [...this.db.keys()])}`
        console.warn(key, 'add product', this.itemStack.amount);
        const dataSave: IProductData = {
            itemStack: key,
            owner: this.owners,
            prices: this.prices,
            releaseDate: Date.now(),
            history: [],
            isHide: false
        }
        this.db.set(key, dataSave)
        // Clone the itemStack to avoid reference issues and store as array with single item
        const clonedItemStack = this.itemStack.clone()
        this.itemDB.set(key, [clonedItemStack])
        return dataSave
    }

    static removeProduct(key: string, itemDB: QuickItemDatabase, db: DatabaseMap<IProductData>) {
        itemDB.delete(db.get(key)!.itemStack)
        db.delete(key)
    }

    static setProduct(key: string, page: number, data: IProductData) {
        const db = new DatabaseMap<IProductData>(`market:${page}`)
        db.set(key, data)
    }

    static getProduct(getBy: ProductGetOptions, options?: { owners?: string, typeId?: string, hide?: boolean }) {
        if (getBy == ProductGetOptions.all) {
            const data = new Set<IProductData>()
            const lastId: string[] = [];
            world.getDynamicPropertyIds().filter(x => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach(id => {
                const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
                if (lastId.some(part => part == idParts)) return;
                lastId.push(idParts);
                [...new DatabaseMap<IProductData>(idParts).values()].forEach(d => {
                    if (options?.hide ?? false) {
                        if (!d.isHide) {
                            data.add(d)
                        }
                    } else {
                        data.add(d)
                    }
                })
            })
            // let data: ProductModels[] = []
            // world.getDynamicPropertyIds().filter(x => x.startsWith("market:")).forEach(id => {
            //     new DynamicProperties<ProductModels>(id).map(x => x[1]).forEach(d => {
            //         data.push(d)
            //     })
            // })
            return [...data]
        } else if (getBy == ProductGetOptions.owners) {
            const data = new Set<IProductData>()
            const lastId: string[] = [];
            world.getDynamicPropertyIds().filter(x => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach(id => {
                const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
                if (lastId.some(part => part == idParts)) return;
                lastId.push(idParts);
                [...new DatabaseMap<IProductData>(idParts).values()].forEach(d => {
                    data.add(d)
                })
            })
            console.warn([...data].map(x => x.itemStack).join(", "));
            return [...data].filter(x => x.owner == options?.owners)
        } else {
            const data = new Set<IProductData>()
            const dataReturn = []
            const lastId: string[] = [];
            world.getDynamicPropertyIds().filter(x => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach(id => {
                const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
                if (lastId.some(part => part == idParts)) return;
                lastId.push(idParts);
                [...new DatabaseMap<IProductData>(idParts).values()].forEach(d => {
                    data.add(d)
                })
            })
            for (let i = 0; i < data.size; i++) {
                if ((new QuickItemDatabase(`it_market`, 5, 1).get([...data][i].itemStack)! as ItemStack[])[0]!.typeId == options?.typeId) {
                    dataReturn.push([...data][i])
                }
            }
            return dataReturn
        }
    }
}