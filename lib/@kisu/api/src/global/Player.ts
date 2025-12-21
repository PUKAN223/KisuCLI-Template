import { Player } from "npm:@minecraft/server@2.5.0-beta.1.21.131-stable";

declare global {
  interface Player {
    sendToast(title?: string, message?: string, icon?: string, background?: string): void;
    sendTopbar(message: string): void;
    stopTopbar(): void;
  }
}

function adjustTextLength(text = "", totalLength = 100) {
  return (text.slice(0, totalLength)).padEnd(totalLength, "\t");
}

Player.prototype.sendToast = function (title: string = "", message: string = "", icon: string = "", background: string = "textures/ui/greyBorder"): void {
  const text = "§N§O§T§I§F§I§C§A§T§I§O§N" + adjustTextLength(title, 100) + adjustTextLength(message, 200) + adjustTextLength(icon, 100) + adjustTextLength(background, 100)
  this.sendMessage(text);
  return;
};

Player.prototype.sendTopbar = function (message: string): void {
  this.onScreenDisplay.setTitle("ud0" + message);
  return;
}

Player.prototype.stopTopbar = function (): void {
  this.onScreenDisplay.setTitle("ud0");
  return;
}