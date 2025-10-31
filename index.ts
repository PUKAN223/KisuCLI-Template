import { TSBuilds } from "./data/filters/TSBuilds/index.ts";
import { PackBuilder } from "./data/src/class/PackBuilders.ts"
import { load } from "@std/dotenv"

const env = await load({ envPath: ".env", export: true });
const pack_name = env.PACK_NAME || "MyPack";
const pb = new PackBuilder({
    name: pack_name,
    env,
});

const filters = pb.filters();
filters.registerFilter(TSBuilds);

console.clear();
const args = Deno.args;
if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: deno run --allow-read --allow-write --allow-env index.ts [--build] [--packs] [--clean]");
    Deno.exit(0);
}

const runBuild = args.includes("--build");
const runPacks = args.includes("--packs");
const runClean = args.includes("--clean");

if (!runBuild && !runPacks && !runClean) {
    await pb.build();
    pb.copyTo();
} else {
    if (runClean) {
        pb.clean();
    }

    if (runBuild) {
        await pb.build();
    }

    if (runPacks) {
        await pb.pack();
    }
}