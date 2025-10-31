import chalk, { ChalkObj } from "@nothing628/chalk";
import { FileManagers } from "./FileManagers.ts";
import { Logger } from "./Logger.ts";

class Filters {
    private name: string;
    public basePath: string = "./data/dist";
    public fileManagers;
    public logger: Logger;

    constructor(name: string) {
        this.name = name;
        this.fileManagers = new FileManagers();
        this.logger = new Logger();
    }

    public getName() {
        return this.name;
    }

    public msg(message: string) {
        this.logger.msg(message, this.getName(), chalk.bgHex("#808080") as ChalkObj);
    }

    async apply(): Promise<void> {

    }
}

class FilterManagers {
    private filters: (typeof Filters)[] = [];
    private logger: Logger;

    constructor() {
        this.logger = new Logger();
    }

    //any class that extends Filters can be registered
    public registerFilter(filter: typeof Filters) {
        this.filters.push(filter);
    }

    public getFilters() {
        return this.filters;
    }

    async applyFilters(): Promise<void> {
        for (const filter of this.filters) {
            const filterInstance = new filter(filter.name);
            await filterInstance.apply();
            this.logger.msg(`Applied filter: ${filterInstance.getName()}`, filterInstance.getName(), chalk.bgHex("#808080") as ChalkObj);
        }
    }
}

export { Filters, FilterManagers };