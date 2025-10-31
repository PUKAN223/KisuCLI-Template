export interface PackBuilderOptions {
    packsPath?: string;
    distPath?: string;
    name: string
    env: Record<string, string>;
}