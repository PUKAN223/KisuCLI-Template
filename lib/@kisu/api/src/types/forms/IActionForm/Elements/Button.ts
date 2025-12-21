import { RawText } from "npm:@minecraft/server@2.5.0-beta.1.21.131-stable";

export type IActionFormButton = {
    label: RawText | string;
    icon?: string;
    onClick?: () => void;
}