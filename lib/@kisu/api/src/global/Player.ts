import { Player } from "@minecraft/server";

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
  const text = "§N§O§T§I§F§I§C§A§T§I§O§N" + adjustTextLength(title, 100) + adjustTextLength('§7' + message, 600) + adjustTextLength(icon, 200) + adjustTextLength(background, 200)
  this.sendMessage(text);
  this.playSound("note.harp", { volume: 0.6, pitch: 1.5 });
  return;
};

Player.prototype.sendTopbar = function (message: string): void {
  this.onScreenDisplay.setTitle("§m§c" + message);
  return;
}

Player.prototype.stopTopbar = function (): void {
  this.onScreenDisplay.setTitle("§m§c");
  return;
}

Player.prototype.sendBottomBar = function (message: string): void {
  this.onScreenDisplay.setTitle("§m§e" + message);
  return;
}

Player.prototype.stopBottomBar = function (): void {
  this.onScreenDisplay.setTitle("§m§e");
  return;
}