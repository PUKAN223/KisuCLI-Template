// lib/@kisu/api/src/class/ConfigManagers.ts
import { world } from "@minecraft/server";
var ConfigManagers = class {
  constructor() {
  }
  getConfig(name) {
    return new Config(name);
  }
  clearAll() {
    const properties = world.getDynamicPropertyIds();
    for (const key in properties) {
      if (key.startsWith("config.")) {
        world.setDynamicProperty(key);
      }
    }
  }
};
var Config = class {
  name;
  world;
  prefix;
  constructor(name) {
    this.name = name;
    this.world = world;
    this.prefix = `config.${this.name}`;
  }
  set(key, value) {
    this.world.setDynamicProperty(`${this.prefix}.${key}`, JSON.stringify(value));
    return;
  }
  get(key) {
    const value = this.world.getDynamicProperty(`${this.prefix}.${key}`);
    if (!value) return null;
    return JSON.parse(value);
  }
  delete(key) {
    this.world.setDynamicProperty(`${this.prefix}.${key}`);
    return;
  }
  has(key) {
    const value = this.world.getDynamicProperty(`${this.prefix}.${key}`);
    return value !== void 0;
  }
  clear() {
    const properties = this.world.getDynamicPropertyIds();
    for (const key in properties) {
      if (key.startsWith(this.prefix)) {
        this.world.setDynamicProperty(key);
      }
    }
  }
};

// lib/@kisu/api/src/class/EventHanlders.ts
var EventHandlers = class {
  autoListeners = /* @__PURE__ */ new Map();
  customListeners = /* @__PURE__ */ new Map();
  on(...args) {
    if (typeof args[0] === "string") {
      const event2 = args[0];
      const callback2 = args[1];
      const listeners2 = event2.startsWith("Custom") ? this.customListeners : this.autoListeners;
      const list2 = listeners2.get(event2) ?? [];
      list2.push({ cb: callback2 });
      listeners2.set(event2, list2);
      return;
    }
    const owner = args[0];
    const event = args[1];
    const callback = args[2];
    const listeners = event.startsWith("Custom") ? this.customListeners : this.autoListeners;
    const list = listeners.get(event) ?? [];
    list.push({ owner, cb: callback });
    listeners.set(event, list);
  }
  off(...args) {
    if (typeof args[0] === "string") {
      const event2 = args[0];
      const callback2 = args[1];
      const listeners2 = event2.startsWith("Custom") ? this.customListeners : this.autoListeners;
      const list2 = listeners2.get(event2);
      if (!list2) return;
      listeners2.set(event2, list2.filter((l) => l.cb !== callback2));
      return;
    }
    const owner = args[0];
    const event = args[1];
    const callback = args[2];
    const listeners = event.startsWith("Custom") ? this.customListeners : this.autoListeners;
    const list = listeners.get(event);
    if (!list) return;
    if (callback) {
      listeners.set(event, list.filter((l) => !(l.owner === owner && l.cb === callback)));
    } else {
      listeners.set(event, list.filter((l) => l.owner !== owner));
    }
  }
  emit(event, payload) {
    const listeners = event.startsWith("Custom") ? this.customListeners : this.autoListeners;
    const list = listeners.get(event);
    if (!list) return;
    for (const listener of list) {
      try {
        if (listener.owner) {
          const owner = listener.owner;
          if (typeof owner.isEnabled() !== "undefined") {
            if (owner.isEnabled()) {
              listener.cb(payload);
            }
          } else {
            listener.cb(payload);
          }
        } else {
          listener.cb(payload);
        }
      } catch (_e) {
      }
    }
  }
};

// lib/@kisu/api/src/class/Logger.ts
var Logger = class {
  prefix;
  constructor(prefix) {
    this.prefix = prefix;
  }
  log(message) {
    this.msg(message, "LOG");
  }
  error(message) {
    this.msg(message, "ERROR");
  }
  warn(message) {
    this.msg(message, "WARN");
  }
  info(message) {
    this.msg(message, "INFO");
  }
  debug(message) {
    this.msg(message, "DEBUG");
  }
  msg(message, type) {
    console.log(`[${this.prefix}][${type}] ${message}`);
  }
};

// lib/@kisu/api/src/class/PluginBase.ts
import { system, world as world2 } from "@minecraft/server";

// lib/@kisu/api/src/class/forms/IActionForm.ts
import { ActionFormData } from "@minecraft/server-ui";
var IActionForm = class {
  title;
  body;
  elements = [];
  previousForm;
  constructor(title = "", body = "", previousForm) {
    this.title = title;
    this.body = body;
    if (previousForm) {
      this.previousForm = previousForm;
    }
  }
  back(pl) {
    if (this.previousForm) this.previousForm(pl);
    return;
  }
  /**
   * Set the form title
   */
  setTitle(title) {
    this.title = title;
    return this;
  }
  /**
   * Set the form body text
   */
  setBody(body) {
    this.body = body;
    return this;
  }
  /**
   * Get the current title
   */
  getTitle() {
    return this.title;
  }
  /**
   * Get the current body text
   */
  getBody() {
    return this.body;
  }
  /**
   * Add multiple buttons at once
   */
  addButtons(buttons) {
    this.elements.push(...buttons);
    return this;
  }
  /**
   * Add a single button
   */
  addButton(label, icon, onClick) {
    this.elements.push({ label, icon, onClick });
    return this;
  }
  /**
   * Add a button object
   */
  addButtonObject(button) {
    this.elements.push(button);
    return this;
  }
  /**
   * Get all buttons from the form
   */
  getButtons() {
    return this.elements.filter(this.isButton);
  }
  /**
   * Add a divider to separate elements
   */
  addDivider() {
    this.elements.push({ divider: true });
    return this;
  }
  /**
   * Get all dividers from the form
   */
  getDividers() {
    return this.elements.filter(this.isDivider);
  }
  /**
   * Add a header text
   */
  addHeader(text) {
    this.elements.push({ text_header: text });
    return this;
  }
  /**
   * Add a header object
   */
  addHeaderObject(header) {
    this.elements.push(header);
    return this;
  }
  /**
   * Get the first header from the form
   */
  getHeader() {
    return this.elements.find(this.isHeader);
  }
  /**
   * Get all headers from the form
   */
  getHeaders() {
    return this.elements.filter(this.isHeader);
  }
  /**
   * Add a label text
   */
  addLabel(text) {
    this.elements.push({ text_label: text });
    return this;
  }
  /**
   * Add a label object
   */
  addLabelObject(label) {
    this.elements.push(label);
    return this;
  }
  /**
   * Get all labels from the form
   */
  getLabels() {
    return this.elements.filter(this.isLabel);
  }
  /**
   * Clear all elements from the form
   */
  clearElements() {
    this.elements = [];
    return this;
  }
  /**
   * Get the total number of elements
   */
  getElementCount() {
    return this.elements.length;
  }
  /**
   * Check if the form has any buttons
   */
  hasButtons() {
    return this.getButtons().length > 0;
  }
  /**
   * Show the form to a player
   */
  async show(player) {
    const form = new ActionFormData();
    form.title(this.title);
    form.body(this.body);
    let buttonIndex = 0;
    const buttonCallbacks = [];
    this.elements.forEach((element) => {
      if (this.isDivider(element)) {
        form.divider();
      } else if (this.isHeader(element)) {
        form.header(element.text_header);
      } else if (this.isLabel(element)) {
        form.label(element.text_label);
      } else if (this.isButton(element)) {
        form.button(element.label, element.icon);
        buttonCallbacks[buttonIndex] = element.onClick || (() => {
        });
        buttonIndex++;
      }
    });
    form.body(this.body);
    try {
      const response = await form.show(player);
      if (!response.canceled && response.selection !== void 0) {
        const callback = buttonCallbacks[response.selection];
        if (callback) {
          callback();
        }
      }
      return response;
    } catch (error) {
      console.error("Error showing form:", error);
      throw error;
    }
  }
  isButton(element) {
    return "label" in element;
  }
  isDivider(element) {
    return "divider" in element && element.divider === true;
  }
  isHeader(element) {
    return "text_header" in element;
  }
  isLabel(element) {
    return "text_label" in element;
  }
};
var IActionForm_default = IActionForm;

// lib/@kisu/api/src/class/SettingMenuBuilders.ts
var SettingMenuBuilders = class {
  menus = /* @__PURE__ */ new Map();
  constructor() {
  }
  registerMenu(menu, plugin) {
    this.menus.set(plugin.name, menu);
  }
  settingMenu(pl, pluginManagers) {
    const settingMain = new IActionForm_default(
      `Settings Menu`,
      `\xA7fHello, \xA7e${pl.name}\xA7r

This is the configuration menu.
You can manage settings here.`
    );
    settingMain.addDivider();
    const plugins = pluginManagers.getPlugins();
    settingMain.addLabel(`\xA77Plugins (\xA7c${plugins.length}\xA77)\xA7r`);
    for (const plugin of plugins) {
      const btn = plugin.getSettings().buttons;
      const page = plugin.getSettings().mainPage(pl, (pl2) => this.settingMenu(pl2, pluginManagers));
      settingMain.addButton(
        btn.name + `
\xA78[${plugin.isEnabled() ? "\xA72Enabled" : "\xA7cDisabled"}\xA78]`,
        btn.icon,
        () => {
          page.show(pl);
        }
      );
    }
    settingMain.show(pl);
  }
};
var SettingMenu = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  get buttons() {
    return {
      name: this.plugin.name,
      description: `Settings for ${this.plugin.name} plugin`,
      icon: "textures/items/diamond"
    };
  }
  pages(pl, previousForm) {
    const forms = new IActionForm_default(
      `${this.plugin.name} Settings`,
      this.buttons.description,
      previousForm
    );
    forms.addDivider();
    forms.addButton("\xA7cBack", "", () => {
      previousForm(pl);
    });
    return forms;
  }
  mainPage(pl, previousForm) {
    const pages = this.pages(pl, previousForm);
    return pages;
  }
};

// lib/@kisu/api/src/class/PluginEventHanlders.ts
var PluginEventHandlers = class {
  plugin;
  eventHandlers;
  constructor(plugin, eventHandlers) {
    this.plugin = plugin;
    this.eventHandlers = eventHandlers;
  }
  on(event, listener) {
    this.eventHandlers.on(this.plugin, event, listener);
  }
  emit(event, payload) {
    this.eventHandlers.emit(event, payload);
  }
};

// lib/@kisu/api/src/class/PluginBase.ts
var PluginBase = class {
  events;
  name = "PluginBase";
  version = "1.0.0";
  world;
  system;
  systemBase;
  settingMenu;
  constructor(events, systemBase) {
    this.events = new PluginEventHandlers(this, events);
    this.world = world2;
    this.system = system;
    this.systemBase = systemBase;
    this.settingMenu = new SettingMenu(this);
    this.events.on("AfterWorldLoad", (ev) => this.onLoad(ev));
  }
  get config() {
    return this.systemBase.configManager.getConfig(this.name);
  }
  get logger() {
    return new Logger(this.name.toUpperCase());
  }
  getName() {
    return this.name;
  }
  onEnable(ev) {
    ev;
  }
  onLoad(ev) {
    ev;
  }
  onDisable(ev) {
    ev;
  }
  isEnabled() {
    return true;
  }
  registerSettings(menu) {
    this.settingMenu = new menu(this);
  }
  getSettings() {
    return this.settingMenu;
  }
};

// lib/@kisu/api/src/class/PluginManagers.ts
var PluginManagers = class {
  plugins = /* @__PURE__ */ new Map();
  eventHandlers;
  SystemBase;
  constructor(event, system6) {
    this.eventHandlers = event;
    this.SystemBase = system6;
  }
  registerPlugin(...plugin) {
    for (const p of plugin) {
      const instance = new p(this.eventHandlers, this.SystemBase);
      this.plugins.set(instance.name, instance);
    }
  }
  getPlugin(name) {
    return this.plugins.get(name) || null;
  }
  getPlugins() {
    return Array.from(this.plugins.values());
  }
  isEnabled(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;
    return true;
  }
};

// lib/@kisu/api/src/class/SystemBase.ts
import {
  system as system2,
  world as world3
} from "@minecraft/server";
var SystemBase = class {
  world;
  system;
  configManager;
  events;
  pluginManagers;
  logger;
  settingMenuBuilders;
  options = {
    settingItemType: "minecraft:clock"
  };
  constructor(options) {
    this.world = world3;
    this.system = system2;
    this.events = new EventHandlers();
    this.logger = new Logger("SYSTEM");
    this.configManager = new ConfigManagers();
    this.pluginManagers = new PluginManagers(this.events, this);
    this.settingMenuBuilders = new SettingMenuBuilders();
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.initializeEvents();
  }
  initializeEvents() {
    this.mapEvents();
    this.events.on("AfterItemUse", (ev) => {
      if (ev.itemStack.typeId !== this.options.settingItemType) return;
      this.settingMenuBuilders.settingMenu(ev.source, this.pluginManagers);
    });
    this.events.on("BeforeStartup", (ev) => this.onStartup(ev));
    this.events.on("BeforeShutdown", (ev) => this.onShutdown(ev));
  }
  onLoad(ev) {
    ev;
  }
  onStartup(ev) {
    this.onLoad(ev);
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onEnable(ev);
    }
  }
  onShutdown(ev) {
    const plugins = this.pluginManagers.getPlugins();
    for (const plugin of plugins) {
      plugin.onDisable(ev);
    }
  }
  mapEvents() {
    const AfterEventKeys = getEventsKeys(world3.afterEvents);
    const BeforeEventKeys = getEventsKeys(world3.beforeEvents);
    const BeforeSystemEventKeys = getEventsKeys(system2.beforeEvents);
    const AfterSystemEventKeys = getEventsKeys(system2.afterEvents);
    AfterEventKeys.forEach((eventKey) => {
      const typedKey = eventKey;
      this.world.afterEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("After", eventKey);
        this.events.emit(emitName, arg);
      });
    });
    BeforeEventKeys.forEach((eventKey) => {
      const typedKey = eventKey;
      this.world.beforeEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("Before", eventKey);
        this.events.emit(emitName, arg);
      });
    });
    BeforeSystemEventKeys.forEach((eventKey) => {
      const typedKey = eventKey;
      this.system.beforeEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("Before", eventKey);
        this.events.emit(emitName, arg);
      });
    });
    AfterSystemEventKeys.forEach((eventKey) => {
      const typedKey = eventKey;
      this.system.afterEvents[typedKey].subscribe((arg) => {
        const emitName = getEmitName("After", eventKey);
        this.events.emit(emitName, arg);
      });
    });
  }
};
function getEventsKeys(event) {
  const prototype = Object.getPrototypeOf(event);
  const propertiesName = Object.getOwnPropertyNames(prototype);
  return propertiesName.filter((k) => k !== "constructor");
}
function getEmitName(prefix, eventKey) {
  return `${prefix}${eventKey.charAt(0).toUpperCase()}${eventKey.slice(1)}`;
}

// packs/scripts/plugins/MarketSystem/class/MarketUi.ts
import { system as system5, world as world7 } from "@minecraft/server";
import {
  ActionFormData as ActionFormData3,
  MessageFormData,
  ModalFormData
} from "@minecraft/server-ui";

// packs/scripts/plugins/MarketSystem/class/DatabaseMap.ts
import { system as system3, world as world4 } from "@minecraft/server";
var DatabaseMap = class {
  id;
  map;
  constructor(id) {
    this.id = id;
    this.map = /* @__PURE__ */ new Map();
    const propertyKey = `$DatabaseMap\u241E${this.id}\u241E`;
    for (const dynamicPropertyId of world4.getDynamicPropertyIds()) {
      if (!dynamicPropertyId.startsWith(propertyKey)) continue;
      const value = world4.getDynamicProperty(dynamicPropertyId);
      if (typeof value !== "string") continue;
      const key = dynamicPropertyId.substring(dynamicPropertyId.lastIndexOf("\u241E") + 1);
      this.map.set(key, JSON.parse(value));
    }
  }
  get size() {
    return this.map.size;
  }
  keys() {
    return this.map.keys();
  }
  values() {
    return this.map.values();
  }
  entries() {
    return this.map.entries();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  edit(key, callback) {
    if (!this.has(key)) return;
    const newValue = callback(this.get(key));
    if (newValue === void 0) this.delete(key);
    else this.set(key, newValue);
  }
  set(key, value, initialSet = false) {
    if (this.has(key)) {
      if (initialSet) return;
    }
    this.setLocal(key, JSON.stringify(value));
    this.map.set(key, value);
  }
  get(key) {
    return this.map.get(key);
  }
  delete(key) {
    if (this.map.has(key)) {
      this.setLocal(key, void 0);
      this.map.delete(key);
      return true;
    }
    return false;
  }
  has(key) {
    return this.map.has(key);
  }
  async clearAsync() {
    if (this.map.size > 0) {
      const _this = this;
      return await new Promise((resolve) => {
        function* clearLocal() {
          for (const key of _this.map.keys()) {
            _this.setLocal(key, void 0);
            yield;
          }
          _this.map.clear();
          resolve();
        }
        system3.runJob(clearLocal());
      });
    }
  }
  setLocal(key, value = void 0) {
    world4.setDynamicProperty(`$DatabaseMap\u241E${this.id}\u241E${key}`, value);
  }
};

// packs/scripts/plugins/MarketSystem/utils/ItemToAuxIds.ts
var typeIdToID = /* @__PURE__ */ new Map([
  ["minecraft:waxed_oxidized_copper_lantern", -1090],
  ["minecraft:waxed_weathered_copper_lantern", -1089],
  ["minecraft:waxed_exposed_copper_lantern", -1088],
  ["minecraft:waxed_copper_lantern", -1087],
  ["minecraft:oxidized_copper_lantern", -1086],
  ["minecraft:weathered_copper_lantern", -1085],
  ["minecraft:exposed_copper_lantern", -1084],
  ["minecraft:copper_lantern", -1083],
  ["minecraft:copper_torch", -1082],
  ["minecraft:waxed_oxidized_copper_chain", -1081],
  ["minecraft:waxed_weathered_copper_chain", -1080],
  ["minecraft:waxed_exposed_copper_chain", -1079],
  ["minecraft:waxed_copper_chain", -1078],
  ["minecraft:oxidized_copper_chain", -1077],
  ["minecraft:weathered_copper_chain", -1076],
  ["minecraft:exposed_copper_chain", -1075],
  ["minecraft:copper_chain", -1074],
  ["minecraft:waxed_oxidized_copper_bars", -1073],
  ["minecraft:waxed_weathered_copper_bars", -1072],
  ["minecraft:waxed_exposed_copper_bars", -1071],
  ["minecraft:waxed_copper_bars", -1070],
  ["minecraft:oxidized_copper_bars", -1069],
  ["minecraft:weathered_copper_bars", -1068],
  ["minecraft:exposed_copper_bars", -1067],
  ["minecraft:copper_bars", -1066],
  ["minecraft:waxed_oxidized_copper_golem_statue", -1046],
  ["minecraft:waxed_weathered_copper_golem_statue", -1045],
  ["minecraft:waxed_exposed_copper_golem_statue", -1044],
  ["minecraft:waxed_copper_golem_statue", -1043],
  ["minecraft:oxidized_copper_golem_statue", -1042],
  ["minecraft:weathered_copper_golem_statue", -1041],
  ["minecraft:exposed_copper_golem_statue", -1040],
  ["minecraft:copper_golem_statue", -1039],
  ["minecraft:waxed_oxidized_copper_chest", -1038],
  ["minecraft:waxed_weathered_copper_chest", -1037],
  ["minecraft:waxed_exposed_copper_chest", -1036],
  ["minecraft:waxed_copper_chest", -1035],
  ["minecraft:oxidized_copper_chest", -1034],
  ["minecraft:weathered_copper_chest", -1033],
  ["minecraft:exposed_copper_chest", -1032],
  ["minecraft:copper_chest", -1031],
  ["minecraft:cactus_flower", -1030],
  ["minecraft:tall_dry_grass", -1029],
  ["minecraft:short_dry_grass", -1028],
  ["minecraft:dried_ghast", -1027],
  ["minecraft:leaf_litter", -1026],
  ["minecraft:firefly_bush", -1025],
  ["minecraft:wildflowers", -1024],
  ["minecraft:bush", -1023],
  ["minecraft:resin_clump", -1022],
  ["minecraft:resin_block", -1021],
  ["minecraft:chiseled_resin_bricks", -1020],
  ["minecraft:closed_eyeblossom", -1019],
  ["minecraft:open_eyeblossom", -1018],
  ["minecraft:resin_brick_wall", -1017],
  ["minecraft:resin_brick_stairs", -1016],
  ["minecraft:resin_brick_slab", -1014],
  ["minecraft:resin_bricks", -1013],
  ["minecraft:creaking_heart", -1012],
  ["minecraft:pale_hanging_moss", -1011],
  ["minecraft:pale_moss_carpet", -1010],
  ["minecraft:pale_moss_block", -1009],
  ["minecraft:mushroom_stem", -1008],
  ["minecraft:pale_oak_leaves", -1007],
  ["minecraft:pale_oak_sapling", -1006],
  ["minecraft:pale_oak_wood", -1005],
  ["minecraft:stripped_pale_oak_wood", -1004],
  ["minecraft:pale_oak_trapdoor", -1002],
  ["minecraft:pale_oak_stairs", -1e3],
  ["minecraft:pale_oak_slab", -998],
  ["minecraft:pale_oak_pressure_plate", -997],
  ["minecraft:pale_oak_planks", -996],
  ["minecraft:pale_oak_log", -995],
  ["minecraft:stripped_pale_oak_log", -994],
  ["minecraft:pale_oak_hanging_sign", -993],
  ["minecraft:pale_oak_fence_gate", -992],
  ["minecraft:pale_oak_fence", -991],
  ["minecraft:pale_oak_door", -990],
  ["minecraft:pale_oak_button", -989],
  ["minecraft:lab_table", -988],
  ["minecraft:element_constructor", -987],
  ["minecraft:material_reducer", -986],
  ["minecraft:underwater_tnt", -985],
  ["minecraft:wet_sponge", -984],
  ["minecraft:red_nether_brick_wall", -983],
  ["minecraft:red_sandstone_wall", -982],
  ["minecraft:prismarine_wall", -981],
  ["minecraft:end_stone_brick_wall", -980],
  ["minecraft:nether_brick_wall", -979],
  ["minecraft:mossy_stone_brick_wall", -978],
  ["minecraft:stone_brick_wall", -977],
  ["minecraft:brick_wall", -976],
  ["minecraft:sandstone_wall", -975],
  ["minecraft:andesite_wall", -974],
  ["minecraft:diorite_wall", -973],
  ["minecraft:granite_wall", -972],
  ["minecraft:mossy_cobblestone_wall", -971],
  ["minecraft:piglin_head", -970],
  ["minecraft:dragon_head", -969],
  ["minecraft:creeper_head", -968],
  ["minecraft:player_head", -967],
  ["minecraft:zombie_head", -966],
  ["minecraft:wither_skeleton_skull", -965],
  ["minecraft:colored_torch_purple", -964],
  ["minecraft:colored_torch_green", -963],
  ["minecraft:coarse_dirt", -962],
  ["minecraft:deprecated_anvil", -961],
  ["minecraft:damaged_anvil", -960],
  ["minecraft:chipped_anvil", -959],
  ["minecraft:smooth_red_sandstone", -958],
  ["minecraft:cut_red_sandstone", -957],
  ["minecraft:chiseled_red_sandstone", -956],
  ["minecraft:smooth_quartz", -955],
  ["minecraft:quartz_pillar", -954],
  ["minecraft:chiseled_quartz_block", -953],
  ["minecraft:deprecated_purpur_block_2", -952],
  ["minecraft:purpur_pillar", -951],
  ["minecraft:deprecated_purpur_block_1", -950],
  ["minecraft:red_sand", -949],
  ["minecraft:prismarine_bricks", -948],
  ["minecraft:dark_prismarine", -947],
  ["minecraft:smooth_sandstone", -946],
  ["minecraft:cut_sandstone", -945],
  ["minecraft:chiseled_sandstone", -944],
  ["minecraft:light_block_15", -943],
  ["minecraft:light_block_14", -942],
  ["minecraft:light_block_13", -941],
  ["minecraft:light_block_12", -940],
  ["minecraft:light_block_11", -939],
  ["minecraft:light_block_10", -938],
  ["minecraft:light_block_9", -937],
  ["minecraft:light_block_8", -936],
  ["minecraft:light_block_7", -935],
  ["minecraft:light_block_6", -934],
  ["minecraft:light_block_5", -933],
  ["minecraft:light_block_4", -932],
  ["minecraft:light_block_3", -931],
  ["minecraft:light_block_2", -930],
  ["minecraft:light_block_1", -929],
  ["minecraft:cut_red_sandstone_double_slab", -928],
  ["minecraft:cut_sandstone_double_slab", -927],
  ["minecraft:normal_stone_double_slab", -926],
  ["minecraft:smooth_quartz_double_slab", -925],
  ["minecraft:polished_granite_double_slab", -924],
  ["minecraft:granite_double_slab", -923],
  ["minecraft:polished_diorite_double_slab", -922],
  ["minecraft:diorite_double_slab", -921],
  ["minecraft:andesite_double_slab", -920],
  ["minecraft:polished_andesite_double_slab", -919],
  ["minecraft:smooth_red_sandstone_double_slab", -918],
  ["minecraft:red_nether_brick_double_slab", -917],
  ["minecraft:smooth_sandstone_double_slab", -916],
  ["minecraft:mossy_cobblestone_double_slab", -915],
  ["minecraft:prismarine_brick_double_slab", -914],
  ["minecraft:dark_prismarine_double_slab", -913],
  ["minecraft:prismarine_double_slab", -912],
  ["minecraft:purpur_double_slab", -911],
  ["minecraft:dead_horn_coral_wall_fan", -910],
  ["minecraft:dead_fire_coral_wall_fan", -909],
  ["minecraft:dead_bubble_coral_wall_fan", -908],
  ["minecraft:fire_coral_wall_fan", -907],
  ["minecraft:dead_brain_coral_wall_fan", -906],
  ["minecraft:dead_tube_coral_wall_fan", -905],
  ["minecraft:brain_coral_wall_fan", -904],
  ["minecraft:petrified_oak_double_slab", -903],
  ["minecraft:petrified_oak_slab", -902],
  ["minecraft:cut_red_sandstone_slab", -901],
  ["minecraft:cut_sandstone_slab", -900],
  ["minecraft:normal_stone_slab", -899],
  ["minecraft:smooth_quartz_slab", -898],
  ["minecraft:polished_granite_slab", -897],
  ["minecraft:granite_slab", -896],
  ["minecraft:polished_diorite_slab", -895],
  ["minecraft:diorite_slab", -894],
  ["minecraft:andesite_slab", -893],
  ["minecraft:polished_andesite_slab", -892],
  ["minecraft:smooth_red_sandstone_slab", -891],
  ["minecraft:red_nether_brick_slab", -890],
  ["minecraft:smooth_sandstone_slab", -889],
  ["minecraft:mossy_cobblestone_slab", -888],
  ["minecraft:prismarine_brick_slab", -887],
  ["minecraft:dark_prismarine_slab", -886],
  ["minecraft:prismarine_slab", -885],
  ["minecraft:purpur_slab", -884],
  ["minecraft:nether_brick_double_slab", -883],
  ["minecraft:quartz_double_slab", -882],
  ["minecraft:stone_brick_double_slab", -881],
  ["minecraft:brick_double_slab", -880],
  ["minecraft:cobblestone_double_slab", -879],
  ["minecraft:sandstone_double_slab", -878],
  ["minecraft:nether_brick_slab", -877],
  ["minecraft:quartz_slab", -876],
  ["minecraft:stone_brick_slab", -875],
  ["minecraft:brick_slab", -874],
  ["minecraft:cobblestone_slab", -873],
  ["minecraft:sandstone_slab", -872],
  ["minecraft:chiseled_stone_bricks", -870],
  ["minecraft:cracked_stone_bricks", -869],
  ["minecraft:mossy_stone_bricks", -868],
  ["minecraft:peony", -867],
  ["minecraft:rose_bush", -866],
  ["minecraft:large_fern", -865],
  ["minecraft:tall_grass", -864],
  ["minecraft:lilac", -863],
  ["minecraft:infested_chiseled_stone_bricks", -862],
  ["minecraft:infested_cracked_stone_bricks", -861],
  ["minecraft:infested_mossy_stone_bricks", -860],
  ["minecraft:infested_stone_bricks", -859],
  ["minecraft:infested_cobblestone", -858],
  ["minecraft:dead_horn_coral_block", -857],
  ["minecraft:dead_fire_coral_block", -856],
  ["minecraft:dead_bubble_coral_block", -855],
  ["minecraft:dead_brain_coral_block", -854],
  ["minecraft:dead_tube_coral_block", -853],
  ["minecraft:horn_coral_block", -852],
  ["minecraft:fire_coral_block", -851],
  ["minecraft:bubble_coral_block", -850],
  ["minecraft:brain_coral_block", -849],
  ["minecraft:fern", -848],
  ["minecraft:dead_horn_coral_fan", -847],
  ["minecraft:dead_fire_coral_fan", -846],
  ["minecraft:dead_bubble_coral_fan", -845],
  ["minecraft:dead_brain_coral_fan", -844],
  ["minecraft:horn_coral_fan", -843],
  ["minecraft:fire_coral_fan", -842],
  ["minecraft:bubble_coral_fan", -841],
  ["minecraft:brain_coral_fan", -840],
  ["minecraft:lily_of_the_valley", -839],
  ["minecraft:cornflower", -838],
  ["minecraft:oxeye_daisy", -837],
  ["minecraft:pink_tulip", -836],
  ["minecraft:white_tulip", -835],
  ["minecraft:orange_tulip", -834],
  ["minecraft:red_tulip", -833],
  ["minecraft:azure_bluet", -832],
  ["minecraft:allium", -831],
  ["minecraft:blue_orchid", -830],
  ["minecraft:dark_oak_sapling", -829],
  ["minecraft:acacia_sapling", -828],
  ["minecraft:jungle_sapling", -827],
  ["minecraft:birch_sapling", -826],
  ["minecraft:spruce_sapling", -825],
  ["minecraft:stripped_dark_oak_wood", -824],
  ["minecraft:stripped_acacia_wood", -823],
  ["minecraft:stripped_jungle_wood", -822],
  ["minecraft:stripped_birch_wood", -821],
  ["minecraft:stripped_spruce_wood", -820],
  ["minecraft:stripped_oak_wood", -819],
  ["minecraft:dark_oak_wood", -818],
  ["minecraft:acacia_wood", -817],
  ["minecraft:jungle_wood", -816],
  ["minecraft:birch_wood", -815],
  ["minecraft:spruce_wood", -814],
  ["minecraft:dark_oak_double_slab", -813],
  ["minecraft:acacia_double_slab", -812],
  ["minecraft:jungle_double_slab", -811],
  ["minecraft:birch_double_slab", -810],
  ["minecraft:spruce_double_slab", -809],
  ["minecraft:dark_oak_slab", -808],
  ["minecraft:acacia_slab", -807],
  ["minecraft:jungle_slab", -806],
  ["minecraft:birch_slab", -805],
  ["minecraft:spruce_slab", -804],
  ["minecraft:dark_oak_leaves", -803],
  ["minecraft:jungle_leaves", -802],
  ["minecraft:birch_leaves", -801],
  ["minecraft:spruce_leaves", -800],
  ["minecraft:waxed_oxidized_copper_trapdoor", -799],
  ["minecraft:waxed_weathered_copper_trapdoor", -798],
  ["minecraft:waxed_exposed_copper_trapdoor", -797],
  ["minecraft:waxed_copper_trapdoor", -796],
  ["minecraft:oxidized_copper_trapdoor", -795],
  ["minecraft:weathered_copper_trapdoor", -794],
  ["minecraft:exposed_copper_trapdoor", -793],
  ["minecraft:copper_trapdoor", -792],
  ["minecraft:waxed_oxidized_copper_door", -791],
  ["minecraft:waxed_weathered_copper_door", -790],
  ["minecraft:waxed_exposed_copper_door", -789],
  ["minecraft:waxed_copper_door", -788],
  ["minecraft:oxidized_copper_door", -787],
  ["minecraft:weathered_copper_door", -786],
  ["minecraft:exposed_copper_door", -785],
  ["minecraft:copper_door", -784],
  ["minecraft:waxed_oxidized_copper_bulb", -783],
  ["minecraft:waxed_weathered_copper_bulb", -782],
  ["minecraft:waxed_exposed_copper_bulb", -781],
  ["minecraft:waxed_copper_bulb", -780],
  ["minecraft:oxidized_copper_bulb", -779],
  ["minecraft:weathered_copper_bulb", -778],
  ["minecraft:exposed_copper_bulb", -777],
  ["minecraft:copper_bulb", -776],
  ["minecraft:waxed_oxidized_copper_grate", -775],
  ["minecraft:waxed_weathered_copper_grate", -774],
  ["minecraft:waxed_exposed_copper_grate", -773],
  ["minecraft:waxed_copper_grate", -772],
  ["minecraft:oxidized_copper_grate", -771],
  ["minecraft:weathered_copper_grate", -770],
  ["minecraft:exposed_copper_grate", -769],
  ["minecraft:copper_grate", -768],
  ["minecraft:waxed_weathered_chiseled_copper", -767],
  ["minecraft:waxed_oxidized_chiseled_copper", -766],
  ["minecraft:waxed_exposed_chiseled_copper", -765],
  ["minecraft:waxed_chiseled_copper", -764],
  ["minecraft:oxidized_chiseled_copper", -763],
  ["minecraft:weathered_chiseled_copper", -762],
  ["minecraft:exposed_chiseled_copper", -761],
  ["minecraft:chiseled_copper", -760],
  ["minecraft:chiseled_tuff_bricks", -759],
  ["minecraft:tuff_brick_wall", -758],
  ["minecraft:tuff_brick_stairs", -757],
  ["minecraft:tuff_brick_double_slab", -756],
  ["minecraft:tuff_brick_slab", -755],
  ["minecraft:tuff_bricks", -754],
  ["minecraft:chiseled_tuff", -753],
  ["minecraft:polished_tuff_wall", -752],
  ["minecraft:polished_tuff_stairs", -751],
  ["minecraft:polished_tuff_double_slab", -750],
  ["minecraft:polished_tuff_slab", -749],
  ["minecraft:polished_tuff", -748],
  ["minecraft:tuff_wall", -747],
  ["minecraft:tuff_stairs", -746],
  ["minecraft:tuff_double_slab", -745],
  ["minecraft:tuff_slab", -744],
  ["minecraft:dark_oak_planks", -743],
  ["minecraft:acacia_planks", -742],
  ["minecraft:jungle_planks", -741],
  ["minecraft:birch_planks", -740],
  ["minecraft:spruce_planks", -739],
  ["minecraft:black_terracotta", -738],
  ["minecraft:red_terracotta", -737],
  ["minecraft:green_terracotta", -736],
  ["minecraft:brown_terracotta", -735],
  ["minecraft:blue_terracotta", -734],
  ["minecraft:purple_terracotta", -733],
  ["minecraft:cyan_terracotta", -732],
  ["minecraft:light_gray_terracotta", -731],
  ["minecraft:gray_terracotta", -730],
  ["minecraft:pink_terracotta", -729],
  ["minecraft:lime_terracotta", -728],
  ["minecraft:yellow_terracotta", -727],
  ["minecraft:light_blue_terracotta", -726],
  ["minecraft:magenta_terracotta", -725],
  ["minecraft:orange_terracotta", -724],
  ["minecraft:black_concrete_powder", -723],
  ["minecraft:red_concrete_powder", -722],
  ["minecraft:green_concrete_powder", -721],
  ["minecraft:brown_concrete_powder", -720],
  ["minecraft:blue_concrete_powder", -719],
  ["minecraft:purple_concrete_powder", -718],
  ["minecraft:cyan_concrete_powder", -717],
  ["minecraft:light_gray_concrete_powder", -716],
  ["minecraft:gray_concrete_powder", -715],
  ["minecraft:pink_concrete_powder", -714],
  ["minecraft:lime_concrete_powder", -713],
  ["minecraft:yellow_concrete_powder", -712],
  ["minecraft:light_blue_concrete_powder", -711],
  ["minecraft:magenta_concrete_powder", -710],
  ["minecraft:orange_concrete_powder", -709],
  ["minecraft:hard_black_stained_glass", -702],
  ["minecraft:hard_red_stained_glass", -701],
  ["minecraft:hard_green_stained_glass", -700],
  ["minecraft:hard_brown_stained_glass", -699],
  ["minecraft:hard_blue_stained_glass", -698],
  ["minecraft:hard_purple_stained_glass", -697],
  ["minecraft:hard_cyan_stained_glass", -696],
  ["minecraft:hard_light_gray_stained_glass", -695],
  ["minecraft:hard_gray_stained_glass", -694],
  ["minecraft:hard_pink_stained_glass", -693],
  ["minecraft:hard_lime_stained_glass", -692],
  ["minecraft:hard_yellow_stained_glass", -691],
  ["minecraft:hard_light_blue_stained_glass", -690],
  ["minecraft:hard_magenta_stained_glass", -689],
  ["minecraft:hard_orange_stained_glass", -688],
  ["minecraft:black_stained_glass", -687],
  ["minecraft:red_stained_glass", -686],
  ["minecraft:green_stained_glass", -685],
  ["minecraft:brown_stained_glass", -684],
  ["minecraft:blue_stained_glass", -683],
  ["minecraft:purple_stained_glass", -682],
  ["minecraft:cyan_stained_glass", -681],
  ["minecraft:light_gray_stained_glass", -680],
  ["minecraft:gray_stained_glass", -679],
  ["minecraft:pink_stained_glass", -678],
  ["minecraft:lime_stained_glass", -677],
  ["minecraft:yellow_stained_glass", -676],
  ["minecraft:light_blue_stained_glass", -675],
  ["minecraft:magenta_stained_glass", -674],
  ["minecraft:orange_stained_glass", -673],
  ["minecraft:hard_black_stained_glass_pane", -672],
  ["minecraft:hard_red_stained_glass_pane", -671],
  ["minecraft:hard_green_stained_glass_pane", -670],
  ["minecraft:hard_brown_stained_glass_pane", -669],
  ["minecraft:hard_blue_stained_glass_pane", -668],
  ["minecraft:hard_purple_stained_glass_pane", -667],
  ["minecraft:hard_cyan_stained_glass_pane", -666],
  ["minecraft:hard_light_gray_stained_glass_pane", -665],
  ["minecraft:hard_gray_stained_glass_pane", -664],
  ["minecraft:hard_pink_stained_glass_pane", -663],
  ["minecraft:hard_lime_stained_glass_pane", -662],
  ["minecraft:hard_yellow_stained_glass_pane", -661],
  ["minecraft:hard_light_blue_stained_glass_pane", -660],
  ["minecraft:hard_magenta_stained_glass_pane", -659],
  ["minecraft:hard_orange_stained_glass_pane", -658],
  ["minecraft:black_stained_glass_pane", -657],
  ["minecraft:red_stained_glass_pane", -656],
  ["minecraft:green_stained_glass_pane", -655],
  ["minecraft:brown_stained_glass_pane", -654],
  ["minecraft:blue_stained_glass_pane", -653],
  ["minecraft:purple_stained_glass_pane", -652],
  ["minecraft:cyan_stained_glass_pane", -651],
  ["minecraft:light_gray_stained_glass_pane", -650],
  ["minecraft:gray_stained_glass_pane", -649],
  ["minecraft:pink_stained_glass_pane", -648],
  ["minecraft:lime_stained_glass_pane", -647],
  ["minecraft:yellow_stained_glass_pane", -646],
  ["minecraft:light_blue_stained_glass_pane", -645],
  ["minecraft:magenta_stained_glass_pane", -644],
  ["minecraft:orange_stained_glass_pane", -643],
  ["minecraft:black_concrete", -642],
  ["minecraft:red_concrete", -641],
  ["minecraft:green_concrete", -640],
  ["minecraft:brown_concrete", -639],
  ["minecraft:blue_concrete", -638],
  ["minecraft:purple_concrete", -637],
  ["minecraft:cyan_concrete", -636],
  ["minecraft:light_gray_concrete", -635],
  ["minecraft:gray_concrete", -634],
  ["minecraft:pink_concrete", -633],
  ["minecraft:lime_concrete", -632],
  ["minecraft:yellow_concrete", -631],
  ["minecraft:light_blue_concrete", -630],
  ["minecraft:magenta_concrete", -629],
  ["minecraft:orange_concrete", -628],
  ["minecraft:black_shulker_box", -627],
  ["minecraft:red_shulker_box", -626],
  ["minecraft:green_shulker_box", -625],
  ["minecraft:brown_shulker_box", -624],
  ["minecraft:blue_shulker_box", -623],
  ["minecraft:purple_shulker_box", -622],
  ["minecraft:cyan_shulker_box", -621],
  ["minecraft:light_gray_shulker_box", -620],
  ["minecraft:gray_shulker_box", -619],
  ["minecraft:pink_shulker_box", -618],
  ["minecraft:lime_shulker_box", -617],
  ["minecraft:yellow_shulker_box", -616],
  ["minecraft:light_blue_shulker_box", -615],
  ["minecraft:magenta_shulker_box", -614],
  ["minecraft:orange_shulker_box", -613],
  ["minecraft:pitcher_plant", -612],
  ["minecraft:black_carpet", -611],
  ["minecraft:red_carpet", -610],
  ["minecraft:green_carpet", -609],
  ["minecraft:brown_carpet", -608],
  ["minecraft:blue_carpet", -607],
  ["minecraft:purple_carpet", -606],
  ["minecraft:cyan_carpet", -605],
  ["minecraft:light_gray_carpet", -604],
  ["minecraft:gray_carpet", -603],
  ["minecraft:pink_carpet", -602],
  ["minecraft:lime_carpet", -601],
  ["minecraft:yellow_carpet", -600],
  ["minecraft:light_blue_carpet", -599],
  ["minecraft:magenta_carpet", -598],
  ["minecraft:orange_carpet", -597],
  ["minecraft:sniffer_egg", -596],
  ["minecraft:polished_andesite", -595],
  ["minecraft:andesite", -594],
  ["minecraft:polished_diorite", -593],
  ["minecraft:diorite", -592],
  ["minecraft:polished_granite", -591],
  ["minecraft:granite", -590],
  ["minecraft:dead_horn_coral", -589],
  ["minecraft:dead_fire_coral", -588],
  ["minecraft:dead_bubble_coral", -587],
  ["minecraft:dead_brain_coral", -586],
  ["minecraft:dead_tube_coral", -585],
  ["minecraft:horn_coral", -584],
  ["minecraft:fire_coral", -583],
  ["minecraft:bubble_coral", -582],
  ["minecraft:brain_coral", -581],
  ["minecraft:calibrated_sculk_sensor", -580],
  ["minecraft:spruce_fence", -579],
  ["minecraft:jungle_fence", -578],
  ["minecraft:dark_oak_fence", -577],
  ["minecraft:birch_fence", -576],
  ["minecraft:acacia_fence", -575],
  ["minecraft:pitcher_crop", -574],
  ["minecraft:suspicious_gravel", -573],
  ["minecraft:dark_oak_log", -572],
  ["minecraft:jungle_log", -571],
  ["minecraft:birch_log", -570],
  ["minecraft:spruce_log", -569],
  ["minecraft:torchflower", -568],
  ["minecraft:torchflower_crop", -567],
  ["minecraft:pink_wool", -566],
  ["minecraft:magenta_wool", -565],
  ["minecraft:purple_wool", -564],
  ["minecraft:blue_wool", -563],
  ["minecraft:light_blue_wool", -562],
  ["minecraft:cyan_wool", -561],
  ["minecraft:green_wool", -560],
  ["minecraft:lime_wool", -559],
  ["minecraft:yellow_wool", -558],
  ["minecraft:orange_wool", -557],
  ["minecraft:red_wool", -556],
  ["minecraft:brown_wool", -555],
  ["minecraft:black_wool", -554],
  ["minecraft:gray_wool", -553],
  ["minecraft:light_gray_wool", -552],
  ["minecraft:decorated_pot", -551],
  ["minecraft:pink_petals", -549],
  ["minecraft:cherry_leaves", -548],
  ["minecraft:cherry_sapling", -547],
  ["minecraft:cherry_wood", -546],
  ["minecraft:stripped_cherry_wood", -545],
  ["minecraft:cherry_wall_sign", -544],
  ["minecraft:cherry_trapdoor", -543],
  ["minecraft:cherry_standing_sign", -542],
  ["minecraft:cherry_stairs", -541],
  ["minecraft:cherry_double_slab", -540],
  ["minecraft:cherry_slab", -539],
  ["minecraft:cherry_pressure_plate", -538],
  ["minecraft:cherry_planks", -537],
  ["minecraft:cherry_log", -536],
  ["minecraft:stripped_cherry_log", -535],
  ["minecraft:cherry_hanging_sign", -534],
  ["minecraft:cherry_fence_gate", -533],
  ["minecraft:cherry_fence", -532],
  ["minecraft:cherry_door", -531],
  ["minecraft:cherry_button", -530],
  ["minecraft:suspicious_sand", -529],
  ["minecraft:stripped_bamboo_block", -528],
  ["minecraft:bamboo_block", -527],
  ["minecraft:chiseled_bookshelf", -526],
  ["minecraft:bamboo_mosaic_double_slab", -525],
  ["minecraft:bamboo_mosaic_slab", -524],
  ["minecraft:bamboo_mosaic_stairs", -523],
  ["minecraft:bamboo_hanging_sign", -522],
  ["minecraft:bamboo_double_slab", -521],
  ["minecraft:bamboo_trapdoor", -520],
  ["minecraft:bamboo_wall_sign", -519],
  ["minecraft:bamboo_standing_sign", -518],
  ["minecraft:bamboo_door", -517],
  ["minecraft:bamboo_fence_gate", -516],
  ["minecraft:bamboo_fence", -515],
  ["minecraft:bamboo_pressure_plate", -514],
  ["minecraft:bamboo_slab", -513],
  ["minecraft:bamboo_stairs", -512],
  ["minecraft:bamboo_button", -511],
  ["minecraft:bamboo_planks", -510],
  ["minecraft:bamboo_mosaic", -509],
  ["minecraft:mangrove_hanging_sign", -508],
  ["minecraft:warped_hanging_sign", -507],
  ["minecraft:crimson_hanging_sign", -506],
  ["minecraft:dark_oak_hanging_sign", -505],
  ["minecraft:acacia_hanging_sign", -504],
  ["minecraft:jungle_hanging_sign", -503],
  ["minecraft:birch_hanging_sign", -502],
  ["minecraft:spruce_hanging_sign", -501],
  ["minecraft:oak_hanging_sign", -500],
  ["minecraft:mangrove_double_slab", -499],
  ["minecraft:stripped_mangrove_wood", -498],
  ["minecraft:mangrove_wood", -497],
  ["minecraft:mangrove_trapdoor", -496],
  ["minecraft:mangrove_wall_sign", -495],
  ["minecraft:mangrove_standing_sign", -494],
  ["minecraft:mangrove_door", -493],
  ["minecraft:mangrove_fence_gate", -492],
  ["minecraft:mangrove_fence", -491],
  ["minecraft:mangrove_pressure_plate", -490],
  ["minecraft:mangrove_slab", -489],
  ["minecraft:mangrove_stairs", -488],
  ["minecraft:mangrove_button", -487],
  ["minecraft:mangrove_planks", -486],
  ["minecraft:stripped_mangrove_log", -485],
  ["minecraft:mangrove_log", -484],
  ["minecraft:muddy_mangrove_roots", -483],
  ["minecraft:mangrove_roots", -482],
  ["minecraft:mud_brick_wall", -481],
  ["minecraft:mud_brick_stairs", -480],
  ["minecraft:mud_brick_double_slab", -479],
  ["minecraft:mud_brick_slab", -478],
  ["minecraft:packed_mud", -477],
  ["minecraft:mud_bricks", -475],
  ["minecraft:mangrove_propagule", -474],
  ["minecraft:mud", -473],
  ["minecraft:mangrove_leaves", -472],
  ["minecraft:ochre_froglight", -471],
  ["minecraft:verdant_froglight", -470],
  ["minecraft:pearlescent_froglight", -469],
  ["minecraft:frog_spawn", -468],
  ["minecraft:reinforced_deepslate", -466],
  ["minecraft:client_request_placeholder_block", -465],
  ["minecraft:sculk_shrieker", -461],
  ["minecraft:sculk_catalyst", -460],
  ["minecraft:sculk_vein", -459],
  ["minecraft:sculk", -458],
  ["minecraft:infested_deepslate", -454],
  ["minecraft:raw_gold_block", -453],
  ["minecraft:raw_copper_block", -452],
  ["minecraft:raw_iron_block", -451],
  ["minecraft:waxed_oxidized_double_cut_copper_slab", -450],
  ["minecraft:waxed_oxidized_cut_copper_slab", -449],
  ["minecraft:waxed_oxidized_cut_copper_stairs", -448],
  ["minecraft:waxed_oxidized_cut_copper", -447],
  ["minecraft:waxed_oxidized_copper", -446],
  ["minecraft:black_candle_cake", -445],
  ["minecraft:red_candle_cake", -444],
  ["minecraft:green_candle_cake", -443],
  ["minecraft:brown_candle_cake", -442],
  ["minecraft:blue_candle_cake", -441],
  ["minecraft:purple_candle_cake", -440],
  ["minecraft:cyan_candle_cake", -439],
  ["minecraft:light_gray_candle_cake", -438],
  ["minecraft:gray_candle_cake", -437],
  ["minecraft:pink_candle_cake", -436],
  ["minecraft:lime_candle_cake", -435],
  ["minecraft:yellow_candle_cake", -434],
  ["minecraft:light_blue_candle_cake", -433],
  ["minecraft:magenta_candle_cake", -432],
  ["minecraft:orange_candle_cake", -431],
  ["minecraft:white_candle_cake", -430],
  ["minecraft:candle_cake", -429],
  ["minecraft:black_candle", -428],
  ["minecraft:red_candle", -427],
  ["minecraft:green_candle", -426],
  ["minecraft:brown_candle", -425],
  ["minecraft:blue_candle", -424],
  ["minecraft:purple_candle", -423],
  ["minecraft:cyan_candle", -422],
  ["minecraft:light_gray_candle", -421],
  ["minecraft:gray_candle", -420],
  ["minecraft:pink_candle", -419],
  ["minecraft:lime_candle", -418],
  ["minecraft:yellow_candle", -417],
  ["minecraft:light_blue_candle", -416],
  ["minecraft:magenta_candle", -415],
  ["minecraft:orange_candle", -414],
  ["minecraft:white_candle", -413],
  ["minecraft:candle", -412],
  ["minecraft:glow_lichen", -411],
  ["minecraft:cracked_deepslate_bricks", -410],
  ["minecraft:cracked_deepslate_tiles", -409],
  ["minecraft:deepslate_copper_ore", -408],
  ["minecraft:deepslate_emerald_ore", -407],
  ["minecraft:deepslate_coal_ore", -406],
  ["minecraft:deepslate_diamond_ore", -405],
  ["minecraft:lit_deepslate_redstone_ore", -404],
  ["minecraft:deepslate_redstone_ore", -403],
  ["minecraft:deepslate_gold_ore", -402],
  ["minecraft:deepslate_iron_ore", -401],
  ["minecraft:deepslate_lapis_ore", -400],
  ["minecraft:deepslate_brick_double_slab", -399],
  ["minecraft:deepslate_tile_double_slab", -398],
  ["minecraft:polished_deepslate_double_slab", -397],
  ["minecraft:cobbled_deepslate_double_slab", -396],
  ["minecraft:chiseled_deepslate", -395],
  ["minecraft:deepslate_brick_wall", -394],
  ["minecraft:deepslate_brick_stairs", -393],
  ["minecraft:deepslate_brick_slab", -392],
  ["minecraft:deepslate_bricks", -391],
  ["minecraft:deepslate_tile_wall", -390],
  ["minecraft:deepslate_tile_stairs", -389],
  ["minecraft:deepslate_tile_slab", -388],
  ["minecraft:deepslate_tiles", -387],
  ["minecraft:polished_deepslate_wall", -386],
  ["minecraft:polished_deepslate_stairs", -385],
  ["minecraft:polished_deepslate_slab", -384],
  ["minecraft:polished_deepslate", -383],
  ["minecraft:cobbled_deepslate_wall", -382],
  ["minecraft:cobbled_deepslate_stairs", -381],
  ["minecraft:cobbled_deepslate_slab", -380],
  ["minecraft:cobbled_deepslate", -379],
  ["minecraft:deepslate", -378],
  ["minecraft:smooth_basalt", -377],
  ["minecraft:cave_vines_head_with_berries", -376],
  ["minecraft:cave_vines_body_with_berries", -375],
  ["minecraft:waxed_weathered_double_cut_copper_slab", -374],
  ["minecraft:waxed_exposed_double_cut_copper_slab", -373],
  ["minecraft:waxed_double_cut_copper_slab", -372],
  ["minecraft:oxidized_double_cut_copper_slab", -371],
  ["minecraft:weathered_double_cut_copper_slab", -370],
  ["minecraft:exposed_double_cut_copper_slab", -369],
  ["minecraft:double_cut_copper_slab", -368],
  ["minecraft:waxed_weathered_cut_copper_slab", -367],
  ["minecraft:waxed_exposed_cut_copper_slab", -366],
  ["minecraft:waxed_cut_copper_slab", -365],
  ["minecraft:oxidized_cut_copper_slab", -364],
  ["minecraft:weathered_cut_copper_slab", -363],
  ["minecraft:exposed_cut_copper_slab", -362],
  ["minecraft:cut_copper_slab", -361],
  ["minecraft:waxed_weathered_cut_copper_stairs", -360],
  ["minecraft:waxed_exposed_cut_copper_stairs", -359],
  ["minecraft:waxed_cut_copper_stairs", -358],
  ["minecraft:oxidized_cut_copper_stairs", -357],
  ["minecraft:weathered_cut_copper_stairs", -356],
  ["minecraft:exposed_cut_copper_stairs", -355],
  ["minecraft:cut_copper_stairs", -354],
  ["minecraft:waxed_weathered_cut_copper", -353],
  ["minecraft:waxed_exposed_cut_copper", -352],
  ["minecraft:waxed_cut_copper", -351],
  ["minecraft:oxidized_cut_copper", -350],
  ["minecraft:weathered_cut_copper", -349],
  ["minecraft:exposed_cut_copper", -348],
  ["minecraft:cut_copper", -347],
  ["minecraft:waxed_weathered_copper", -346],
  ["minecraft:waxed_exposed_copper", -345],
  ["minecraft:waxed_copper", -344],
  ["minecraft:oxidized_copper", -343],
  ["minecraft:weathered_copper", -342],
  ["minecraft:exposed_copper", -341],
  ["minecraft:copper_block", -340],
  ["minecraft:glow_frame_block", -339],
  ["minecraft:flowering_azalea", -338],
  ["minecraft:azalea", -337],
  ["minecraft:small_dripleaf_block", -336],
  ["minecraft:moss_carpet", -335],
  ["minecraft:tinted_glass", -334],
  ["minecraft:tuff", -333],
  ["minecraft:small_amethyst_bud", -332],
  ["minecraft:medium_amethyst_bud", -331],
  ["minecraft:large_amethyst_bud", -330],
  ["minecraft:amethyst_cluster", -329],
  ["minecraft:budding_amethyst", -328],
  ["minecraft:amethyst_block", -327],
  ["minecraft:calcite", -326],
  ["minecraft:azalea_leaves_flowered", -325],
  ["minecraft:azalea_leaves", -324],
  ["minecraft:big_dripleaf", -323],
  ["minecraft:cave_vines", -322],
  ["minecraft:spore_blossom", -321],
  ["minecraft:moss_block", -320],
  ["minecraft:hanging_roots", -319],
  ["minecraft:dirt_with_roots", -318],
  ["minecraft:dripstone_block", -317],
  ["minecraft:heavy_core", -316],
  ["minecraft:trial_spawner", -315],
  ["minecraft:vault", -314],
  ["minecraft:crafter", -313],
  ["minecraft:lightning_rod", -312],
  ["minecraft:copper_ore", -311],
  ["minecraft:pointed_dripstone", -308],
  ["minecraft:sculk_sensor", -307],
  ["minecraft:powder_snow", -306],
  ["minecraft:unknown", -305],
  ["minecraft:quartz_bricks", -304],
  ["minecraft:cracked_nether_bricks", -303],
  ["minecraft:chiseled_nether_bricks", -302],
  ["minecraft:stripped_warped_hyphae", -301],
  ["minecraft:stripped_crimson_hyphae", -300],
  ["minecraft:crimson_hyphae", -299],
  ["minecraft:warped_hyphae", -298],
  ["minecraft:polished_blackstone_wall", -297],
  ["minecraft:polished_blackstone_button", -296],
  ["minecraft:polished_blackstone_pressure_plate", -295],
  ["minecraft:polished_blackstone_double_slab", -294],
  ["minecraft:polished_blackstone_slab", -293],
  ["minecraft:polished_blackstone_stairs", -292],
  ["minecraft:polished_blackstone", -291],
  ["minecraft:crying_obsidian", -289],
  ["minecraft:nether_gold_ore", -288],
  ["minecraft:twisting_vines", -287],
  ["minecraft:polished_blackstone_brick_double_slab", -285],
  ["minecraft:polished_blackstone_brick_slab", -284],
  ["minecraft:blackstone_double_slab", -283],
  ["minecraft:blackstone_slab", -282],
  ["minecraft:gilded_blackstone", -281],
  ["minecraft:cracked_polished_blackstone_bricks", -280],
  ["minecraft:chiseled_polished_blackstone", -279],
  ["minecraft:polished_blackstone_brick_wall", -278],
  ["minecraft:blackstone_wall", -277],
  ["minecraft:blackstone_stairs", -276],
  ["minecraft:polished_blackstone_brick_stairs", -275],
  ["minecraft:polished_blackstone_bricks", -274],
  ["minecraft:blackstone", -273],
  ["minecraft:respawn_anchor", -272],
  ["minecraft:ancient_debris", -271],
  ["minecraft:netherite_block", -270],
  ["minecraft:soul_lantern", -269],
  ["minecraft:soul_torch", -268],
  ["minecraft:warped_double_slab", -267],
  ["minecraft:crimson_double_slab", -266],
  ["minecraft:warped_slab", -265],
  ["minecraft:crimson_slab", -264],
  ["minecraft:warped_pressure_plate", -263],
  ["minecraft:crimson_pressure_plate", -262],
  ["minecraft:warped_button", -261],
  ["minecraft:crimson_button", -260],
  ["minecraft:warped_fence_gate", -259],
  ["minecraft:crimson_fence_gate", -258],
  ["minecraft:warped_fence", -257],
  ["minecraft:crimson_fence", -256],
  ["minecraft:warped_stairs", -255],
  ["minecraft:crimson_stairs", -254],
  ["minecraft:warped_wall_sign", -253],
  ["minecraft:crimson_wall_sign", -252],
  ["minecraft:warped_standing_sign", -251],
  ["minecraft:crimson_standing_sign", -250],
  ["minecraft:warped_trapdoor", -247],
  ["minecraft:crimson_trapdoor", -246],
  ["minecraft:warped_planks", -243],
  ["minecraft:crimson_planks", -242],
  ["minecraft:stripped_warped_stem", -241],
  ["minecraft:stripped_crimson_stem", -240],
  ["minecraft:target", -239],
  ["minecraft:soul_soil", -236],
  ["minecraft:polished_basalt", -235],
  ["minecraft:basalt", -234],
  ["minecraft:warped_nylium", -233],
  ["minecraft:crimson_nylium", -232],
  ["minecraft:weeping_vines", -231],
  ["minecraft:shroomlight", -230],
  ["minecraft:warped_fungus", -229],
  ["minecraft:crimson_fungus", -228],
  ["minecraft:warped_wart_block", -227],
  ["minecraft:warped_stem", -226],
  ["minecraft:crimson_stem", -225],
  ["minecraft:warped_roots", -224],
  ["minecraft:crimson_roots", -223],
  ["minecraft:lodestone", -222],
  ["minecraft:honeycomb_block", -221],
  ["minecraft:honey_block", -220],
  ["minecraft:beehive", -219],
  ["minecraft:bee_nest", -218],
  ["minecraft:sticky_piston_arm_collision", -217],
  ["minecraft:wither_rose", -216],
  ["minecraft:light_block_0", -215],
  ["minecraft:lit_blast_furnace", -214],
  ["minecraft:composter", -213],
  ["minecraft:oak_wood", -212],
  ["minecraft:jigsaw", -211],
  ["minecraft:lantern", -208],
  ["minecraft:sweet_berry_bush", -207],
  ["minecraft:bell", -206],
  ["minecraft:loom", -204],
  ["minecraft:barrel", -203],
  ["minecraft:smithing_table", -202],
  ["minecraft:fletching_table", -201],
  ["minecraft:cartography_table", -200],
  ["minecraft:lit_smoker", -199],
  ["minecraft:smoker", -198],
  ["minecraft:stonecutter_block", -197],
  ["minecraft:blast_furnace", -196],
  ["minecraft:grindstone", -195],
  ["minecraft:lectern", -194],
  ["minecraft:darkoak_wall_sign", -193],
  ["minecraft:darkoak_standing_sign", -192],
  ["minecraft:acacia_wall_sign", -191],
  ["minecraft:acacia_standing_sign", -190],
  ["minecraft:jungle_wall_sign", -189],
  ["minecraft:jungle_standing_sign", -188],
  ["minecraft:birch_wall_sign", -187],
  ["minecraft:birch_standing_sign", -186],
  ["minecraft:smooth_quartz_stairs", -185],
  ["minecraft:red_nether_brick_stairs", -184],
  ["minecraft:smooth_stone", -183],
  ["minecraft:spruce_wall_sign", -182],
  ["minecraft:spruce_standing_sign", -181],
  ["minecraft:normal_stone_stairs", -180],
  ["minecraft:mossy_cobblestone_stairs", -179],
  ["minecraft:end_brick_stairs", -178],
  ["minecraft:smooth_sandstone_stairs", -177],
  ["minecraft:smooth_red_sandstone_stairs", -176],
  ["minecraft:mossy_stone_brick_stairs", -175],
  ["minecraft:polished_andesite_stairs", -174],
  ["minecraft:polished_diorite_stairs", -173],
  ["minecraft:polished_granite_stairs", -172],
  ["minecraft:andesite_stairs", -171],
  ["minecraft:diorite_stairs", -170],
  ["minecraft:granite_stairs", -169],
  ["minecraft:mossy_stone_brick_double_slab", -168],
  ["minecraft:end_stone_brick_double_slab", -167],
  ["minecraft:mossy_stone_brick_slab", -166],
  ["minecraft:scaffolding", -165],
  ["minecraft:bamboo_sapling", -164],
  ["minecraft:bamboo", -163],
  ["minecraft:end_stone_brick_slab", -162],
  ["minecraft:barrier", -161],
  ["minecraft:bubble_column", -160],
  ["minecraft:turtle_egg", -159],
  ["minecraft:conduit", -157],
  ["minecraft:sea_pickle", -156],
  ["minecraft:carved_pumpkin", -155],
  ["minecraft:spruce_pressure_plate", -154],
  ["minecraft:jungle_pressure_plate", -153],
  ["minecraft:dark_oak_pressure_plate", -152],
  ["minecraft:birch_pressure_plate", -151],
  ["minecraft:acacia_pressure_plate", -150],
  ["minecraft:spruce_trapdoor", -149],
  ["minecraft:jungle_trapdoor", -148],
  ["minecraft:dark_oak_trapdoor", -147],
  ["minecraft:birch_trapdoor", -146],
  ["minecraft:acacia_trapdoor", -145],
  ["minecraft:spruce_button", -144],
  ["minecraft:jungle_button", -143],
  ["minecraft:dark_oak_button", -142],
  ["minecraft:birch_button", -141],
  ["minecraft:acacia_button", -140],
  ["minecraft:dried_kelp_block", -139],
  ["minecraft:kelp_plant", -138],
  ["minecraft:horn_coral_wall_fan", -137],
  ["minecraft:bubble_coral_wall_fan", -136],
  ["minecraft:tube_coral_wall_fan", -135],
  ["minecraft:dead_tube_coral_fan", -134],
  ["minecraft:tube_coral_fan", -133],
  ["minecraft:tube_coral_block", -132],
  ["minecraft:tube_coral", -131],
  ["minecraft:seagrass", -130],
  ["minecraft:element_118", -129],
  ["minecraft:element_117", -128],
  ["minecraft:element_116", -127],
  ["minecraft:element_115", -126],
  ["minecraft:element_114", -125],
  ["minecraft:element_113", -124],
  ["minecraft:element_112", -123],
  ["minecraft:element_111", -122],
  ["minecraft:element_110", -121],
  ["minecraft:element_109", -120],
  ["minecraft:element_108", -119],
  ["minecraft:element_107", -118],
  ["minecraft:element_106", -117],
  ["minecraft:element_105", -116],
  ["minecraft:element_104", -115],
  ["minecraft:element_103", -114],
  ["minecraft:element_102", -113],
  ["minecraft:element_101", -112],
  ["minecraft:element_100", -111],
  ["minecraft:element_99", -110],
  ["minecraft:element_98", -109],
  ["minecraft:element_97", -108],
  ["minecraft:element_96", -107],
  ["minecraft:element_95", -106],
  ["minecraft:element_94", -105],
  ["minecraft:element_93", -104],
  ["minecraft:element_92", -103],
  ["minecraft:element_91", -102],
  ["minecraft:element_90", -101],
  ["minecraft:element_89", -100],
  ["minecraft:element_88", -99],
  ["minecraft:element_87", -98],
  ["minecraft:element_86", -97],
  ["minecraft:element_85", -96],
  ["minecraft:element_84", -95],
  ["minecraft:element_83", -94],
  ["minecraft:element_82", -93],
  ["minecraft:element_81", -92],
  ["minecraft:element_80", -91],
  ["minecraft:element_79", -90],
  ["minecraft:element_78", -89],
  ["minecraft:element_77", -88],
  ["minecraft:element_76", -87],
  ["minecraft:element_75", -86],
  ["minecraft:element_74", -85],
  ["minecraft:element_73", -84],
  ["minecraft:element_72", -83],
  ["minecraft:element_71", -82],
  ["minecraft:element_70", -81],
  ["minecraft:element_69", -80],
  ["minecraft:element_68", -79],
  ["minecraft:element_67", -78],
  ["minecraft:element_66", -77],
  ["minecraft:element_65", -76],
  ["minecraft:element_64", -75],
  ["minecraft:element_63", -74],
  ["minecraft:element_62", -73],
  ["minecraft:element_61", -72],
  ["minecraft:element_60", -71],
  ["minecraft:element_59", -70],
  ["minecraft:element_58", -69],
  ["minecraft:element_57", -68],
  ["minecraft:element_56", -67],
  ["minecraft:element_55", -66],
  ["minecraft:element_54", -65],
  ["minecraft:element_53", -64],
  ["minecraft:element_52", -63],
  ["minecraft:element_51", -62],
  ["minecraft:element_50", -61],
  ["minecraft:element_49", -60],
  ["minecraft:element_48", -59],
  ["minecraft:element_47", -58],
  ["minecraft:element_46", -57],
  ["minecraft:element_45", -56],
  ["minecraft:element_44", -55],
  ["minecraft:element_43", -54],
  ["minecraft:element_42", -53],
  ["minecraft:element_41", -52],
  ["minecraft:element_40", -51],
  ["minecraft:element_39", -50],
  ["minecraft:element_38", -49],
  ["minecraft:element_37", -48],
  ["minecraft:element_36", -47],
  ["minecraft:element_35", -46],
  ["minecraft:element_34", -45],
  ["minecraft:element_33", -44],
  ["minecraft:element_32", -43],
  ["minecraft:element_31", -42],
  ["minecraft:element_30", -41],
  ["minecraft:element_29", -40],
  ["minecraft:element_28", -39],
  ["minecraft:element_27", -38],
  ["minecraft:element_26", -37],
  ["minecraft:element_25", -36],
  ["minecraft:element_24", -35],
  ["minecraft:element_23", -34],
  ["minecraft:element_22", -33],
  ["minecraft:element_21", -32],
  ["minecraft:element_20", -31],
  ["minecraft:element_19", -30],
  ["minecraft:element_18", -29],
  ["minecraft:element_17", -28],
  ["minecraft:element_16", -27],
  ["minecraft:element_15", -26],
  ["minecraft:element_14", -25],
  ["minecraft:element_13", -24],
  ["minecraft:element_12", -23],
  ["minecraft:element_11", -22],
  ["minecraft:element_10", -21],
  ["minecraft:element_9", -20],
  ["minecraft:element_8", -19],
  ["minecraft:element_7", -18],
  ["minecraft:element_6", -17],
  ["minecraft:element_5", -16],
  ["minecraft:element_4", -15],
  ["minecraft:element_3", -14],
  ["minecraft:element_2", -13],
  ["minecraft:element_1", -12],
  ["minecraft:blue_ice", -11],
  ["minecraft:stripped_oak_log", -10],
  ["minecraft:stripped_dark_oak_log", -9],
  ["minecraft:stripped_acacia_log", -8],
  ["minecraft:stripped_jungle_log", -7],
  ["minecraft:stripped_birch_log", -6],
  ["minecraft:stripped_spruce_log", -5],
  ["minecraft:prismarine_bricks_stairs", -4],
  ["minecraft:dark_prismarine_stairs", -3],
  ["minecraft:prismarine_stairs", -2],
  ["minecraft:air", 0],
  ["minecraft:stone", 1],
  ["minecraft:grass_block", 2],
  ["minecraft:dirt", 3],
  ["minecraft:cobblestone", 4],
  ["minecraft:oak_planks", 5],
  ["minecraft:oak_sapling", 6],
  ["minecraft:bedrock", 7],
  ["minecraft:flowing_water", 8],
  ["minecraft:water", 9],
  ["minecraft:flowing_lava", 10],
  ["minecraft:lava", 11],
  ["minecraft:sand", 12],
  ["minecraft:gravel", 13],
  ["minecraft:gold_ore", 14],
  ["minecraft:iron_ore", 15],
  ["minecraft:coal_ore", 16],
  ["minecraft:oak_log", 17],
  ["minecraft:oak_leaves", 18],
  ["minecraft:sponge", 19],
  ["minecraft:glass", 20],
  ["minecraft:lapis_ore", 21],
  ["minecraft:lapis_block", 22],
  ["minecraft:dispenser", 23],
  ["minecraft:sandstone", 24],
  ["minecraft:noteblock", 25],
  ["minecraft:golden_rail", 27],
  ["minecraft:detector_rail", 28],
  ["minecraft:sticky_piston", 29],
  ["minecraft:web", 30],
  ["minecraft:short_grass", 31],
  ["minecraft:deadbush", 32],
  ["minecraft:piston", 33],
  ["minecraft:piston_arm_collision", 34],
  ["minecraft:white_wool", 35],
  ["minecraft:element_0", 36],
  ["minecraft:dandelion", 37],
  ["minecraft:poppy", 38],
  ["minecraft:brown_mushroom", 39],
  ["minecraft:red_mushroom", 40],
  ["minecraft:gold_block", 41],
  ["minecraft:iron_block", 42],
  ["minecraft:smooth_stone_double_slab", 43],
  ["minecraft:smooth_stone_slab", 44],
  ["minecraft:brick_block", 45],
  ["minecraft:tnt", 46],
  ["minecraft:bookshelf", 47],
  ["minecraft:mossy_cobblestone", 48],
  ["minecraft:obsidian", 49],
  ["minecraft:torch", 50],
  ["minecraft:fire", 51],
  ["minecraft:mob_spawner", 52],
  ["minecraft:oak_stairs", 53],
  ["minecraft:chest", 54],
  ["minecraft:redstone_wire", 55],
  ["minecraft:diamond_ore", 56],
  ["minecraft:diamond_block", 57],
  ["minecraft:crafting_table", 58],
  ["minecraft:wheat_plant", 59],
  ["minecraft:farmland", 60],
  ["minecraft:furnace", 61],
  ["minecraft:lit_furnace", 62],
  ["minecraft:standing_sign", 63],
  ["minecraft:ladder", 65],
  ["minecraft:rail", 66],
  ["minecraft:stone_stairs", 67],
  ["minecraft:wall_sign", 68],
  ["minecraft:lever", 69],
  ["minecraft:stone_pressure_plate", 70],
  ["minecraft:wooden_pressure_plate", 72],
  ["minecraft:redstone_ore", 73],
  ["minecraft:lit_redstone_ore", 74],
  ["minecraft:unlit_redstone_torch", 75],
  ["minecraft:redstone_torch", 76],
  ["minecraft:stone_button", 77],
  ["minecraft:snow_layer", 78],
  ["minecraft:ice", 79],
  ["minecraft:snow", 80],
  ["minecraft:cactus", 81],
  ["minecraft:clay", 82],
  ["minecraft:reeds", 83],
  ["minecraft:jukebox", 84],
  ["minecraft:oak_fence", 85],
  ["minecraft:pumpkin", 86],
  ["minecraft:netherrack", 87],
  ["minecraft:soul_sand", 88],
  ["minecraft:glowstone", 89],
  ["minecraft:portal", 90],
  ["minecraft:lit_pumpkin", 91],
  ["minecraft:cake_block", 92],
  ["minecraft:unpowered_repeater", 93],
  ["minecraft:powered_repeater", 94],
  ["minecraft:invisible_bedrock", 95],
  ["minecraft:trapdoor", 96],
  ["minecraft:infested_stone", 97],
  ["minecraft:stone_bricks", 98],
  ["minecraft:brown_mushroom_block", 99],
  ["minecraft:red_mushroom_block", 100],
  ["minecraft:iron_bars", 101],
  ["minecraft:glass_pane", 102],
  ["minecraft:melon_block", 103],
  ["minecraft:pumpkin_stem", 104],
  ["minecraft:melon_stem", 105],
  ["minecraft:vine", 106],
  ["minecraft:fence_gate", 107],
  ["minecraft:brick_stairs", 108],
  ["minecraft:stone_brick_stairs", 109],
  ["minecraft:mycelium", 110],
  ["minecraft:waterlily", 111],
  ["minecraft:nether_brick", 112],
  ["minecraft:nether_brick_fence", 113],
  ["minecraft:nether_brick_stairs", 114],
  ["minecraft:nether_wart_plant", 115],
  ["minecraft:enchanting_table", 116],
  ["minecraft:end_portal", 119],
  ["minecraft:end_portal_frame", 120],
  ["minecraft:end_stone", 121],
  ["minecraft:dragon_egg", 122],
  ["minecraft:redstone_lamp", 123],
  ["minecraft:lit_redstone_lamp", 124],
  ["minecraft:dropper", 125],
  ["minecraft:activator_rail", 126],
  ["minecraft:cocoa", 127],
  ["minecraft:sandstone_stairs", 128],
  ["minecraft:emerald_ore", 129],
  ["minecraft:ender_chest", 130],
  ["minecraft:tripwire_hook", 131],
  ["minecraft:tripwire", 132],
  ["minecraft:emerald_block", 133],
  ["minecraft:spruce_stairs", 134],
  ["minecraft:birch_stairs", 135],
  ["minecraft:jungle_stairs", 136],
  ["minecraft:command_block", 137],
  ["minecraft:beacon", 138],
  ["minecraft:cobblestone_wall", 139],
  ["minecraft:carrots", 141],
  ["minecraft:potatoes", 142],
  ["minecraft:wooden_button", 143],
  ["minecraft:skeleton_skull", 144],
  ["minecraft:anvil", 145],
  ["minecraft:trapped_chest", 146],
  ["minecraft:light_weighted_pressure_plate", 147],
  ["minecraft:heavy_weighted_pressure_plate", 148],
  ["minecraft:unpowered_comparator", 149],
  ["minecraft:powered_comparator", 150],
  ["minecraft:daylight_detector", 151],
  ["minecraft:redstone_block", 152],
  ["minecraft:quartz_ore", 153],
  ["minecraft:quartz_block", 155],
  ["minecraft:quartz_stairs", 156],
  ["minecraft:double_oak_slab", 157],
  ["minecraft:oak_slab", 158],
  ["minecraft:stained_hardened_clay", 159],
  ["minecraft:stained_glass_pane", 160],
  ["minecraft:acacia_leaves", 161],
  ["minecraft:acacia_log", 162],
  ["minecraft:acacia_stairs", 163],
  ["minecraft:dark_oak_stairs", 164],
  ["minecraft:slime", 165],
  ["minecraft:iron_trapdoor", 167],
  ["minecraft:prismarine", 168],
  ["minecraft:sea_lantern", 169],
  ["minecraft:hay_block", 170],
  ["minecraft:white_carpet", 171],
  ["minecraft:hardened_clay", 172],
  ["minecraft:coal_block", 173],
  ["minecraft:packed_ice", 174],
  ["minecraft:sunflower", 175],
  ["minecraft:standing_banner", 176],
  ["minecraft:wall_banner", 177],
  ["minecraft:daylight_detector_inverted", 178],
  ["minecraft:red_sandstone", 179],
  ["minecraft:red_sandstone_stairs", 180],
  ["minecraft:red_sandstone_double_slab", 181],
  ["minecraft:red_sandstone_slab", 182],
  ["minecraft:spruce_fence_gate", 183],
  ["minecraft:birch_fence_gate", 184],
  ["minecraft:jungle_fence_gate", 185],
  ["minecraft:dark_oak_fence_gate", 186],
  ["minecraft:acacia_fence_gate", 187],
  ["minecraft:repeating_command_block", 188],
  ["minecraft:chain_command_block", 189],
  ["minecraft:hard_glass_pane", 190],
  ["minecraft:hard_white_stained_glass_pane", 191],
  ["minecraft:chemical_heat", 192],
  ["minecraft:spruce_door", 193],
  ["minecraft:birch_door", 194],
  ["minecraft:jungle_door", 195],
  ["minecraft:acacia_door", 196],
  ["minecraft:dark_oak_door", 197],
  ["minecraft:grass_path", 198],
  ["minecraft:frame_block", 199],
  ["minecraft:chorus_flower", 200],
  ["minecraft:purpur_block", 201],
  ["minecraft:colored_torch_red", 202],
  ["minecraft:purpur_stairs", 203],
  ["minecraft:colored_torch_blue", 204],
  ["minecraft:undyed_shulker_box", 205],
  ["minecraft:end_bricks", 206],
  ["minecraft:frosted_ice", 207],
  ["minecraft:end_rod", 208],
  ["minecraft:end_gateway", 209],
  ["minecraft:allow", 210],
  ["minecraft:deny", 211],
  ["minecraft:border_block", 212],
  ["minecraft:magma", 213],
  ["minecraft:nether_wart_block", 214],
  ["minecraft:red_nether_brick", 215],
  ["minecraft:bone_block", 216],
  ["minecraft:structure_void", 217],
  ["minecraft:white_shulker_box", 218],
  ["minecraft:purple_glazed_terracotta", 219],
  ["minecraft:white_glazed_terracotta", 220],
  ["minecraft:orange_glazed_terracotta", 221],
  ["minecraft:magenta_glazed_terracotta", 222],
  ["minecraft:light_blue_glazed_terracotta", 223],
  ["minecraft:yellow_glazed_terracotta", 224],
  ["minecraft:lime_glazed_terracotta", 225],
  ["minecraft:pink_glazed_terracotta", 226],
  ["minecraft:gray_glazed_terracotta", 227],
  ["minecraft:silver_glazed_terracotta", 228],
  ["minecraft:cyan_glazed_terracotta", 229],
  ["minecraft:blue_glazed_terracotta", 231],
  ["minecraft:brown_glazed_terracotta", 232],
  ["minecraft:green_glazed_terracotta", 233],
  ["minecraft:red_glazed_terracotta", 234],
  ["minecraft:black_glazed_terracotta", 235],
  ["minecraft:white_concrete", 236],
  ["minecraft:white_concrete_powder", 237],
  ["minecraft:compound_creator", 238],
  ["minecraft:underwater_torch", 239],
  ["minecraft:chorus_plant", 240],
  ["minecraft:white_stained_glass", 241],
  ["minecraft:camera", 242],
  ["minecraft:podzol", 243],
  ["minecraft:beetroots", 244],
  ["minecraft:stonecutter", 245],
  ["minecraft:glowingobsidian", 246],
  ["minecraft:netherreactor", 247],
  ["minecraft:info_update", 248],
  ["minecraft:info_update2", 249],
  ["minecraft:moving_block", 250],
  ["minecraft:observer", 251],
  ["minecraft:structure_block", 252],
  ["minecraft:hard_glass", 253],
  ["minecraft:hard_white_stained_glass", 254],
  ["minecraft:reserved6", 255],
  ["minecraft:black_bundle", 257],
  ["minecraft:blue_bundle", 258],
  ["minecraft:brown_bundle", 259],
  ["minecraft:bundle", 260],
  ["minecraft:cyan_bundle", 261],
  ["minecraft:gray_bundle", 262],
  ["minecraft:green_bundle", 263],
  ["minecraft:light_blue_bundle", 264],
  ["minecraft:light_gray_bundle", 265],
  ["minecraft:lime_bundle", 266],
  ["minecraft:magenta_bundle", 267],
  ["minecraft:orange_bundle", 268],
  ["minecraft:pink_bundle", 269],
  ["minecraft:purple_bundle", 270],
  ["minecraft:red_bundle", 271],
  ["minecraft:white_bundle", 272],
  ["minecraft:yellow_bundle", 273],
  ["minecraft:breeze_rod", 274],
  ["minecraft:ominous_trial_key", 275],
  ["minecraft:trial_key", 276],
  ["minecraft:wind_charge", 277],
  ["minecraft:apple", 278],
  ["minecraft:golden_apple", 280],
  ["minecraft:enchanted_golden_apple", 281],
  ["minecraft:mushroom_stew", 282],
  ["minecraft:bread", 283],
  ["minecraft:porkchop", 284],
  ["minecraft:cooked_porkchop", 285],
  ["minecraft:cod", 286],
  ["minecraft:salmon", 287],
  ["minecraft:tropical_fish", 288],
  ["minecraft:pufferfish", 289],
  ["minecraft:cooked_cod", 290],
  ["minecraft:cooked_salmon", 291],
  ["minecraft:dried_kelp", 292],
  ["minecraft:cookie", 293],
  ["minecraft:melon_slice", 294],
  ["minecraft:beef", 295],
  ["minecraft:cooked_beef", 296],
  ["minecraft:chicken", 297],
  ["minecraft:cooked_chicken", 298],
  ["minecraft:rotten_flesh", 299],
  ["minecraft:spider_eye", 300],
  ["minecraft:carrot", 301],
  ["minecraft:potato", 302],
  ["minecraft:baked_potato", 303],
  ["minecraft:poisonous_potato", 304],
  ["minecraft:golden_carrot", 305],
  ["minecraft:pumpkin_pie", 306],
  ["minecraft:beetroot", 307],
  ["minecraft:beetroot_soup", 308],
  ["minecraft:sweet_berries", 309],
  ["minecraft:rabbit", 310],
  ["minecraft:cooked_rabbit", 311],
  ["minecraft:rabbit_stew", 312],
  ["minecraft:wheat_seeds", 313],
  ["minecraft:pumpkin_seeds", 314],
  ["minecraft:melon_seeds", 315],
  ["minecraft:nether_wart", 316],
  ["minecraft:beetroot_seeds", 317],
  ["minecraft:torchflower_seeds", 318],
  ["minecraft:pitcher_pod", 319],
  ["minecraft:iron_shovel", 320],
  ["minecraft:iron_pickaxe", 321],
  ["minecraft:iron_axe", 322],
  ["minecraft:flint_and_steel", 323],
  ["minecraft:bow", 324],
  ["minecraft:arrow", 325],
  ["minecraft:coal", 326],
  ["minecraft:charcoal", 327],
  ["minecraft:diamond", 328],
  ["minecraft:iron_ingot", 329],
  ["minecraft:gold_ingot", 330],
  ["minecraft:iron_sword", 331],
  ["minecraft:wooden_sword", 332],
  ["minecraft:wooden_shovel", 333],
  ["minecraft:wooden_pickaxe", 334],
  ["minecraft:wooden_axe", 335],
  ["minecraft:stone_sword", 336],
  ["minecraft:stone_shovel", 337],
  ["minecraft:stone_pickaxe", 338],
  ["minecraft:stone_axe", 339],
  ["minecraft:diamond_sword", 340],
  ["minecraft:diamond_shovel", 341],
  ["minecraft:diamond_pickaxe", 342],
  ["minecraft:diamond_axe", 343],
  ["minecraft:mace", 344],
  ["minecraft:stick", 345],
  ["minecraft:bowl", 346],
  ["minecraft:golden_sword", 347],
  ["minecraft:golden_shovel", 348],
  ["minecraft:golden_pickaxe", 349],
  ["minecraft:golden_axe", 350],
  ["minecraft:string", 351],
  ["minecraft:feather", 352],
  ["minecraft:gunpowder", 353],
  ["minecraft:wooden_hoe", 354],
  ["minecraft:stone_hoe", 355],
  ["minecraft:iron_hoe", 356],
  ["minecraft:diamond_hoe", 357],
  ["minecraft:golden_hoe", 358],
  ["minecraft:wheat", 359],
  ["minecraft:leather_helmet", 360],
  ["minecraft:leather_chestplate", 361],
  ["minecraft:leather_leggings", 362],
  ["minecraft:leather_boots", 363],
  ["minecraft:chainmail_helmet", 364],
  ["minecraft:chainmail_chestplate", 365],
  ["minecraft:chainmail_leggings", 366],
  ["minecraft:chainmail_boots", 367],
  ["minecraft:iron_helmet", 368],
  ["minecraft:iron_chestplate", 369],
  ["minecraft:iron_leggings", 370],
  ["minecraft:iron_boots", 371],
  ["minecraft:diamond_helmet", 372],
  ["minecraft:diamond_chestplate", 373],
  ["minecraft:diamond_leggings", 374],
  ["minecraft:diamond_boots", 375],
  ["minecraft:golden_helmet", 376],
  ["minecraft:golden_chestplate", 377],
  ["minecraft:golden_leggings", 378],
  ["minecraft:golden_boots", 379],
  ["minecraft:shield", 380],
  ["minecraft:flint", 381],
  ["minecraft:painting", 382],
  ["minecraft:oak_sign", 383],
  ["minecraft:wooden_door", 384],
  ["minecraft:bucket", 385],
  ["minecraft:milk_bucket", 386],
  ["minecraft:water_bucket", 387],
  ["minecraft:lava_bucket", 388],
  ["minecraft:cod_bucket", 389],
  ["minecraft:salmon_bucket", 390],
  ["minecraft:tropical_fish_bucket", 391],
  ["minecraft:pufferfish_bucket", 392],
  ["minecraft:powder_snow_bucket", 393],
  ["minecraft:axolotl_bucket", 394],
  ["minecraft:minecart", 395],
  ["minecraft:saddle", 396],
  ["minecraft:iron_door", 397],
  ["minecraft:redstone", 398],
  ["minecraft:snowball", 399],
  ["minecraft:oak_boat", 401],
  ["minecraft:birch_boat", 402],
  ["minecraft:jungle_boat", 403],
  ["minecraft:spruce_boat", 404],
  ["minecraft:acacia_boat", 405],
  ["minecraft:dark_oak_boat", 406],
  ["minecraft:leather", 407],
  ["minecraft:kelp", 408],
  ["minecraft:brick", 409],
  ["minecraft:clay_ball", 410],
  ["minecraft:sugar_cane", 411],
  ["minecraft:paper", 412],
  ["minecraft:book", 413],
  ["minecraft:slime_ball", 414],
  ["minecraft:chest_minecart", 415],
  ["minecraft:egg", 416],
  ["minecraft:compass", 417],
  ["minecraft:fishing_rod", 418],
  ["minecraft:clock", 419],
  ["minecraft:glowstone_dust", 420],
  ["minecraft:black_dye", 421],
  ["minecraft:red_dye", 422],
  ["minecraft:green_dye", 423],
  ["minecraft:brown_dye", 424],
  ["minecraft:blue_dye", 425],
  ["minecraft:purple_dye", 426],
  ["minecraft:cyan_dye", 427],
  ["minecraft:light_gray_dye", 428],
  ["minecraft:gray_dye", 429],
  ["minecraft:pink_dye", 430],
  ["minecraft:lime_dye", 431],
  ["minecraft:yellow_dye", 432],
  ["minecraft:light_blue_dye", 433],
  ["minecraft:magenta_dye", 434],
  ["minecraft:orange_dye", 435],
  ["minecraft:white_dye", 436],
  ["minecraft:bone_meal", 437],
  ["minecraft:cocoa_beans", 438],
  ["minecraft:ink_sac", 439],
  ["minecraft:lapis_lazuli", 440],
  ["minecraft:bone", 441],
  ["minecraft:sugar", 442],
  ["minecraft:cake", 443],
  ["minecraft:bed", 444],
  ["minecraft:repeater", 445],
  ["minecraft:filled_map", 446],
  ["minecraft:shears", 447],
  ["minecraft:ender_pearl", 448],
  ["minecraft:blaze_rod", 449],
  ["minecraft:ghast_tear", 451],
  ["minecraft:gold_nugget", 452],
  ["minecraft:potion", 453],
  ["minecraft:glass_bottle", 454],
  ["minecraft:fermented_spider_eye", 455],
  ["minecraft:blaze_powder", 456],
  ["minecraft:magma_cream", 457],
  ["minecraft:brewing_stand", 458],
  ["minecraft:cauldron", 459],
  ["minecraft:ender_eye", 460],
  ["minecraft:glistering_melon_slice", 461],
  ["minecraft:chicken_spawn_egg", 462],
  ["minecraft:cow_spawn_egg", 463],
  ["minecraft:pig_spawn_egg", 464],
  ["minecraft:sheep_spawn_egg", 465],
  ["minecraft:wolf_spawn_egg", 466],
  ["minecraft:mooshroom_spawn_egg", 467],
  ["minecraft:creeper_spawn_egg", 468],
  ["minecraft:enderman_spawn_egg", 469],
  ["minecraft:silverfish_spawn_egg", 470],
  ["minecraft:skeleton_spawn_egg", 471],
  ["minecraft:slime_spawn_egg", 472],
  ["minecraft:spider_spawn_egg", 473],
  ["minecraft:zombie_spawn_egg", 474],
  ["minecraft:zombie_pigman_spawn_egg", 475],
  ["minecraft:villager_spawn_egg", 476],
  ["minecraft:squid_spawn_egg", 477],
  ["minecraft:ocelot_spawn_egg", 478],
  ["minecraft:witch_spawn_egg", 479],
  ["minecraft:bat_spawn_egg", 480],
  ["minecraft:ghast_spawn_egg", 481],
  ["minecraft:magma_cube_spawn_egg", 482],
  ["minecraft:blaze_spawn_egg", 483],
  ["minecraft:cave_spider_spawn_egg", 484],
  ["minecraft:horse_spawn_egg", 485],
  ["minecraft:rabbit_spawn_egg", 486],
  ["minecraft:endermite_spawn_egg", 487],
  ["minecraft:guardian_spawn_egg", 488],
  ["minecraft:stray_spawn_egg", 489],
  ["minecraft:bogged_spawn_egg", 490],
  ["minecraft:husk_spawn_egg", 491],
  ["minecraft:wither_skeleton_spawn_egg", 492],
  ["minecraft:donkey_spawn_egg", 493],
  ["minecraft:mule_spawn_egg", 494],
  ["minecraft:skeleton_horse_spawn_egg", 495],
  ["minecraft:zombie_horse_spawn_egg", 496],
  ["minecraft:shulker_spawn_egg", 497],
  ["minecraft:npc_spawn_egg", 498],
  ["minecraft:elder_guardian_spawn_egg", 499],
  ["minecraft:polar_bear_spawn_egg", 500],
  ["minecraft:llama_spawn_egg", 501],
  ["minecraft:vindicator_spawn_egg", 502],
  ["minecraft:evoker_spawn_egg", 503],
  ["minecraft:vex_spawn_egg", 504],
  ["minecraft:zombie_villager_spawn_egg", 505],
  ["minecraft:parrot_spawn_egg", 506],
  ["minecraft:tropical_fish_spawn_egg", 507],
  ["minecraft:cod_spawn_egg", 508],
  ["minecraft:pufferfish_spawn_egg", 509],
  ["minecraft:salmon_spawn_egg", 510],
  ["minecraft:drowned_spawn_egg", 511],
  ["minecraft:dolphin_spawn_egg", 512],
  ["minecraft:turtle_spawn_egg", 513],
  ["minecraft:phantom_spawn_egg", 514],
  ["minecraft:agent_spawn_egg", 515],
  ["minecraft:cat_spawn_egg", 516],
  ["minecraft:panda_spawn_egg", 517],
  ["minecraft:fox_spawn_egg", 518],
  ["minecraft:pillager_spawn_egg", 519],
  ["minecraft:wandering_trader_spawn_egg", 520],
  ["minecraft:ravager_spawn_egg", 521],
  ["minecraft:bee_spawn_egg", 522],
  ["minecraft:strider_spawn_egg", 523],
  ["minecraft:hoglin_spawn_egg", 524],
  ["minecraft:piglin_spawn_egg", 525],
  ["minecraft:zoglin_spawn_egg", 526],
  ["minecraft:piglin_brute_spawn_egg", 527],
  ["minecraft:sniffer_spawn_egg", 528],
  ["minecraft:breeze_spawn_egg", 529],
  ["minecraft:axolotl_spawn_egg", 530],
  ["minecraft:goat_spawn_egg", 531],
  ["minecraft:glow_squid_spawn_egg", 532],
  ["minecraft:iron_golem_spawn_egg", 533],
  ["minecraft:snow_golem_spawn_egg", 534],
  ["minecraft:ender_dragon_spawn_egg", 535],
  ["minecraft:wither_spawn_egg", 536],
  ["minecraft:glow_ink_sac", 537],
  ["minecraft:copper_ingot", 538],
  ["minecraft:raw_iron", 539],
  ["minecraft:raw_gold", 540],
  ["minecraft:raw_copper", 541],
  ["minecraft:experience_bottle", 542],
  ["minecraft:fire_charge", 543],
  ["minecraft:writable_book", 544],
  ["minecraft:written_book", 545],
  ["minecraft:emerald", 546],
  ["minecraft:frame", 547],
  ["minecraft:flower_pot", 548],
  ["minecraft:empty_map", 549],
  ["minecraft:carrot_on_a_stick", 550],
  ["minecraft:nether_star", 551],
  ["minecraft:firework_rocket", 552],
  ["minecraft:firework_star", 553],
  ["minecraft:enchanted_book", 554],
  ["minecraft:comparator", 555],
  ["minecraft:netherbrick", 556],
  ["minecraft:quartz", 557],
  ["minecraft:tnt_minecart", 558],
  ["minecraft:hopper_minecart", 559],
  ["minecraft:hopper", 560],
  ["minecraft:rabbit_foot", 561],
  ["minecraft:rabbit_hide", 562],
  ["minecraft:leather_horse_armor", 563],
  ["minecraft:iron_horse_armor", 564],
  ["minecraft:golden_horse_armor", 565],
  ["minecraft:diamond_horse_armor", 566],
  ["minecraft:music_disc_13", 567],
  ["minecraft:music_disc_cat", 568],
  ["minecraft:music_disc_blocks", 569],
  ["minecraft:music_disc_chirp", 570],
  ["minecraft:music_disc_far", 571],
  ["minecraft:music_disc_mall", 572],
  ["minecraft:music_disc_mellohi", 573],
  ["minecraft:music_disc_stal", 574],
  ["minecraft:music_disc_strad", 575],
  ["minecraft:music_disc_ward", 576],
  ["minecraft:music_disc_11", 577],
  ["minecraft:music_disc_wait", 578],
  ["minecraft:trident", 579],
  ["minecraft:lead", 580],
  ["minecraft:name_tag", 581],
  ["minecraft:prismarine_crystals", 582],
  ["minecraft:mutton", 583],
  ["minecraft:cooked_mutton", 584],
  ["minecraft:armor_stand", 585],
  ["minecraft:spruce_door", 586],
  ["minecraft:birch_door", 587],
  ["minecraft:jungle_door", 588],
  ["minecraft:acacia_door", 589],
  ["minecraft:dark_oak_door", 590],
  ["minecraft:chorus_fruit", 591],
  ["minecraft:popped_chorus_fruit", 592],
  ["minecraft:dragon_breath", 593],
  ["minecraft:splash_potion", 594],
  ["minecraft:lingering_potion", 595],
  ["minecraft:command_block_minecart", 596],
  ["minecraft:elytra", 597],
  ["minecraft:prismarine_shard", 598],
  ["minecraft:shulker_shell", 599],
  ["minecraft:banner", 600],
  ["minecraft:totem_of_undying", 601],
  ["minecraft:iron_nugget", 602],
  ["minecraft:nautilus_shell", 603],
  ["minecraft:heart_of_the_sea", 604],
  ["minecraft:turtle_scute", 605],
  ["minecraft:turtle_helmet", 606],
  ["minecraft:phantom_membrane", 607],
  ["minecraft:crossbow", 608],
  ["minecraft:spruce_sign", 609],
  ["minecraft:birch_sign", 610],
  ["minecraft:jungle_sign", 611],
  ["minecraft:acacia_sign", 612],
  ["minecraft:dark_oak_sign", 613],
  ["minecraft:flower_banner_pattern", 614],
  ["minecraft:creeper_banner_pattern", 615],
  ["minecraft:skull_banner_pattern", 616],
  ["minecraft:mojang_banner_pattern", 617],
  ["minecraft:field_masoned_banner_pattern", 618],
  ["minecraft:bordure_indented_banner_pattern", 619],
  ["minecraft:piglin_banner_pattern", 620],
  ["minecraft:globe_banner_pattern", 621],
  ["minecraft:flow_banner_pattern", 622],
  ["minecraft:guster_banner_pattern", 623],
  ["minecraft:campfire", 624],
  ["minecraft:suspicious_stew", 625],
  ["minecraft:honeycomb", 626],
  ["minecraft:honey_bottle", 627],
  ["minecraft:ominous_bottle", 628],
  ["minecraft:chalkboard", 629],
  ["minecraft:camera_block", 630],
  ["minecraft:compound", 631],
  ["minecraft:ice_bomb", 632],
  ["minecraft:bleach", 633],
  ["minecraft:rapid_fertilizer", 634],
  ["minecraft:balloon", 635],
  ["minecraft:medicine", 636],
  ["minecraft:sparkler", 637],
  ["minecraft:glow_stick", 638],
  ["minecraft:lodestone_compass", 639],
  ["minecraft:netherite_sword", 640],
  ["minecraft:netherite_shovel", 641],
  ["minecraft:netherite_pickaxe", 642],
  ["minecraft:netherite_axe", 643],
  ["minecraft:netherite_hoe", 644],
  ["minecraft:netherite_ingot", 645],
  ["minecraft:netherite_helmet", 646],
  ["minecraft:netherite_chestplate", 647],
  ["minecraft:netherite_leggings", 648],
  ["minecraft:netherite_boots", 649],
  ["minecraft:netherite_scrap", 650],
  ["minecraft:crimson_sign", 651],
  ["minecraft:warped_sign", 652],
  ["minecraft:crimson_door", 653],
  ["minecraft:warped_door", 654],
  ["minecraft:warped_fungus_on_a_stick", 655],
  ["minecraft:chain", 656],
  ["minecraft:music_disc_pigstep", 657],
  ["minecraft:nether_sprouts", 658],
  ["minecraft:soul_campfire", 659],
  ["minecraft:glow_frame", 660],
  ["minecraft:amethyst_shard", 661],
  ["minecraft:spyglass", 662],
  ["minecraft:music_disc_otherside", 663],
  ["minecraft:goat_horn", 664],
  ["minecraft:frog_spawn_egg", 665],
  ["minecraft:tadpole_spawn_egg", 666],
  ["minecraft:tadpole_bucket", 667],
  ["minecraft:allay_spawn_egg", 668],
  ["minecraft:warden_spawn_egg", 669],
  ["minecraft:mangrove_door", 670],
  ["minecraft:mangrove_sign", 671],
  ["minecraft:mangrove_boat", 672],
  ["minecraft:music_disc_5", 673],
  ["minecraft:disc_fragment_5", 674],
  ["minecraft:oak_chest_boat", 675],
  ["minecraft:birch_chest_boat", 676],
  ["minecraft:jungle_chest_boat", 677],
  ["minecraft:spruce_chest_boat", 678],
  ["minecraft:acacia_chest_boat", 679],
  ["minecraft:dark_oak_chest_boat", 680],
  ["minecraft:mangrove_chest_boat", 681],
  ["minecraft:recovery_compass", 683],
  ["minecraft:echo_shard", 684],
  ["minecraft:trader_llama_spawn_egg", 685],
  ["minecraft:cherry_boat", 686],
  ["minecraft:cherry_chest_boat", 687],
  ["minecraft:cherry_sign", 688],
  ["minecraft:bamboo_sign", 689],
  ["minecraft:bamboo_raft", 690],
  ["minecraft:bamboo_chest_raft", 691],
  ["minecraft:camel_spawn_egg", 692],
  ["minecraft:angler_pottery_sherd", 693],
  ["minecraft:archer_pottery_sherd", 694],
  ["minecraft:arms_up_pottery_sherd", 695],
  ["minecraft:blade_pottery_sherd", 696],
  ["minecraft:brewer_pottery_sherd", 697],
  ["minecraft:burn_pottery_sherd", 698],
  ["minecraft:danger_pottery_sherd", 699],
  ["minecraft:explorer_pottery_sherd", 700],
  ["minecraft:flow_pottery_sherd", 701],
  ["minecraft:friend_pottery_sherd", 702],
  ["minecraft:guster_pottery_sherd", 703],
  ["minecraft:heart_pottery_sherd", 704],
  ["minecraft:heartbreak_pottery_sherd", 705],
  ["minecraft:howl_pottery_sherd", 706],
  ["minecraft:miner_pottery_sherd", 707],
  ["minecraft:mourner_pottery_sherd", 708],
  ["minecraft:plenty_pottery_sherd", 709],
  ["minecraft:prize_pottery_sherd", 710],
  ["minecraft:scrape_pottery_sherd", 711],
  ["minecraft:sheaf_pottery_sherd", 712],
  ["minecraft:shelter_pottery_sherd", 713],
  ["minecraft:skull_pottery_sherd", 714],
  ["minecraft:snort_pottery_sherd", 715],
  ["minecraft:brush", 716],
  ["minecraft:netherite_upgrade_smithing_template", 717],
  ["minecraft:sentry_armor_trim_smithing_template", 718],
  ["minecraft:dune_armor_trim_smithing_template", 719],
  ["minecraft:coast_armor_trim_smithing_template", 720],
  ["minecraft:wild_armor_trim_smithing_template", 721],
  ["minecraft:ward_armor_trim_smithing_template", 722],
  ["minecraft:eye_armor_trim_smithing_template", 723],
  ["minecraft:vex_armor_trim_smithing_template", 724],
  ["minecraft:tide_armor_trim_smithing_template", 725],
  ["minecraft:snout_armor_trim_smithing_template", 726],
  ["minecraft:rib_armor_trim_smithing_template", 727],
  ["minecraft:spire_armor_trim_smithing_template", 728],
  ["minecraft:silence_armor_trim_smithing_template", 729],
  ["minecraft:wayfinder_armor_trim_smithing_template", 730],
  ["minecraft:raiser_armor_trim_smithing_template", 731],
  ["minecraft:shaper_armor_trim_smithing_template", 732],
  ["minecraft:host_armor_trim_smithing_template", 733],
  ["minecraft:flow_armor_trim_smithing_template", 734],
  ["minecraft:bolt_armor_trim_smithing_template", 735],
  ["minecraft:music_disc_relic", 736],
  ["minecraft:skull", 737],
  ["minecraft:white_terracotta", 738],
  ["minecraft:armadillo_spawn_egg", 739],
  ["minecraft:armadillo_scute", 740],
  ["minecraft:wolf_armor", 741],
  ["minecraft:pale_oak_boat", 744],
  ["minecraft:pale_oak_chest_boat", 745],
  ["minecraft:pale_oak_sign", 746],
  ["minecraft:creaking_spawn_egg", 747],
  ["minecraft:resin_brick", 748],
  ["minecraft:blue_egg", 749],
  ["minecraft:brown_egg", 750],
  ["minecraft:happy_ghast_spawn_egg", 751],
  ["minecraft:black_harness", 752],
  ["minecraft:blue_harness", 753],
  ["minecraft:brown_harness", 754],
  ["minecraft:cyan_harness", 755],
  ["minecraft:gray_harness", 756],
  ["minecraft:green_harness", 757],
  ["minecraft:light_blue_harness", 758],
  ["minecraft:light_gray_harness", 759],
  ["minecraft:lime_harness", 760],
  ["minecraft:magenta_harness", 761],
  ["minecraft:orange_harness", 762],
  ["minecraft:pink_harness", 763],
  ["minecraft:purple_harness", 764],
  ["minecraft:red_harness", 765],
  ["minecraft:white_harness", 766],
  ["minecraft:yellow_harness", 767],
  ["minecraft:copper_golem_spawn_egg", 768],
  ["minecraft:copper_sword", 769],
  ["minecraft:copper_shovel", 770],
  ["minecraft:copper_pickaxe", 771],
  ["minecraft:copper_axe", 772],
  ["minecraft:copper_hoe", 773],
  ["minecraft:copper_helmet", 774],
  ["minecraft:copper_chestplate", 775],
  ["minecraft:copper_leggings", 776],
  ["minecraft:copper_boots", 777],
  ["minecraft:copper_nugget", 778],
  ["minecraft:wool", 779],
  ["minecraft:carpet", 780],
  ["minecraft:log", 781],
  ["minecraft:fence", 782],
  ["minecraft:stonebrick", 783],
  ["minecraft:coral_block", 784],
  ["minecraft:stone_block_slab", 785],
  ["minecraft:stone_block_slab2", 786],
  ["minecraft:stone_block_slab3", 787],
  ["minecraft:stone_block_slab4", 788],
  ["minecraft:double_stone_block_slab", 789],
  ["minecraft:double_stone_block_slab2", 790],
  ["minecraft:double_stone_block_slab3", 791],
  ["minecraft:double_stone_block_slab4", 792],
  ["minecraft:coral_fan", 793],
  ["minecraft:coral_fan_dead", 794],
  ["minecraft:sapling", 795],
  ["minecraft:leaves", 796],
  ["minecraft:leaves2", 797],
  ["minecraft:wooden_slab", 798],
  ["minecraft:red_flower", 799],
  ["minecraft:double_plant", 800],
  ["minecraft:double_wooden_slab", 801],
  ["minecraft:coral", 802],
  ["minecraft:tallgrass", 803],
  ["minecraft:log2", 804],
  ["minecraft:monster_egg", 805],
  ["minecraft:concrete", 806],
  ["minecraft:concrete_powder", 807],
  ["minecraft:stained_glass", 808],
  ["minecraft:stained_glass_pane", 809],
  ["minecraft:shulker_box", 810],
  ["minecraft:wood", 811],
  ["minecraft:music_disc_creator", 812],
  ["minecraft:music_disc_creator_music_box", 813],
  ["minecraft:music_disc_precipice", 814],
  ["minecraft:music_disc_tears", 815],
  ["minecraft:music_disc_lava_chicken", 816],
  ["minecraft:chemistry_table", 817],
  ["minecraft:hard_stained_glass", 818],
  ["minecraft:hard_stained_glass_pane", 819],
  ["minecraft:colored_torch_rg", 820],
  ["minecraft:colored_torch_bp", 821],
  ["minecraft:light_block", 822],
  ["minecraft:boat", 823],
  ["minecraft:dye", 824],
  ["minecraft:banner_pattern", 825],
  ["minecraft:spawn_egg", 826],
  ["minecraft:end_crystal", 827],
  ["minecraft:glow_berries", 828]
]);
var typeIdToDataId = /* @__PURE__ */ new Map([
  ["minecraft:respawn_anchor_charge_0", -272],
  ["minecraft:respawn_anchor_charge_1", -272 + 1 / 65536],
  ["minecraft:respawn_anchor_charge_2", -272 + 2 / 65536],
  ["minecraft:respawn_anchor_charge_3", -272 + 3 / 65536],
  ["minecraft:respawn_anchor_charge_4", -272 + 4 / 65536],
  ["minecraft:barrel_closed", -203],
  ["minecraft:barrel_open", -203 + 1 / 65536],
  ["minecraft:redstone_wire_power_0", 55],
  ["minecraft:redstone_wire_power_1", 55 + 1 / 65536],
  ["minecraft:redstone_wire_power_2", 55 + 2 / 65536],
  ["minecraft:redstone_wire_power_3", 55 + 3 / 65536],
  ["minecraft:redstone_wire_power_4", 55 + 4 / 65536],
  ["minecraft:redstone_wire_power_5", 55 + 5 / 65536],
  ["minecraft:redstone_wire_power_6", 55 + 6 / 65536],
  ["minecraft:redstone_wire_power_7", 55 + 7 / 65536],
  ["minecraft:redstone_wire_power_8", 55 + 8 / 65536],
  ["minecraft:redstone_wire_power_9", 55 + 9 / 65536],
  ["minecraft:redstone_wire_power_10", 55 + 10 / 65536],
  ["minecraft:redstone_wire_power_11", 55 + 11 / 65536],
  ["minecraft:redstone_wire_power_12", 55 + 12 / 65536],
  ["minecraft:redstone_wire_power_13", 55 + 13 / 65536],
  ["minecraft:redstone_wire_power_14", 55 + 14 / 65536],
  ["minecraft:redstone_wire_power_15", 55 + 15 / 65536],
  ["minecraft:wheat_plant_stage_0", 59],
  ["minecraft:wheat_plant_stage_1", 59 + 1 / 65536],
  ["minecraft:wheat_plant_stage_2", 59 + 2 / 65536],
  ["minecraft:wheat_plant_stage_3", 59 + 3 / 65536],
  ["minecraft:wheat_plant_stage_4", 59 + 4 / 65536],
  ["minecraft:wheat_plant_stage_5", 59 + 5 / 65536],
  ["minecraft:wheat_plant_stage_6", 59 + 6 / 65536],
  ["minecraft:wheat_plant_stage_7", 59 + 7 / 65536],
  ["minecraft:wet_farmland", 60 + 1 / 65536],
  ["minecraft:snow_layer_1", 78],
  ["minecraft:snow_layer_2", 78 + 1 / 65536],
  ["minecraft:snow_layer_3", 78 + 2 / 65536],
  ["minecraft:snow_layer_4", 78 + 3 / 65536],
  ["minecraft:snow_layer_5", 78 + 4 / 65536],
  ["minecraft:snow_layer_6", 78 + 5 / 65536],
  ["minecraft:snow_layer_7", 78 + 6 / 65536],
  ["minecraft:snow_layer_8", 78 + 7 / 65536],
  ["minecraft:cake_block_slice_0", 92],
  ["minecraft:cake_block_slice_1", 92 + 1 / 65536],
  ["minecraft:cake_block_slice_2", 92 + 2 / 65536],
  ["minecraft:cake_block_slice_3", 92 + 3 / 65536],
  ["minecraft:cake_block_slice_4", 92 + 4 / 65536],
  ["minecraft:cake_block_slice_5", 92 + 5 / 65536],
  ["minecraft:cake_block_slice_6", 92 + 6 / 65536],
  ["minecraft:brown_mushroom_block_bit_0", 99],
  ["minecraft:brown_mushroom_block_bit_1", 99 + 1 / 65536],
  ["minecraft:brown_mushroom_block_bit_2", 99 + 2 / 65536],
  ["minecraft:brown_mushroom_block_bit_3", 99 + 3 / 65536],
  ["minecraft:brown_mushroom_block_bit_4", 99 + 4 / 65536],
  ["minecraft:brown_mushroom_block_bit_5", 99 + 5 / 65536],
  ["minecraft:brown_mushroom_block_bit_6", 99 + 6 / 65536],
  ["minecraft:brown_mushroom_block_bit_7", 99 + 7 / 65536],
  ["minecraft:brown_mushroom_block_bit_8", 99 + 8 / 65536],
  ["minecraft:brown_mushroom_block_bit_9", 99 + 9 / 65536],
  ["minecraft:brown_mushroom_block_bit_10", 99 + 10 / 65536],
  ["minecraft:brown_mushroom_block_bit_11", 99 + 11 / 65536],
  ["minecraft:brown_mushroom_block_bit_12", 99 + 12 / 65536],
  ["minecraft:brown_mushroom_block_bit_13", 99 + 13 / 65536],
  ["minecraft:brown_mushroom_block_bit_14", 99 + 14 / 65536],
  ["minecraft:brown_mushroom_block_bit_15", 99 + 15 / 65536],
  ["minecraft:red_mushroom_block_bit_0", 100],
  ["minecraft:red_mushroom_block_bit_1", 100 + 1 / 65536],
  ["minecraft:red_mushroom_block_bit_2", 100 + 2 / 65536],
  ["minecraft:red_mushroom_block_bit_3", 100 + 3 / 65536],
  ["minecraft:red_mushroom_block_bit_4", 100 + 4 / 65536],
  ["minecraft:red_mushroom_block_bit_5", 100 + 5 / 65536],
  ["minecraft:red_mushroom_block_bit_6", 100 + 6 / 65536],
  ["minecraft:red_mushroom_block_bit_7", 100 + 7 / 65536],
  ["minecraft:red_mushroom_block_bit_8", 100 + 8 / 65536],
  ["minecraft:red_mushroom_block_bit_9", 100 + 9 / 65536],
  ["minecraft:red_mushroom_block_bit_10", 100 + 10 / 65536],
  ["minecraft:red_mushroom_block_bit_11", 100 + 11 / 65536],
  ["minecraft:red_mushroom_block_bit_12", 100 + 12 / 65536],
  ["minecraft:red_mushroom_block_bit_13", 100 + 13 / 65536],
  ["minecraft:red_mushroom_block_bit_14", 100 + 14 / 65536],
  ["minecraft:red_mushroom_block_bit_15", 100 + 15 / 65536],
  ["minecraft:attached_pumpkin_stem", 104 + 1 / 65536],
  ["minecraft:attached_melon_stem", 105 + 1 / 65536],
  ["minecraft:nether_wart_plant_stage_0", 115],
  ["minecraft:nether_wart_plant_stage_1", 115 + 1 / 65536],
  ["minecraft:nether_wart_plant_stage_2", 115 + 2 / 65536],
  ["minecraft:nether_wart_plant_stage_3", 115 + 3 / 65536],
  ["minecraft:filled_end_portal_frame", 120 + 4 / 65536],
  ["minecraft:cocoa_stage_0", 127],
  ["minecraft:cocoa_stage_1", 127 + 1 / 65536],
  ["minecraft:cocoa_stage_2", 127 + 2 / 65536],
  ["minecraft:cocoa_stage_3", 127 + 3 / 65536],
  ["minecraft:conditional_command_block", 137 + 8 / 65536],
  ["minecraft:carrots_stage_0", 141],
  ["minecraft:carrots_stage_1", 141 + 1 / 65536],
  ["minecraft:carrots_stage_2", 141 + 2 / 65536],
  ["minecraft:carrots_stage_3", 141 + 3 / 65536],
  ["minecraft:carrots_stage_4", 141 + 4 / 65536],
  ["minecraft:carrots_stage_5", 141 + 5 / 65536],
  ["minecraft:carrots_stage_6", 141 + 6 / 65536],
  ["minecraft:carrots_stage_7", 141 + 7 / 65536],
  ["minecraft:potatoes_stage_0", 142],
  ["minecraft:potatoes_stage_1", 142 + 1 / 65536],
  ["minecraft:potatoes_stage_2", 142 + 2 / 65536],
  ["minecraft:potatoes_stage_3", 142 + 3 / 65536],
  ["minecraft:potatoes_stage_4", 142 + 4 / 65536],
  ["minecraft:potatoes_stage_5", 142 + 5 / 65536],
  ["minecraft:potatoes_stage_6", 142 + 6 / 65536],
  ["minecraft:potatoes_stage_7", 142 + 7 / 65536],
  ["minecraft:black_standing_banner", 176],
  ["minecraft:red_standing_banner", 176 + 1 / 65536],
  ["minecraft:green_standing_banner", 176 + 2 / 65536],
  ["minecraft:brown_standing_banner", 176 + 3 / 65536],
  ["minecraft:blue_standing_banner", 176 + 4 / 65536],
  ["minecraft:purple_standing_banner", 176 + 5 / 65536],
  ["minecraft:cyan_standing_banner", 176 + 6 / 65536],
  ["minecraft:light_gray_standing_banner", 176 + 7 / 65536],
  ["minecraft:gray_standing_banner", 176 + 8 / 65536],
  ["minecraft:pink_standing_banner", 176 + 9 / 65536],
  ["minecraft:lime_standing_banner", 176 + 10 / 65536],
  ["minecraft:yellow_standing_banner", 176 + 11 / 65536],
  ["minecraft:light_blue_standing_banner", 176 + 12 / 65536],
  ["minecraft:magenta_standing_banner", 176 + 13 / 65536],
  ["minecraft:orange_standing_banner", 176 + 14 / 65536],
  ["minecraft:white_standing_banner", 176 + 15 / 65536],
  ["minecraft:black_wall_banner", 177],
  ["minecraft:red_wall_banner", 177 + 1 / 65536],
  ["minecraft:green_wall_banner", 177 + 2 / 65536],
  ["minecraft:brown_wall_banner", 177 + 3 / 65536],
  ["minecraft:blue_wall_banner", 177 + 4 / 65536],
  ["minecraft:purple_wall_banner", 177 + 5 / 65536],
  ["minecraft:cyan_wall_banner", 177 + 6 / 65536],
  ["minecraft:light_gray_wall_banner", 177 + 7 / 65536],
  ["minecraft:gray_wall_banner", 177 + 8 / 65536],
  ["minecraft:pink_wall_banner", 177 + 9 / 65536],
  ["minecraft:lime_wall_banner", 177 + 10 / 65536],
  ["minecraft:yellow_wall_banner", 177 + 11 / 65536],
  ["minecraft:light_blue_wall_banner", 177 + 12 / 65536],
  ["minecraft:magenta_wall_banner", 177 + 13 / 65536],
  ["minecraft:orange_wall_banner", 177 + 14 / 65536],
  ["minecraft:white_wall_banner", 177 + 15 / 65536],
  ["minecraft:conditional_repeating_command_block", 188 + 8 / 65536],
  ["minecraft:conditional_chain_command_block", 189 + 8 / 65536],
  ["minecraft:beetroots_stage_0", 244],
  ["minecraft:beetroots_stage_1", 244 + 1 / 65536],
  ["minecraft:beetroots_stage_2", 244 + 2 / 65536],
  ["minecraft:beetroots_stage_3", 244 + 3 / 65536],
  ["minecraft:beetroots_stage_4", 244 + 4 / 65536],
  ["minecraft:beetroots_stage_5", 244 + 5 / 65536],
  ["minecraft:beetroots_stage_6", 244 + 6 / 65536],
  ["minecraft:beetroots_stage_7", 244 + 7 / 65536],
  ["minecraft:structure_block_data", 252],
  ["minecraft:structure_block_save", 252 + 1 / 65536],
  ["minecraft:structure_block_load", 252 + 2 / 65536],
  ["minecraft:structure_block_corner", 252 + 3 / 65536],
  ["minecraft:structure_block_invalid", 252 + 4 / 65536],
  ["minecraft:structure_block_export", 252 + 5 / 65536],
  ["minecraft:splash_arrow", 325 + 1 / 65536],
  ["minecraft:mundane_arrow", 325 + 2 / 65536],
  ["minecraft:thick_arrow", 325 + 4 / 65536],
  ["minecraft:awkward_arrow", 325 + 5 / 65536],
  ["minecraft:night_vision_arrow", 325 + 6 / 65536],
  ["minecraft:leaping_arrow", 325 + 9 / 65536],
  ["minecraft:fire_resistance_arrow", 325 + 13 / 65536],
  ["minecraft:swiftness_arrow", 325 + 15 / 65536],
  ["minecraft:slowness_arrow", 325 + 18 / 65536],
  ["minecraft:water_breathing_arrow", 325 + 20 / 65536],
  ["minecraft:healing_arrow", 325 + 22 / 65536],
  ["minecraft:harming_arrow", 325 + 24 / 65536],
  ["minecraft:poison_arrow", 325 + 26 / 65536],
  ["minecraft:regeneration_arrow", 325 + 29 / 65536],
  ["minecraft:strength_arrow", 325 + 32 / 65536],
  ["minecraft:weakness_arrow", 325 + 35 / 65536],
  ["minecraft:decay_arrow", 325 + 37 / 65536],
  ["minecraft:turtle_master_arrow", 325 + 38 / 65536],
  ["minecraft:slow_falling_arrow", 325 + 41 / 65536],
  ["minecraft:white_bed", 444],
  ["minecraft:red_bed", 444 + 1 / 65536],
  ["minecraft:green_bed", 444 + 2 / 65536],
  ["minecraft:brown_bed", 444 + 3 / 65536],
  ["minecraft:blue_bed", 444 + 4 / 65536],
  ["minecraft:purple_bed", 444 + 5 / 65536],
  ["minecraft:cyan_bed", 444 + 6 / 65536],
  ["minecraft:light_gray_bed", 444 + 7 / 65536],
  ["minecraft:gray_bed", 444 + 8 / 65536],
  ["minecraft:pink_bed", 444 + 9 / 65536],
  ["minecraft:lime_bed", 444 + 10 / 65536],
  ["minecraft:yellow_bed", 444 + 11 / 65536],
  ["minecraft:light_blue_bed", 444 + 12 / 65536],
  ["minecraft:magenta_bed", 444 + 13 / 65536],
  ["minecraft:orange_bed", 444 + 14 / 65536],
  ["minecraft:black_bed", 444 + 15 / 65536],
  ["minecraft:locator_map", 446 + 2 / 65536],
  ["minecraft:ocean_explorer_map", 446 + 3 / 65536],
  ["minecraft:woodland_explorer_map", 446 + 4 / 65536],
  ["minecraft:treasure_map", 446 + 5 / 65536],
  ["minecraft:locked_map", 446 + 6 / 65536],
  ["minecraft:snowy_village_map", 446 + 7 / 65536],
  ["minecraft:taiga_village_map", 446 + 8 / 65536],
  ["minecraft:plains_village_map", 446 + 9 / 65536],
  ["minecraft:savanna_village_map", 446 + 10 / 65536],
  ["minecraft:desert_village_map", 446 + 11 / 65536],
  ["minecraft:jungle_village_map", 446 + 12 / 65536],
  ["minecraft:swamp_village_map", 446 + 13 / 65536],
  ["minecraft:mundane_potion", 453 + 1 / 65536],
  ["minecraft:thick_potion", 453 + 3 / 65536],
  ["minecraft:awkward_potion", 453 + 4 / 65536],
  ["minecraft:night_vision_potion", 453 + 5 / 65536],
  ["minecraft:leaping_potion", 453 + 8 / 65536],
  ["minecraft:fire_resistance_potion", 453 + 12 / 65536],
  ["minecraft:swiftness_potion", 453 + 14 / 65536],
  ["minecraft:slowness_potion", 453 + 17 / 65536],
  ["minecraft:water_breathing_potion", 453 + 19 / 65536],
  ["minecraft:healing_potion", 453 + 21 / 65536],
  ["minecraft:harming_potion", 453 + 23 / 65536],
  ["minecraft:poison_potion", 453 + 25 / 65536],
  ["minecraft:regeneration_potion", 453 + 28 / 65536],
  ["minecraft:strength_potion", 453 + 31 / 65536],
  ["minecraft:weakness_potion", 453 + 34 / 65536],
  ["minecraft:decay_potion", 453 + 36 / 65536],
  ["minecraft:turtle_master_potion", 453 + 37 / 65536],
  ["minecraft:slow_falling_potion", 453 + 40 / 65536],
  ["minecraft:wind_charged_potion", 453 + 43 / 65536],
  ["minecraft:weaving_potion", 453 + 44 / 65536],
  ["minecraft:oozing_potion", 453 + 45 / 65536],
  ["minecraft:infestation_potion", 453 + 46 / 65536],
  ["minecraft:mundane_splash_potion", 594 + 1 / 65536],
  ["minecraft:thick_splash_potion", 594 + 3 / 65536],
  ["minecraft:awkward_splash_potion", 594 + 4 / 65536],
  ["minecraft:night_vision_splash_potion", 594 + 5 / 65536],
  ["minecraft:leaping_splash_potion", 594 + 8 / 65536],
  ["minecraft:fire_resistance_splash_potion", 594 + 12 / 65536],
  ["minecraft:swiftness_splash_potion", 594 + 14 / 65536],
  ["minecraft:slowness_splash_potion", 594 + 17 / 65536],
  ["minecraft:water_breathing_splash_potion", 594 + 19 / 65536],
  ["minecraft:healing_splash_potion", 594 + 21 / 65536],
  ["minecraft:harming_splash_potion", 594 + 23 / 65536],
  ["minecraft:poison_splash_potion", 594 + 25 / 65536],
  ["minecraft:regeneration_splash_potion", 594 + 28 / 65536],
  ["minecraft:strength_splash_potion", 594 + 31 / 65536],
  ["minecraft:weakness_splash_potion", 594 + 34 / 65536],
  ["minecraft:decay_splash_potion", 594 + 36 / 65536],
  ["minecraft:turtle_master_splash_potion", 594 + 37 / 65536],
  ["minecraft:slow_falling_splash_potion", 594 + 40 / 65536],
  ["minecraft:wind_charged_splash_potion", 453 + 43 / 65536],
  ["minecraft:weaving_splash_potion", 453 + 44 / 65536],
  ["minecraft:oozing_splash_potion", 453 + 45 / 65536],
  ["minecraft:infestation_splash_potion", 453 + 46 / 65536],
  ["minecraft:mundane_lingering_potion", 595 + 1 / 65536],
  ["minecraft:thick_lingering_potion", 595 + 3 / 65536],
  ["minecraft:awkward_lingering_potion", 595 + 4 / 65536],
  ["minecraft:night_vision_lingering_potion", 595 + 5 / 65536],
  ["minecraft:leaping_lingering_potion", 595 + 8 / 65536],
  ["minecraft:fire_resistance_lingering_potion", 595 + 12 / 65536],
  ["minecraft:swiftness_lingering_potion", 595 + 14 / 65536],
  ["minecraft:slowness_lingering_potion", 595 + 17 / 65536],
  ["minecraft:water_breathing_lingering_potion", 595 + 19 / 65536],
  ["minecraft:healing_lingering_potion", 595 + 21 / 65536],
  ["minecraft:harming_lingering_potion", 595 + 23 / 65536],
  ["minecraft:poison_lingering_potion", 595 + 25 / 65536],
  ["minecraft:regeneration_lingering_potion", 595 + 28 / 65536],
  ["minecraft:strength_lingering_potion", 595 + 31 / 65536],
  ["minecraft:weakness_lingering_potion", 595 + 34 / 65536],
  ["minecraft:decay_lingering_potion", 595 + 36 / 65536],
  ["minecraft:turtle_master_lingering_potion", 595 + 37 / 65536],
  ["minecraft:slow_falling_lingering_potion", 595 + 40 / 65536],
  ["minecraft:wind_charged_lingering_potion", 453 + 43 / 65536],
  ["minecraft:weaving_lingering_potion", 453 + 44 / 65536],
  ["minecraft:oozing_lingering_potion", 453 + 45 / 65536],
  ["minecraft:infestation_lingering_potion", 453 + 46 / 65536],
  ["minecraft:black_banner", 600],
  ["minecraft:red_banner", 600 + 1 / 65536],
  ["minecraft:green_banner", 600 + 2 / 65536],
  ["minecraft:brown_banner", 600 + 3 / 65536],
  ["minecraft:blue_banner", 600 + 4 / 65536],
  ["minecraft:purple_banner", 600 + 5 / 65536],
  ["minecraft:cyan_banner", 600 + 6 / 65536],
  ["minecraft:light_gray_banner", 600 + 7 / 65536],
  ["minecraft:gray_banner", 600 + 8 / 65536],
  ["minecraft:pink_banner", 600 + 9 / 65536],
  ["minecraft:lime_banner", 600 + 10 / 65536],
  ["minecraft:yellow_banner", 600 + 11 / 65536],
  ["minecraft:light_blue_banner", 600 + 12 / 65536],
  ["minecraft:magenta_banner", 600 + 13 / 65536],
  ["minecraft:orange_banner", 600 + 14 / 65536],
  ["minecraft:white_banner", 600 + 15 / 65536],
  ["minecraft:compound_salt", 631],
  ["minecraft:compound_sodium_oxide", 631 + 1 / 65536],
  ["minecraft:compound_sodium_hydroxide", 631 + 2 / 65536],
  ["minecraft:compound_magnesium_nitrate", 631 + 3 / 65536],
  ["minecraft:compound_iron_sulfide", 631 + 4 / 65536],
  ["minecraft:compound_lithium_hydride", 631 + 5 / 65536],
  ["minecraft:compound_sodium_hydride", 631 + 6 / 65536],
  ["minecraft:compound_calcium_bromide", 631 + 7 / 65536],
  ["minecraft:compound_magnesium_oxide", 631 + 8 / 65536],
  ["minecraft:compound_sodium_acetate", 631 + 9 / 65536],
  ["minecraft:compound_luminol", 631 + 10 / 65536],
  ["minecraft:compound_charcoal", 631 + 11 / 65536],
  ["minecraft:compound_sugar", 631 + 12 / 65536],
  ["minecraft:compound_aluminum_oxide", 631 + 13 / 65536],
  ["minecraft:compound_boron_trioxide", 631 + 14 / 65536],
  ["minecraft:compound_soap", 631 + 15 / 65536],
  ["minecraft:compound_polyethylene", 631 + 16 / 65536],
  ["minecraft:compound_garbage", 631 + 17 / 65536],
  ["minecraft:compound_blue_jar", 631 + 24 / 65536],
  ["minecraft:compound_blue_beaker", 631 + 26 / 65536],
  ["minecraft:compound_glue", 631 + 27 / 65536],
  ["minecraft:compound_white_beaker", 631 + 28 / 65536],
  ["minecraft:compound_black_beaker", 631 + 29 / 65536],
  ["minecraft:compound_yellow_beaker", 631 + 31 / 65536],
  ["minecraft:compound_clear_beaker", 631 + 35 / 65536],
  ["minecraft:compound_blue_bottle", 631 + 38 / 65536],
  ["minecraft:white_balloon", 635],
  ["minecraft:red_balloon", 635 + 1 / 65536],
  ["minecraft:green_balloon", 635 + 2 / 65536],
  ["minecraft:brown_balloon", 635 + 3 / 65536],
  ["minecraft:blue_balloon", 635 + 4 / 65536],
  ["minecraft:purple_balloon", 635 + 5 / 65536],
  ["minecraft:cyan_balloon", 635 + 6 / 65536],
  ["minecraft:light_gray_balloon", 635 + 7 / 65536],
  ["minecraft:gray_balloon", 635 + 8 / 65536],
  ["minecraft:pink_balloon", 635 + 9 / 65536],
  ["minecraft:lime_balloon", 635 + 10 / 65536],
  ["minecraft:yellow_balloon", 635 + 11 / 65536],
  ["minecraft:light_blue_balloon", 635 + 12 / 65536],
  ["minecraft:magenta_balloon", 635 + 13 / 65536],
  ["minecraft:orange_balloon", 635 + 14 / 65536],
  ["minecraft:black_balloon", 635 + 15 / 65536],
  ["minecraft:eye_drops", 636],
  ["minecraft:tonic", 636 + 1 / 65536],
  ["minecraft:antidote", 636 + 2 / 65536],
  ["minecraft:elixir", 636 + 3 / 65536],
  ["minecraft:blue_sparkler", 637],
  ["minecraft:red_sparkler", 637 + 1 / 65536],
  ["minecraft:green_sparkler", 637 + 2 / 65536],
  ["minecraft:pink_sparker", 637 + 5 / 65536],
  ["minecraft:orange_sparkler", 637 + 14 / 65536],
  ["minecraft:lit_blue_sparkler", 637 + 32 / 65536],
  ["minecraft:lit_red_sparkler", 637 + 33 / 65536],
  ["minecraft:lit_green_sparkler", 637 + 34 / 65536],
  ["minecraft:lit_pink_sparker", 637 + 37 / 65536],
  ["minecraft:lit_orange_sparkler", 637 + 46 / 65536],
  ["minecraft:red_glowstick", 638 + 1 / 65536],
  ["minecraft:green_glowstick", 638 + 2 / 65536],
  ["minecraft:brown_glowstick", 638 + 3 / 65536],
  ["minecraft:blue_glowstick", 638 + 4 / 65536],
  ["minecraft:purple_glowstick", 638 + 5 / 65536],
  ["minecraft:cyan_glowstick", 638 + 6 / 65536],
  ["minecraft:red_glowstick", 638 + 7 / 65536],
  ["minecraft:gray_glowstick", 638 + 8 / 65536],
  ["minecraft:pink_glowstick", 638 + 9 / 65536],
  ["minecraft:lime_glowstick", 638 + 10 / 65536],
  ["minecraft:yellow_glowstick", 638 + 11 / 65536],
  ["minecraft:light_blue_glowstick", 638 + 12 / 65536],
  ["minecraft:magenta_glowstick", 638 + 13 / 65536],
  ["minecraft:orange_glowstick", 638 + 14 / 65536],
  ["minecraft:white_glowstick", 638 + 15 / 65536],
  ["minecraft:lit_red_glowstick", 638 + 33 / 65536],
  ["minecraft:lit_green_glowstick", 638 + 34 / 65536],
  ["minecraft:lit_brown_glowstick", 638 + 35 / 65536],
  ["minecraft:lit_blue_glowstick", 638 + 36 / 65536],
  ["minecraft:lit_purple_glowstick", 638 + 37 / 65536],
  ["minecraft:lit_cyan_glowstick", 638 + 38 / 65536],
  ["minecraft:lit_red_glowstick", 638 + 39 / 65536],
  ["minecraft:lit_gray_glowstick", 638 + 40 / 65536],
  ["minecraft:lit_pink_glowstick", 638 + 41 / 65536],
  ["minecraft:lit_lime_glowstick", 638 + 42 / 65536],
  ["minecraft:lit_yellow_glowstick", 638 + 43 / 65536],
  ["minecraft:lit_light_blue_glowstick", 638 + 44 / 65536],
  ["minecraft:lit_magenta_glowstick", 638 + 45 / 65536],
  ["minecraft:lit_orange_glowstick", 638 + 46 / 65536],
  ["minecraft:lit_white_glowstick", 638 + 47 / 65536]
]);

// packs/scripts/plugins/MarketSystem/utils/SimplifyItemTypeId.ts
function SimplifyItemTypeId(itemStack) {
  let itemName = itemStack.typeId.split(":")[1];
  itemName = itemName.replace(/_/g, " ");
  itemName = itemName.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return itemStack.nameTag ? itemStack.nameTag : itemName;
}

// packs/scripts/plugins/MarketSystem/class/Product.ts
import { world as world6 } from "@minecraft/server";

// packs/scripts/plugins/MarketSystem/class/QickItemDatabase.ts
import { world as world5, system as system4, StructureSaveMode, EntityComponentTypes } from "@minecraft/server";
function date() {
  const date2 = new Date(Date.now());
  const ms = date2.getMilliseconds().toString().padStart(3, "0");
  return `${date2.toLocaleString().replace(" AM", `.${ms} AM`).replace(" PM", `.${ms} PM`)}`;
}
function logAction(message, logType, showStackTrace = false) {
  let prefixedMessage = "QIDB > " + message;
  switch (logType) {
    case 1 /* warn */:
      prefixedMessage = "\xA76" + prefixedMessage;
      console.warn(prefixedMessage);
      break;
    case 2 /* error */:
      prefixedMessage = "\xA7c" + prefixedMessage;
      console.error(prefixedMessage);
      break;
    case 0 /* log */:
    default:
      prefixedMessage = "\xA7a" + prefixedMessage;
      console.log(prefixedMessage);
      break;
  }
  if (showStackTrace) console.trace();
}
var defaultLogs = {
  startUp: true,
  save: false,
  load: false,
  set: false,
  get: false,
  has: false,
  delete: false,
  clear: true,
  values: false,
  keys: false
};
var QuickItemDatabase = class _QuickItemDatabase {
  /**
   * The number of ticks per second in Minecraft is normally 20.
   */
  static TICKS_PER_SECOND = 20;
  /**
   * The entity used for storing items.
   */
  static STORAGE_ENTITY = "qidb:storage";
  /**
   * The number of inventory slots the storage entity has.
   */
  static STORAGE_ENTITY_CAPACITY = 256;
  /**
   * The namespace for QIDB only allows lower and uppercase English characters, numbers 0 to 9, and the underscore _.
   */
  static VALID_NAMESPACE = /^[A-Za-z0-9_]+$/;
  /**
   * QIDB is reserved internally for the database.
   */
  static RESERVED_NAMEPSACE = /qidb/i;
  /**
   * The prefix of the dynamic property used when initialising.
   * @remarks
   * This is reserved by the database and enforced by the regular expression above.
   */
  static DYNAMIC_PROPERTY_PREFIX = "qidb";
  /**
   * The Y level where the entities are spawned in.
   */
  static SPAWN_LOCATION_Y_COORDINATE = 318;
  /**
   * The delay between saving each entry in seconds.
   */
  static SAVE_DELAY_SECONDS = 6;
  /**
   * The name of the ticking area used for database operations.
   */
  static TICKING_AREA_NAME = "storagearea";
  /**
   * `ItemStack[]`s that are currently stored in memory instead of in a structure.
   */
  quickAccess;
  /**
   * Entries that are currently waiting to be saved
   */
  queuedEntries;
  /**
   * Where the storage entity will be spawned.
   */
  spawnLocation;
  /**
   * Contains the database settings.
   */
  settings;
  /**
   * Object that describes the actions that should be logged to console.
   */
  logs;
  /**
   * The dimension that the storage entities will be spawned in.
   */
  dimension;
  /**
   * Creates a new QuickItemDatabase instance.
   * 
   * @param namespace
   * The unique namespace for the database identifiers. This will be the prefix used before the colon `:` in the structure's name.
   * 
   * Supports lower and uppercase English characters, numbers 0 to 9, and the underscore `_`.
   * 
   * `qidb` is reserved internally for the database.
   * 
   * @param cacheSize
   * The max amount of entries to keep quickly accessible. A small size can cause lag on frequent iterated usage, a large number can cause high hardware RAM usage.
   * 
   * The default size is 50 elements.
   * 
   * @param saveRate
   * The background saves per tick (high performance impact).
   * 
   * The default `saveRate` of 1 is 20 entries per second.
   * 
   * @param logSettings The database actions that should be logged to console.
   * 
   * @throws Throws if an invalid namespace is provided.
   * 
   * @remarks
   * This should be initialised in the global namespace, not doing so can lead to errors.
   * 
   * This database uses dynamic properties with the `qidb` prefix internally which may pollute your environment.
   */
  constructor(namespace, cacheSize = 50, saveRate = 1, logSettings = defaultLogs) {
    this.settings = {
      namespace,
      cacheSize,
      saveRate
    };
    this.queuedEntries = [];
    this.quickAccess = /* @__PURE__ */ new Map();
    if (!_QuickItemDatabase.VALID_NAMESPACE.test(namespace)) {
      logAction(`${namespace} isn't a valid namespace. accepted char: A-Z a-z 0-9 _ \xA7r${date()}`, 2 /* error */);
      throw new Error(`Invalid namespace: ${namespace}`);
    } else if (_QuickItemDatabase.RESERVED_NAMEPSACE.test(namespace)) {
      logAction(`${namespace} is using the reserved "QIDB" namespace. ${date()}`, 2 /* error */);
      throw new Error(`Reserved namespace: ${namespace}`);
    }
    this.logs = logSettings;
    system4.run(() => {
      this.dimension = world5.getDimension("minecraft:overworld");
      this._start();
    });
  }
  /**
   * Adds an entry to the database..
   * @param identifier The itemstack identifier.
   * @param value The `ItemStack[]` or `ItemStack` value to set.
   * @throws Throws if `value` is an `ItemStack` array that has more than 1024 items.
   * @remarks
   * This function **can** be called in read-only mode, but the item is saved later in the tick. 
   * 
   * The maximum array size is 1024 elements.
   */
  set(identifier, value) {
    const time = Date.now();
    const fullKey = this.settings.namespace + ":" + identifier;
    let itemStackArray = value;
    if (!Array.isArray(itemStackArray)) {
      itemStackArray = [itemStackArray];
    }
    if (itemStackArray.length > 1024) {
      logAction(`Out of range: <${fullKey}> has more than 1024 ItemStacks \xA7r${date()}`, 2 /* error */);
      throw new Error(`\xA7cQIDB > Out of range: <${fullKey}> has more than 1024 ItemStacks \xA7r${date()}`);
    }
    const entitiesRequired = Math.max(Math.floor((itemStackArray.length - 1) / _QuickItemDatabase.STORAGE_ENTITY_CAPACITY) + 1, 1);
    world5.setDynamicProperty(fullKey, entitiesRequired);
    this.quickAccess.delete(fullKey);
    this.quickAccess.set(fullKey, itemStackArray);
    const duplicateIndex = this.queuedEntries.findIndex((entry) => entry.key === fullKey);
    if (duplicateIndex !== -1) {
      this.queuedEntries.splice(duplicateIndex, 1);
    }
    this.queueSave(fullKey, itemStackArray);
    if (this.logs.set) {
      logAction(`Set key <${fullKey}> succesfully. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
    }
  }
  /**
   * Gets an itemstack stored in the database's cache.
   * @param identifier The itemstack identifier.
   * @returns The `ItemStack[]` saved in cache, or `undefined` if it is not present.
   * @throws Throws if the given identifier is not defined.
   * @remarks
   * This function can be called in read-only mode as it only checks the cache.
   * 
   * `ItemStack` singletons saved using `set` will still return an array.
   */
  quickGet(identifier) {
    if (identifier === void 0) {
      throw new Error(`\xA7cQIDB > The identifier is not defined.`);
    }
    const time = Date.now();
    const fullKey = this.settings.namespace + ":" + identifier;
    const itemStack = this.quickAccess.get(fullKey);
    if (this.logs.get) {
      if (itemStack) {
        logAction(`Got items from cache <${fullKey}> succesfully. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
      } else {
        logAction(`Entry <${fullKey}> does not exist in cache. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
      }
    }
    return itemStack;
  }
  /**
   * Gets the itemstack from an identifier.
   * @param identifier The itemstack identifier.
   * @returns The `ItemStack[]` saved as `identifier`, or `undefined` if it is not present.
   * @throws Throws if the given identifier is not defined.
   * @remarks
   * This function can't be called in read-only mode.
   * 
   * Single `ItemStack`s saved using `set` will still return an array.
   */
  get(identifier) {
    if (identifier === void 0) {
      throw new Error(`\xA7cQIDB > The identifier is not defined.`);
    }
    const time = Date.now();
    const fullKey = this.settings.namespace + ":" + identifier;
    if (this.quickAccess.has(fullKey)) {
      if (this.logs.get) {
        logAction(`Got items from cache <${fullKey}> succesfully. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
      }
      return this.quickAccess.get(fullKey);
    }
    const structure = world5.structureManager.get(fullKey);
    if (!structure) {
      logAction(`The key < ${fullKey} > doesn't exist.`, 2 /* error */);
      return void 0;
    }
    const { existingStructure, containers } = this.getInventories(fullKey);
    const items = [];
    containers.forEach((inv, index) => {
      for (let i = 256 * index; i < 256 * index + 256; i++) items.push(inv.getItem(i - 256 * index));
      for (let i = 256 * index + 255; i >= 0; i--) if (!items[i]) items.pop();
      else break;
    });
    this.saveStructure(fullKey, existingStructure);
    if (this.logs.get) {
      logAction(`Got items from <${fullKey}> succesfully. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
    }
    this.quickAccess.set(fullKey, items);
    return items;
  }
  /**
   * Checks if an entry exists in the item database's cache.
   * @param identifier The itemstack identifier.
   * @returns `true` if the entry exists, `false` if the entry doesn't exist.
   * @remarks This function can be called in read-only mode as it only checks the cache.
   */
  quickHas(identifier) {
    const fullKey = this.settings.namespace + ":" + identifier;
    return this.quickAccess.has(fullKey);
  }
  /**
   * Checks if a key exists in the item database.
   * @param identifier The itemstack identifier.
   * @returns `true` if the key exists, `false` if the key doesn't exist.
   * @remarks This function can't be called in read-only mode.
   */
  has(identifier) {
    const time = Date.now();
    const fullKey = this.settings.namespace + ":" + identifier;
    let keyExists = false;
    if (this.quickAccess.has(fullKey)) {
      keyExists = true;
    } else if (world5.structureManager.get(fullKey)) {
      keyExists = true;
    }
    if (this.logs.has) {
      if (keyExists) {
        logAction(`Found entry <${fullKey}> succesfully. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
      } else {
        logAction(`Entry <${fullKey}> doesn't exist in database. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
      }
    }
    return keyExists;
  }
  /**
   * Deletes an entry from the item database.
   * @param identifier The itemstack identifier.
   * @returns `true` if the entry existed, `false` if it didn't.
   * @remarks This function can't be called in read-only mode.
   */
  delete(identifier) {
    const time = Date.now();
    const fullKey = this.settings.namespace + ":" + identifier;
    const inCache = this.quickAccess.delete(fullKey);
    const inStructure = world5.structureManager.delete(fullKey);
    let entryExisted = false;
    if (inCache || inStructure) {
      world5.setDynamicProperty(fullKey, void 0);
      entryExisted = true;
    }
    if (this.logs.delete) {
      const timeDifference = Date.now() - time;
      if (entryExisted) {
        logAction(`Deleted entry <${fullKey}> succesfully. ${timeDifference}ms \xA7r${date()}`, 0 /* log */);
      } else {
        logAction(`The entry <${fullKey}> doesn't exist. ${timeDifference}ms \xA7r${date()}`, 0 /* log */);
      }
    }
    return entryExisted;
  }
  /**
   * Gets all the keys of your namespace from item database.
   * @returns All the keys as an array of strings.
   */
  keys() {
    const allIds = world5.getDynamicPropertyIds();
    const ids = [];
    allIds.filter((id) => id.startsWith(this.settings.namespace + ":")).forEach((id) => ids.push(id.replace(this.settings.namespace + ":", "")));
    if (this.logs.keys) {
      logAction(`Got the list of all the ${ids.length} keys. \xA7r${date()}`, 0 /* log */);
    }
    return ids;
  }
  /**
   * Gets all `ItemStack[]` arrays stored currently stored in the database.
   * @returns All values as an `ItemStack[]` array.
   * @remarks This function can't be called in read-only mode.
   */
  values() {
    const time = Date.now();
    const allIds = world5.getDynamicPropertyIds();
    const values = [];
    const filtered = allIds.filter((id) => id.startsWith(this.settings.namespace + ":")).map((id) => id.replace(this.settings.namespace + ":", ""));
    for (const key of filtered) {
      const value = this.get(key);
      if (value) {
        values.push(value);
      }
    }
    if (this.logs.values) {
      logAction(`Got the list of all the ${values.length} values. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
    }
    return values;
  }
  /**
   * Clears all, CAN NOT REWIND.
   * @remarks
   * This function can't be called in read-only mode.
   * 
   * This clears all structures that are using the namespace that also have a key in the database.
   * This can possibly include your own ones.
   */
  clear() {
    const time = Date.now();
    const allIds = world5.getDynamicPropertyIds();
    const filtered = allIds.filter((id) => id.startsWith(this.settings.namespace + ":")).map((id) => id.replace(this.settings.namespace + ":", ""));
    for (const key of filtered) {
      this.delete(key);
    }
    if (this.logs.clear) {
      logAction(`Cleared, deleted ${filtered.length} values. ${Date.now() - time}ms \xA7r${date()}`, 0 /* log */);
    }
  }
  /**
   * Initialisation logic for the database.
   */
  _start() {
    const startLog = () => {
      logAction(`Initialized successfully.\xA7r namespace: ${this.settings.namespace} \xA7r${date()}`, 0 /* log */);
      if (this.settings.saveRate > 1) {
        logAction(`Using a saveRate bigger than 1 can cause slower game ticks and extreme lag while saving 1024 size entries. at <${this.settings.namespace}> \xA7r${date()}`, 1 /* warn */);
      }
    };
    const initialiseLocation = (player) => {
      const initialisedKey = _QuickItemDatabase.DYNAMIC_PROPERTY_PREFIX + ":initialised";
      const xLocationKey = _QuickItemDatabase.DYNAMIC_PROPERTY_PREFIX + ":x";
      const zLocationKey = _QuickItemDatabase.DYNAMIC_PROPERTY_PREFIX + ":z";
      let xLocation = world5.getDynamicProperty(xLocationKey);
      let zLocation = world5.getDynamicProperty(zLocationKey);
      const wasInitialised = world5.getDynamicProperty(initialisedKey);
      if (xLocation === void 0) {
        xLocation = player.location.x;
        world5.setDynamicProperty(xLocationKey, xLocation);
      }
      if (zLocation === void 0) {
        zLocation = player.location.z;
        world5.setDynamicProperty(zLocationKey, zLocation);
      }
      this.spawnLocation = { x: xLocation, y: _QuickItemDatabase.SPAWN_LOCATION_Y_COORDINATE, z: zLocation };
      if (!wasInitialised) {
        world5.setDynamicProperty(initialisedKey, true);
        const oneAboveSpawm = this.spawnLocation.y + 1;
        const tickingAreaCommand = [
          "tickingarea add",
          this.spawnLocation.x,
          oneAboveSpawm,
          this.spawnLocation.z,
          this.spawnLocation.x,
          this.spawnLocation.y,
          this.spawnLocation.z,
          _QuickItemDatabase.TICKING_AREA_NAME
        ].join(" ");
        this.dimension.runCommand(tickingAreaCommand);
      }
      startLog();
    };
    const existingPlayer = world5.getPlayers()[0];
    if (existingPlayer) {
      initialiseLocation(existingPlayer);
    } else {
      const spawnListener = world5.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
        if (!initialSpawn) return;
        initialiseLocation(player);
        world5.afterEvents.playerSpawn.unsubscribe(spawnListener);
      });
    }
    this._run();
    this._registerShutdown();
  }
  /**
   * Functionality for actually saving the database entries.
   */
  _run() {
    const log = () => {
      const entriesSavedSinceLast = lastAmountSaved - this.queuedEntries.length;
      const saveRate = (entriesSavedSinceLast / _QuickItemDatabase.SAVE_DELAY_SECONDS).toFixed(0) || "//";
      lastAmountSaved = this.queuedEntries.length;
      logAction(`Saving, Dont close the world.
\xA7r[Stats]-\xA7eRemaining: ${this.queuedEntries.length} entries | speed: ${saveRate} entries/s \xA7r${date()}`, 0 /* log */);
    };
    let wasSavingLastTick = false;
    let runId;
    let lastAmountSaved = 0;
    system4.runInterval(() => {
      const cacheSettingDiff = this.quickAccess.size - this.settings.cacheSize;
      if (cacheSettingDiff > 0) {
        for (let i = 0; i < cacheSettingDiff; i++) {
          const nextEntry = this.quickAccess.keys().next()?.value;
          if (nextEntry) {
            this.quickAccess.delete(nextEntry);
          }
        }
      }
      if (this.queuedEntries.length) {
        if (runId === void 0) {
          if (this.logs.save) {
            log();
          }
          runId = system4.runInterval(() => {
            if (this.logs.save) {
              log();
            }
          }, _QuickItemDatabase.SAVE_DELAY_SECONDS * _QuickItemDatabase.TICKS_PER_SECOND);
        }
        wasSavingLastTick = true;
        const k = Math.min(this.settings.saveRate, this.queuedEntries.length);
        for (let i = 0; i < k; i++) {
          const entryToSave = this.queuedEntries.shift();
          if (entryToSave) {
            this.save(entryToSave.key, entryToSave.value);
          }
        }
      } else if (runId) {
        system4.clearRun(runId);
        runId = void 0;
        if (wasSavingLastTick && this.logs.save) {
          logAction(`Saved, You can now close the world safely. \xA7r${date()}`, 0 /* log */);
        }
        wasSavingLastTick = false;
      }
    }, 1);
  }
  /**
   * Subscribes to the shutdown event to give a notification.
   */
  _registerShutdown() {
    system4.beforeEvents.shutdown.subscribe(() => {
      if (this.queuedEntries.length) {
        logAction(
          `Fatal Error >\xA7r\xA7c World closed too early, items not saved correctly.  

Namespace: ${this.settings.namespace}
Number of lost entries: ${this.queuedEntries.length} \xA7r${date()}



`,
          2 /* error */
        );
      }
    });
  }
  /**
   * Gets the inventories of the storage entities.
   * @param fullKey The whole structure id, including the prefix.
   * @param requiredEntities
   * The number of entities required to contain all inventories. Each entity can store a maximum of 256 slots.
   * 
   * Not required when loading inventories.
   * 
   * @returns The {@link Container}s of the storage entities, and whether or not there was an existing structure.
   * @remarks
   * This spawns in empty entities if the value for the key doesn't exist.
   * 
   * This function can't be called in read-only mode.
   */
  getInventories(fullKey, requiredEntities) {
    if (fullKey.length > 30) {
      logAction(`Out of range: <${fullKey}> has more than 30 characters \xA7r${date()}`, 2 /* error */);
      throw new Error(`\xA7cQIDB > Out of range: <${fullKey}> has more than 30 characters \xA7r${date()}`);
    }
    let existingStructure = false;
    const structure = world5.structureManager.get(fullKey);
    if (structure) {
      world5.structureManager.place(structure, this.dimension, this.spawnLocation, { includeEntities: true });
      existingStructure = true;
    } else {
      logAction(requiredEntities, 0 /* log */);
      if (requiredEntities) {
        for (let i = 0; i < requiredEntities; i++) {
          this.dimension.spawnEntity(_QuickItemDatabase.STORAGE_ENTITY, this.spawnLocation);
        }
      }
    }
    const entities = this.dimension.getEntities({ location: this.spawnLocation, type: _QuickItemDatabase.STORAGE_ENTITY });
    if (requiredEntities) {
      if (entities.length < requiredEntities) {
        for (let i = entities.length; i < requiredEntities; i++) {
          entities.push(this.dimension.spawnEntity(_QuickItemDatabase.STORAGE_ENTITY, this.spawnLocation));
        }
      }
      if (entities.length > requiredEntities) {
        logAction(`entities.length > length: ${entities.length} > ${requiredEntities} ${entities.length > requiredEntities}`, 0 /* log */);
        for (let i = entities.length; i > requiredEntities; i--) {
          logAction(`removed ${i}`, 0 /* log */);
          entities[i - 1].remove();
          entities.pop();
        }
      }
    }
    const containers = [];
    entities.forEach((entity) => {
      containers.push(entity.getComponent(EntityComponentTypes.Inventory).container);
    });
    if (this.logs.load) {
      logAction(`Loaded ${entities.length} entities <${fullKey}> \xA7r${date()}`, 0 /* log */);
    }
    return { existingStructure, containers };
  }
  /**
   * Saves a structure to the world
   * @param key The identifier of the structure.
   * @param existingStructure Whether or not the structure already exists. This must be determined from elsewhere.
   */
  saveStructure(key, existingStructure) {
    if (existingStructure) world5.structureManager.delete(key);
    world5.structureManager.createFromWorld(key, this.dimension, this.spawnLocation, this.spawnLocation, { saveMode: StructureSaveMode.World, includeEntities: true });
    const entities = this.dimension.getEntities({ location: this.spawnLocation, type: _QuickItemDatabase.STORAGE_ENTITY });
    entities.forEach((e) => e.remove());
  }
  /**
   * Queues a key-itemstack pair for saving.
   * @param key The identifier for the pair, this will be the name of the structure.
   * @param value The itemstacks to save.
   */
  queueSave(key, value) {
    const entry = {
      key,
      value
    };
    this.queuedEntries.push(entry);
  }
  /**
   * Saves itemstacks into a structure.
   * @param key The structure identifier.
   * @param value The itemstacks to save.
   * @remarks Clears the inventory of the storage entity if `value` is undefined.
   */
  async save(key, value) {
    let requiredEntities = 1;
    const isArray = Array.isArray(value);
    if (isArray) {
      requiredEntities = Math.floor((value?.length - 1) / _QuickItemDatabase.STORAGE_ENTITY_CAPACITY) + 1 || 1;
    }
    const { existingStructure, containers } = this.getInventories(key, requiredEntities);
    containers.forEach((inv, index) => {
      if (!value) for (let i = 256 * index; i < 256 * index + 256; i++) inv.setItem(i - 256 * index, void 0), world5.setDynamicProperty(key, void 0);
      if (isArray) {
        try {
          for (let i = 256 * index; i < 256 * index + 256; i++) inv.setItem(i - 256 * index, value[i] || void 0);
        } catch {
          throw new Error(`\xA7cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined \xA7r${date()}`);
        }
        world5.setDynamicProperty(key, requiredEntities);
      } else {
        try {
          inv.setItem(0, value), world5.setDynamicProperty(key, false);
        } catch {
          throw new Error(`\xA7cQIDB > Invalid value type. supported: ItemStack | ItemStack[] | undefined \xA7r${date()}`);
        }
      }
    });
    await this.saveStructure(key, existingStructure);
  }
};

// packs/scripts/plugins/MarketSystem/utils/RandomCode.ts
function RandomCode(length, without = []) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code;
  do {
    code = Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
  } while (without.includes(code));
  return code;
}

// packs/scripts/plugins/MarketSystem/class/Product.ts
var Product = class {
  itemStack;
  owners;
  prices;
  db;
  itemDB;
  constructor(itemStack, owners, prices, page, itemDB) {
    this.itemStack = itemStack;
    this.owners = owners;
    this.prices = prices;
    this.db = new DatabaseMap(`market:${page}`);
    this.itemDB = itemDB;
  }
  addProduct() {
    const key = `${RandomCode(5, [...this.db.keys()])}`;
    console.warn(key, "add product", this.itemStack.amount);
    const dataSave = {
      itemStack: key,
      owner: this.owners,
      prices: this.prices,
      releaseDate: Date.now(),
      history: [],
      isHide: false
    };
    this.db.set(key, dataSave);
    const clonedItemStack = this.itemStack.clone();
    this.itemDB.set(key, [clonedItemStack]);
    return dataSave;
  }
  static removeProduct(key, itemDB, db) {
    itemDB.delete(db.get(key).itemStack);
    db.delete(key);
  }
  static setProduct(key, page, data) {
    const db = new DatabaseMap(`market:${page}`);
    db.set(key, data);
  }
  static getProduct(getBy, options) {
    if (getBy == 2 /* all */) {
      const data = /* @__PURE__ */ new Set();
      const lastId = [];
      world6.getDynamicPropertyIds().filter((x) => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach((id) => {
        const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
        if (lastId.some((part) => part == idParts)) return;
        lastId.push(idParts);
        [...new DatabaseMap(idParts).values()].forEach((d) => {
          if (options?.hide ?? false) {
            if (!d.isHide) {
              data.add(d);
            }
          } else {
            data.add(d);
          }
        });
      });
      return [...data];
    } else if (getBy == 0 /* owners */) {
      const data = /* @__PURE__ */ new Set();
      const lastId = [];
      world6.getDynamicPropertyIds().filter((x) => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach((id) => {
        const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
        if (lastId.some((part) => part == idParts)) return;
        lastId.push(idParts);
        [...new DatabaseMap(idParts).values()].forEach((d) => {
          data.add(d);
        });
      });
      console.warn([...data].map((x) => x.itemStack).join(", "));
      return [...data].filter((x) => x.owner == options?.owners);
    } else {
      const data = /* @__PURE__ */ new Set();
      const dataReturn = [];
      const lastId = [];
      world6.getDynamicPropertyIds().filter((x) => x.match(/^\$DatabaseMap␞([a-zA-Z0-9_]+):([0-9a-zA-Z_]+)␞([a-zA-Z0-9_]+)$/)).forEach((id) => {
        const idParts = id.replace(/^\$DatabaseMap␞([a-zA-Z0-9_]+:\d+)␞[a-zA-Z0-9_]+$/, "$1");
        if (lastId.some((part) => part == idParts)) return;
        lastId.push(idParts);
        [...new DatabaseMap(idParts).values()].forEach((d) => {
          data.add(d);
        });
      });
      for (let i = 0; i < data.size; i++) {
        if (new QuickItemDatabase(`it_market`, 5, 1).get([...data][i].itemStack)[0].typeId == options?.typeId) {
          dataReturn.push([...data][i]);
        }
      }
      return dataReturn;
    }
  }
};

// packs/scripts/plugins/MarketSystem/utils/CalculatePageSize.ts
function CalculatePageSize(number) {
  const maxPage = 27;
  if (number == 0) return 1;
  return Math.floor((number - 1) / maxPage) + 1;
}

// packs/scripts/plugins/MarketSystem/utils/CalculateExpiredTime.ts
function CalculateExpiredTime(releaseTime) {
  const releaseDate = new Date(releaseTime);
  const expiryDate = new Date(releaseDate);
  expiryDate.setHours(expiryDate.getHours() + 3);
  const now = /* @__PURE__ */ new Date();
  const remainingTimeMs = expiryDate.getTime() - now.getTime();
  if (remainingTimeMs <= 0) {
    return null;
  }
  const hours = Math.floor(remainingTimeMs / (1e3 * 60 * 60));
  const minutes = Math.floor(remainingTimeMs % (1e3 * 60 * 60) / (1e3 * 60));
  const seconds = Math.floor(remainingTimeMs % (1e3 * 60) / 1e3);
  return { hours, minutes, seconds };
}

// packs/scripts/plugins/MarketSystem/utils/Constants.ts
var inventory_enabled = true;
var custom_content = {
  "custom:block": {
    texture: "minecraft:gold_block",
    type: "block"
  },
  "custom:item": {
    texture: "textures/items/paper",
    type: "item"
  }
};
var number_of_custom_items = Object.values(custom_content).filter((v) => v.type === "item").length;
var custom_content_keys = new Set(Object.keys(custom_content));
var CHEST_UI_SIZES = /* @__PURE__ */ new Map([
  ["single", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA72\xA77\xA7r", 27]],
  ["small", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA72\xA77\xA7r", 27]],
  ["double", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA75\xA74\xA7r", 54]],
  ["large", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA75\xA74\xA7r", 54]],
  ["1", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA71\xA7r", 1]],
  ["5", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA75\xA7r", 5]],
  ["9", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA79\xA7r", 9]],
  ["18", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA71\xA78\xA7r", 18]],
  ["27", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA72\xA77\xA7r", 27]],
  ["36", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA73\xA76\xA7r", 36]],
  ["45", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA74\xA75\xA7r", 45]],
  ["54", ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA75\xA74\xA7r", 54]],
  [1, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA71\xA7r", 1]],
  [5, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA75\xA7r", 5]],
  [9, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA70\xA79\xA7r", 9]],
  [18, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA71\xA78\xA7r", 18]],
  [27, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA72\xA77\xA7r", 27]],
  [36, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA73\xA76\xA7r", 36]],
  [45, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA74\xA75\xA7r", 45]],
  [54, ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA75\xA74\xA7r", 54]]
]);

// packs/scripts/plugins/MarketSystem/class/ChestForms.ts
import { ActionFormData as ActionFormData2 } from "@minecraft/server-ui";
var ChestFormData = class {
  titleText;
  slotCount;
  buttonArray;
  constructor(size = "small") {
    const sizing = CHEST_UI_SIZES.get(size) ?? ["\xA7c\xA7h\xA7e\xA7s\xA7t\xA72\xA77\xA7r", 27];
    this.titleText = { rawtext: [{ text: `${sizing[0]}` }] };
    this.buttonArray = Array(sizing[1]).fill(["", void 0]);
    this.slotCount = sizing[1];
  }
  title(text) {
    if (typeof text === "string") {
      this.titleText.rawtext?.push({ text });
    } else if (typeof text === "object") {
      if (text.rawtext) {
        this.titleText.rawtext?.push(...text.rawtext);
      } else {
        this.titleText.rawtext?.push(text);
      }
    }
    return this;
  }
  button(slot, itemName, itemDesc, texture, stackSize = 1, durability = 0, enchanted = false) {
    const targetTexture = custom_content_keys.has(texture) ? custom_content[texture]?.texture : texture;
    const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
    const buttonRawtext = {
      rawtext: [
        {
          text: `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, "0")}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, "0")}\xA7r`
        }
      ]
    };
    if (typeof itemName === "string") {
      buttonRawtext.rawtext?.push({ text: itemName ? `${itemName}\xA7r` : "\xA7r" });
    } else if (typeof itemName === "object" && itemName.rawtext) {
      buttonRawtext.rawtext?.push(...itemName.rawtext, { text: "\xA7r" });
    } else return;
    if (Array.isArray(itemDesc) && itemDesc.length > 0) {
      for (const obj of itemDesc) {
        if (typeof obj === "string") {
          buttonRawtext.rawtext?.push({ text: `
${obj}` });
        } else if (typeof obj === "object" && obj.rawtext) {
          buttonRawtext.rawtext?.push({ text: `
` }, ...obj.rawtext);
        }
      }
    }
    this.buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
      buttonRawtext,
      ID === void 0 ? targetTexture : (ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536 + (enchanted ? 32768 : 0)
    ]);
    return this;
  }
  pattern(pattern, key) {
    for (let i = 0; i < pattern.length; i++) {
      const row = pattern[i];
      for (let j = 0; j < row.length; j++) {
        const letter = row.charAt(j);
        const data = key[letter];
        if (!data) continue;
        const slot = j + i * 9;
        const targetTexture = custom_content_keys.has(data.texture) ? custom_content[data.texture]?.texture : data.texture;
        const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
        const { stackAmount = 1, durability = 0, itemName, itemDesc, enchanted = false } = data;
        const stackSize = String(Math.min(Math.max(stackAmount, 1), 99)).padStart(2, "0");
        const durValue = String(Math.min(Math.max(durability, 0), 99)).padStart(2, "0");
        const buttonRawtext = {
          rawtext: [{ text: `stack#${stackSize}dur#${durValue}\xA7r` }]
        };
        if (typeof itemName === "string") {
          buttonRawtext.rawtext?.push({ text: `${itemName}\xA7r` });
        } else if (itemName?.rawtext) {
          buttonRawtext.rawtext?.push(...itemName.rawtext, { text: "\xA7r" });
        } else continue;
        if (Array.isArray(itemDesc) && itemDesc.length > 0) {
          for (const obj of itemDesc) {
            if (typeof obj === "string") {
              buttonRawtext.rawtext?.push({ text: `
${obj}` });
            } else if (obj?.rawtext) {
              buttonRawtext.rawtext?.push({ text: `
`, ...obj.rawtext });
            }
          }
        }
        this.buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
          buttonRawtext,
          ID === void 0 ? targetTexture : (ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536 + (enchanted ? 32768 : 0)
        ]);
      }
    }
    return this;
  }
  show(player) {
    const form = new ActionFormData2().title(this.titleText);
    this.buttonArray.forEach((button) => {
      form.button(button[0], button[1]?.toString());
    });
    if (!inventory_enabled) return form.show(player);
    const container = player.getComponent("inventory").container;
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (!item) continue;
      const typeId = item.typeId;
      const targetTexture = custom_content_keys.has(typeId) ? custom_content[typeId]?.texture : typeId;
      const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
      const durability = item.getComponent("durability");
      const durDamage = durability ? Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99) : 0;
      const amount = item.amount;
      const formattedItemName = typeId.replace(/.*(?<=:)/, "").replace(/_/g, " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
      const buttonRawtext = {
        rawtext: [
          {
            text: `stack#${String(amount).padStart(2, "0")}dur#${String(durDamage).padStart(2, "0")}\xA7r${formattedItemName}`
          }
        ]
      };
      const loreText = item.getLore().join("\n");
      if (loreText) buttonRawtext.rawtext?.push({ text: loreText });
      const finalID = ID === void 0 ? targetTexture : (ID + (ID < 256 ? 0 : number_of_custom_items)) * 65536;
      form.button(buttonRawtext, finalID.toString());
    }
    return form.show(player);
  }
};

// packs/scripts/plugins/MarketSystem/utils/SimplifyEnchantText.ts
function SimpifyEnchantText(enchantments) {
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
  return enchantments.map((enchantment) => {
    const name = capitalize(enchantment.type.id);
    const level = enchantment.level;
    const romanNumerals = ["I", "II", "III", "IV", "V"];
    return `\xA77${name} ${romanNumerals[level - 1]}\xA7r`;
  }).join("\n");
}

// packs/scripts/plugins/MarketSystem/class/MarketUi.ts
var MarketUi = class _MarketUi {
  moneyScore;
  savedUi;
  config;
  constructor(config) {
    this.moneyScore = new DatabaseMap(config.moneyScore);
    this.savedUi = /* @__PURE__ */ new Map();
    this.config = config;
  }
  initializeScore(pl) {
    let obj = world7.scoreboard.getObjective(this.config.moneyScore);
    if (!obj) {
      world7.scoreboard.addObjective(this.config.moneyScore);
      obj = world7.scoreboard.getObjective(this.config.moneyScore);
    }
    if (obj && !obj.hasParticipant(pl)) {
      obj.setScore(pl.scoreboardIdentity ?? pl, 0);
    }
    return;
  }
  // Utility to show a simple message form
  showMessageForm(title, message, confirmButton, cancelButton, onConfirm, onCancel, pl, itemDB) {
    const msgUi = new MessageFormData().title(title).body(message).button1(confirmButton).button2(cancelButton);
    msgUi.show(pl).then((res) => {
      if (res.canceled) return;
      res.selection === 0 ? onConfirm(pl, itemDB) : onCancel(pl);
    });
  }
  // Main UI for the market
  showMainUi(pl, itemDB) {
    this.initializeScore(pl);
    if (this.savedUi.get(pl) ?? false) return;
    const mainUi = new ActionFormData3().title("\xA7d\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C").button(`\xA7e\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E43\u0E19\u0E15\u0E25\u0E32\u0E14`, "textures/ui/sidebar_icons/marketplace").button(`\xA7a\u0E1A\u0E31\u0E0D\u0E0A\u0E35`, "textures/ui/sidebar_icons/my_characters").button(`\xA7b\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\xA77\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13`, "textures/ui/sidebar_icons/promotag");
    mainUi.show(pl).then((res) => {
      switch (res.selection) {
        case 2:
          this.initiateItemSale(pl, itemDB);
          break;
        case 0:
          this.viewProductUi(pl, itemDB, 1);
          break;
        case 1:
          this.accountUI(pl, itemDB);
          break;
      }
    });
  }
  accountUI(pl, itemDB) {
    const accountUi = new ModalFormData();
    accountUi.title(`\xA7a\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`);
    accountUi.textField(
      `
 \xA77\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E16\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48
 \xA77\u0E40\u0E07\u0E34\u0E19\xA77\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\xA7c\u0E02\u0E32\u0E22\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7a$${this.moneyScore.get(pl.id) ?? 0}

\xA77\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19: `,
      `\xA77\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E16\u0E2D\u0E19 \xA77(1-${this.moneyScore.get(pl.id) ?? 0})`
    );
    accountUi.toggle(`\xA77\u0E01\u0E25\u0E31\u0E1A/\xA7b\u0E16\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19`);
    accountUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues[0]) < 1) {
        return this.accountUI(pl, itemDB);
      }
      if (res.formValues[1] == false) {
        this.showMainUi(pl, itemDB);
      } else if ((this.moneyScore.get(pl.id) ?? 0) < parseInt(res.formValues[0])) {
        this.showMessageForm(
          `\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
          `\xA77\u0E04\u0E38\u0E13\u0E21\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E21\u0E48\u0E1E\u0E2D\u0E17\u0E35\u0E48\u0E08\u0E30\u0E16\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19`,
          `\xA7a\u0E01\u0E25\u0E31\u0E1A`,
          `\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01`,
          (pl2, itemDB2) => {
            this.accountUI(pl2, itemDB2);
          },
          () => {
          },
          pl,
          itemDB
        );
      } else {
        this.moneyScore.set(
          pl.name,
          this.moneyScore.get(pl.name) - parseInt(res.formValues[0])
        );
        world7.scoreboard.getObjective(this.config.moneyScore)?.setScore(pl, parseInt(res.formValues[0]));
        pl.playSound("random.orb");
        this.accountUI(pl, itemDB);
      }
    });
  }
  buyProduct(pl, itemDB, product, data, page, res) {
    const selection = res;
    const item = itemDB.get([...data.keys()][selection])[0];
    const productUi = new ModalFormData();
    const ID = typeIdToDataId.get(item.typeId) ?? typeIdToID.get(item.typeId);
    const durability = item.hasComponent("durability") ? `\xA7c${item.getComponent("durability").maxDurability - item.getComponent("durability").damage}\xA77/\xA7c${item.getComponent("durability").maxDurability}\xA7r` : `\xA7c0\xA77/\xA7c0`;
    const enchanted = (item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0;
    productUi.title(
      `\xA7c\xA7h\xA7e\xA7y\xA7t${(ID + (ID < 262 ? 0 : 0)) * 65536 + (enchanted ? 32768 : 0)}`
    );
    productUi.textField(
      `


    \xA7e\u0E0A\u0E37\u0E48\u0E2D\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7f${SimplifyItemTypeId(
        item
      )}
    \xA7c\u0E08\u0E33\u0E19\u0E27\u0E19\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7f${item.amount}\xA7cx\xA7r
    \xA7d\u0E04\u0E27\u0E32\u0E21\u0E04\u0E07\u0E17\u0E19\xA77: \xA77${durability}
    \xA7b\u0E23\u0E32\u0E04\u0E32\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7a${[...data.entries()][res][1].prices}




`,
      "hide(-)"
    );
    productUi.toggle(`\xA7a\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\xA77\u0E01\u0E32\u0E23\u0E0B\u0E37\u0E49\u0E2D \xA77(\u0E01\u0E25\u0E31\u0E1A\xA77/\u0E0B\u0E37\u0E49\u0E2D\xA77)`);
    productUi.show(pl).then((res2) => {
      if (res2.canceled) return;
      if (res2.formValues[1] == false) {
        return this.viewProductUi(pl, itemDB, page);
      }
      const score = world7.scoreboard.getObjective(this.config.moneyScore)?.getScore(pl) ?? 0;
      if (score < [...data.entries()][selection][1].prices) {
        this.showMessageForm(
          `\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
          `\xA77\u0E04\u0E38\u0E13\u0E21\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E21\u0E48\u0E1E\u0E2D\u0E17\u0E35\u0E48\u0E08\u0E30\u0E0B\u0E37\u0E49\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E19\u0E35\u0E49`,
          `\xA7a\u0E01\u0E25\u0E31\u0E1A`,
          `\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01`,
          (pl2, itemDB2) => {
            this.buyProduct(pl2, itemDB2, product, data, page, selection);
          },
          () => {
          },
          pl,
          itemDB
        );
      } else {
        const dataIt = [...data.entries()][selection][1];
        this.showMessageForm(
          `\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
          `\xA77\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E0B\u0E37\u0E49\u0E2D\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E23\u0E32\u0E04\u0E32 \xA7c$${dataIt.prices} \xA77\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?
\u0E2B\u0E32\u0E01\u0E0B\u0E37\u0E49\u0E2D\u0E04\u0E38\u0E13\u0E08\u0E30\u0E21\u0E35\xA7a\u0E40\u0E07\u0E34\u0E19\xA77\u0E40\u0E2B\u0E25\u0E37\u0E2D \xA7c($${score - dataIt.prices})`,
          `\xA7a\u0E43\u0E0A\u0E48`,
          `\xA7c\u0E01\u0E25\u0E31\u0E1A`,
          (pl2, itemDB2) => {
            const item2 = itemDB2.get(dataIt.itemStack)[0];
            pl2.sendMessage(
              `\xA77\u0E0B\u0E37\u0E49\u0E2D\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7e${SimplifyItemTypeId(item2)} \xA77\u0E08\u0E33\u0E19\u0E27\u0E19 \xA7a${item2.amount}\xA77x \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08`
            );
            pl2.playSound("random.orb");
            pl2.getComponent("inventory").container.addItem(item2);
            world7.scoreboard.getObjective(this.config.moneyScore)?.setScore(pl2, score - dataIt.prices);
            Product.removeProduct(dataIt.itemStack, itemDB2, data);
            const now = this.moneyScore.get(pl2.name) ?? 0;
            this.moneyScore.set(dataIt.owner, now + dataIt.prices);
          },
          () => {
            this.buyProduct(pl, itemDB, product, data, page, selection);
          },
          pl,
          itemDB
        );
      }
    });
  }
  // View product UI
  viewProductUi(pl, itemDB, page) {
    const data = new DatabaseMap(`market:${page}`);
    for (let i = 0; i < [...data.keys()].length; i++) {
      if (CalculateExpiredTime(data.get([...data.keys()][i]).releaseDate) == null) {
        Product.removeProduct([...data.keys()][i], itemDB, data);
      }
    }
    const market = new ChestFormData("36");
    const productBtn = [];
    market.title(
      `\xA7e\uA844\uA88A\u0E19\uA734\u0E32\xA77\u0E43\u0E19\u0E15\u0E25\u0E32\u0E14 \xA77(${page}/${CalculatePageSize(
        Product.getProduct(2 /* all */, { hide: true }).length
      )}) \xA7e\u0E40\u0E07\u0E34\u0E19\xA77 \xA7a$${world7.scoreboard.getObjective(this.config.moneyScore)?.getScore(pl) ?? 0}`
    );
    for (let i = 0; i < [...data.keys()].length; i++) {
      productBtn.push(i);
      const item = itemDB.get(data.get([...data.keys()][i]).itemStack)[0];
      let des = "";
      des += item.getComponent("enchantable")?.getEnchantments() ? SimpifyEnchantText(
        item.getComponent("enchantable")?.getEnchantments() ?? []
      ) : "\xA77None Enchantments";
      des += "\n";
      if (item.hasComponent("durability")) {
        des += `\xA77Durability: ${item.getComponent("durability").maxDurability - item.getComponent("durability").damage}/${item.getComponent("durability").maxDurability}\xA7r`;
      } else des += "\xA77Durability: \xA770/0\xA7r";
      des += "\n\n";
      des += "-------------------------------------";
      des += "\n";
      des += "\xA7c\u0E23\u0E32\u0E04\u0E32\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7a$" + data.get([...data.keys()][i]).prices;
      des += "\n";
      des += "\xA7r\xA7e\u0E1C\u0E39\u0E49\u0E02\u0E32\u0E22\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7e" + data.get([...data.keys()][i]).owner;
      des += "\n";
      des += "\xA7a\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E40\u0E27\u0E25\u0E32\xA77\u0E2D\u0E35\u0E01: \xA7c" + CalculateExpiredTime(data.get([...data.keys()][i]).releaseDate).hours + "." + CalculateExpiredTime(data.get([...data.keys()][i]).releaseDate).minutes + "\xA77H";
      des += "\n";
      des += "-------------------------------------";
      if (!data.get([...data.keys()][i]).isHide) {
        market.button(
          i,
          SimplifyItemTypeId(item),
          [des],
          item.typeId,
          item.amount,
          item.hasComponent("durability") ? item.getComponent("durability").maxDurability - item.getComponent("durability").damage : 0,
          (item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0
        );
      }
    }
    market.button(27, "\xA7c\u0E01\u0E25\u0E31\u0E1A", [], "", 1, 0, false);
    market.button(31, "\xA77\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32", [], "textures/ui/magnifyingGlass", 1);
    market.button(35, "\xA7a\u0E16\u0E31\u0E14\u0E44\u0E1B", [], "", 1, 0, false);
    market.show(pl).then((res) => {
      if (res.canceled) return;
      if (productBtn.some((x) => x == res.selection)) {
        this.buyProduct(
          pl,
          itemDB,
          data.get([...data.keys()][res.selection]),
          data,
          page,
          res.selection
        );
      } else if (res.selection == 31) {
        pl.playSound("random.click");
        const ui = new ModalFormData();
        ui.title(`\xA76\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`);
        ui.textField(
          `
 \xA77\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E44\u0E1B

`,
          `\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E2B\u0E19\u0E49\u0E32 (1-${CalculatePageSize(
            Product.getProduct(2 /* all */, { hide: true }).length
          )})`
        );
        ui.show(pl).then((res2) => {
          if (res2.canceled) return;
          if (parseInt(res2.formValues[0]) > CalculatePageSize(
            Product.getProduct(2 /* all */, { hide: true }).length
          ) || parseInt(res2.formValues[0]) < 1) {
            return;
          }
          this.viewProductUi(
            pl,
            itemDB,
            parseInt(res2.formValues[0])
          );
        });
      } else if (res.selection == 27) {
        if (page - 1 <= 0) {
          pl.playSound("mob.villager.no");
          return this.viewProductUi(pl, itemDB, 1);
        } else {
          pl.playSound("random.click");
          return this.viewProductUi(pl, itemDB, page - 1);
        }
      } else if (res.selection == 35) {
        pl.playSound("random.click");
        if (page + 1 > CalculatePageSize(
          Product.getProduct(2 /* all */, { hide: true }).length
        )) {
          pl.playSound("mob.villager.no");
          return this.viewProductUi(pl, itemDB, page);
        } else {
          pl.playSound("random.click");
          return this.viewProductUi(pl, itemDB, page + 1);
        }
      }
    });
  }
  initiateItemSale(pl, itemDB) {
    for (let i = 0; i < 27; i++) {
      const itemStack = pl.getComponent("inventory").container.getItem(i);
      if (itemStack) {
        new Product(
          itemStack,
          pl.name,
          0,
          CalculatePageSize(
            Product.getProduct(2 /* all */, { hide: true }).length
          ),
          itemDB
        ).addProduct();
      }
    }
    const ui = new ActionFormData3();
    const products = Product.getProduct(0 /* owners */, {
      owners: pl.name
    });
    const productBtn = [];
    ui.title(`\xA76\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`);
    ui.body(`
 \xA77\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E14\u0E39\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E40\u0E40\u0E25\u0E30\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48`);
    ui.button(
      `\xA76${pl.name}
\xA7a\u0E08\u0E33\u0E19\u0E27\u0E19\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 \xA7c${products.length}\xA77/\xA7c5`,
      `textures/ui/default_cast/efe_icon`
    );
    ui.button(`\xA7c\u0E25\u0E07\u0E02\u0E32\u0E22\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32
\xA77\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E07\u0E02\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32`);
    products.forEach((btn, i) => {
      productBtn.push(i + 2);
      const itemStack = itemDB.get(btn.itemStack)[0];
      const ID = typeIdToDataId.get(itemStack.typeId) ?? typeIdToID.get(itemStack.typeId);
      const number_of_1_16_100_items = 0;
      const enchanted = (itemStack.getComponent("enchantable")?.getEnchantments() ?? []).length > 0;
      ui.button(
        `${SimplifyItemTypeId(itemStack)}
\xA77\u0E08\u0E33\u0E19\u0E27\u0E19: \xA7c${itemStack.amount}x \xA77| \xA77\u0E40\u0E2B\u0E25\u0E37\u0E2D\xA7a\u0E40\u0E27\u0E25\u0E32\xA77: \xA7c${CalculateExpiredTime(btn.releaseDate).hours}.${CalculateExpiredTime(btn.releaseDate).minutes} \xA77H`,
        `${(ID + (ID < 262 ? 0 : number_of_1_16_100_items)) * 65536 + (enchanted ? 32768 : 0)}`
      );
    });
    if (products.length == 0) {
      ui.button(`\xA7c\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E43\u0E19\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13`);
    }
    ui.button(`\xA7f\u0E01\u0E25\u0E31\u0E1A`, "");
    ui.show(pl).then((res) => {
      if (res.canceled) return;
      switch (res.selection) {
        case 1:
          this.startSellItem(pl, itemDB);
          break;
      }
      if (productBtn.some((x) => x == res.selection) && products.length !== 0) {
        this.productManagers(
          pl,
          itemDB,
          products[res.selection - 2]
        );
      } else if (res.selection >= productBtn.length + 2) {
        this.showMainUi(pl, itemDB);
      }
    });
  }
  productManagers(pl, itemDB, product) {
    const productM = new ActionFormData3();
    const itemStack = itemDB.get(product.itemStack)[0];
    productM.title(
      `\xA7b\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 | \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C (\xA7e${SimplifyItemTypeId(itemStack)}\xA77)`
    );
    productM.body(`
 \xA77\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48
`);
    productM.button(
      `\xA7e\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32
`,
      `textures/ui/icon_book_writable`
    );
    productM.button(`\xA7c\u0E25\u0E1A\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32`, `textures/ui/cancel`);
    productM.button(`\xA7a\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02\xA77\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32`, `textures/ui/book_edit_default`);
    if (product.isHide) {
      productM.button(`\xA77\u0E0B\u0E48\u0E2D\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \xA77(\xA7a\u0E40\u0E1B\u0E34\u0E14\xA77)`, `textures/ui/icon_none`);
    } else {
      productM.button(`\xA77\u0E0B\u0E48\u0E2D\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \xA77(\xA7c\u0E1B\u0E34\u0E14\xA77)`, `textures/ui/icon_none`);
    }
    productM.button(`\xA7f\u0E01\u0E25\u0E31\u0E1A`, ``);
    productM.show(pl).then((res) => {
      if (res.canceled) return;
      switch (res.selection) {
        case 0:
          this.showProductDetails(pl, itemDB, product);
          break;
        case 1:
          this.deleteProduct(pl, itemDB, product);
          break;
        case 2:
          this.editProductPrice(pl, itemDB, product);
          break;
        case 3:
          product.isHide = !product.isHide;
          Product.setProduct(
            product.itemStack,
            CalculatePageSize(
              Product.getProduct(2 /* all */, { hide: true }).length
            ),
            product
          );
          pl.playSound("random.orb");
          this.productManagers(pl, itemDB, product);
          break;
        case 4:
          this.initiateItemSale(pl, itemDB);
          break;
      }
    });
  }
  editProductPrice(pl, itemDB, product) {
    const item = itemDB.get(product.itemStack)[0];
    const durability = item.hasComponent("durability") ? `\xA7c${item.getComponent("durability").maxDurability - item.getComponent("durability").damage}\xA77/\xA7c${item.getComponent("durability").maxDurability}\xA7r` : `\xA7c0\xA77/\xA7c0`;
    const ID = typeIdToDataId.get(item.typeId) ?? typeIdToID.get(item.typeId);
    const sellUi = new ModalFormData().title(
      `\xA7c\xA7h\xA7e\xA7y\xA7t${(ID + (ID < 262 ? 0 : 0)) * 65536 + ((item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0 ? 32768 : 0)}`
    ).textField(
      `

    \xA7e\u0E0A\u0E37\u0E48\u0E2D\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7f${SimplifyItemTypeId(
        item
      )}
    \xA7c\u0E08\u0E33\u0E19\u0E27\u0E19\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7f${item.amount}\xA7cx\xA7r
    \xA7d\u0E04\u0E27\u0E32\u0E21\u0E04\u0E07\u0E17\u0E19\xA77: \xA77${durability}


`,
      "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",
      {
        defaultValue: `${product.prices}`
      }
    ).toggle("\xA77\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02");
    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues[0]) < 1) {
        return this.editProductPrice(pl, itemDB, product);
      }
      if (res.formValues[1] == true) {
        const price = parseInt(res.formValues[0]);
        if (isNaN(price)) {
          pl.sendMessage(
            "\xA77\u0E01\u0E32\u0E23\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E16\u0E39\u0E01\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\xA77\n  -\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13\u0E1B\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\xA7c\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\xA77 (\xA7c\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\xA77)"
          );
          pl.playSound("mob.villager.no");
        } else {
          this.showMessageForm(
            "\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C",
            "\xA77\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?",
            "\xA7a\u0E43\u0E0A\u0E48",
            "\xA7c\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48",
            () => {
              pl.sendMessage(
                `\xA77\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E04\u0E32\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \xA7e${SimplifyItemTypeId(item)} \xA77\u0E08\u0E33\u0E19\u0E27\u0E19 \xA7a${item.amount}\xA77x \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08`
              );
              pl.playSound("random.orb");
              product.prices = price;
              Product.setProduct(
                product.itemStack,
                CalculatePageSize(
                  Product.getProduct(2 /* all */).length
                ),
                product
              );
            },
            () => {
            },
            pl,
            itemDB
          );
        }
      } else {
        pl.sendMessage(
          "\u0E01\u0E32\u0E23\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\n  -\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E40\u0E40\u0E01\u0E49\u0E44\u0E02"
        );
        pl.playSound("mob.villager.no");
      }
    });
  }
  deleteProduct(pl, itemDB, product) {
    this.showMessageForm(
      `\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
      `
\xA77\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E1A\xA7c\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48?`,
      `\xA7a\u0E43\u0E0A\u0E48`,
      `\xA7c\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48`,
      (pl2, itemDB2) => {
        pl2.sendMessage(
          `\xA7c\u0E25\u0E1A\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7e${SimplifyItemTypeId(
            itemDB2.get(product.itemStack)[0]
          )} \xA77\u0E08\u0E33\u0E19\u0E27\u0E19 \xA7a${itemDB2.get(product.itemStack)[0].amount}\xA77x \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08`
        );
        pl2.playSound("random.orb");
        let page = 1;
        Product.getProduct(2 /* all */).forEach((p, i) => {
          if (p.itemStack == product.itemStack) page = CalculatePageSize(i);
        });
        pl2.getComponent("inventory").container.addItem(
          itemDB2.get(product.itemStack)[0]
        );
        Product.removeProduct(
          product.itemStack,
          itemDB2,
          new DatabaseMap(`market:${page}`)
        );
      },
      () => {
      },
      pl,
      itemDB
    );
  }
  showProductDetails(pl, itemDB, product) {
    const item = itemDB.get(product.itemStack)[0];
    pl.playSound("random.click");
    const durability = item.hasComponent("durability") ? `\xA7c${item.getComponent("durability").maxDurability - item.getComponent("durability").damage}\xA77/\xA7c${item.getComponent("durability").maxDurability}\xA7r` : `\xA7c0\xA77/\xA7c0`;
    const ID = typeIdToDataId.get(item.typeId) ?? typeIdToID.get(item.typeId);
    const sellUi = new ModalFormData().title(
      `\xA7c\xA7h\xA7e\xA7y\xA7t${(ID + (ID < 262 ? 0 : 0)) * 65536 + ((item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0 ? 32768 : 0)}`
    ).textField(
      `


    \xA7e\u0E0A\u0E37\u0E48\u0E2D\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7f${SimplifyItemTypeId(
        item
      )}
    \xA7c\u0E08\u0E33\u0E19\u0E27\u0E19\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7f${item.amount}\xA7cx\xA7r
    \xA7d\u0E04\u0E27\u0E32\u0E21\u0E04\u0E07\u0E17\u0E19\xA77: \xA77${durability}
    \xA7b\u0E23\u0E32\u0E04\u0E32\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7a$${product.prices}




`,
      "hide(-)"
    ).submitButton(`\xA77\u0E01\u0E25\u0E31\u0E1A`);
    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      this.productManagers(pl, itemDB, product);
    });
  }
  startSellItem(pl, itemDB) {
    pl.playSound("random.click");
    if (Product.getProduct(0 /* owners */, { owners: pl.name }).length >= 100) {
      this.showMessageForm(
        `\xA7c\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
        `\xA77\u0E04\u0E38\u0E13\u0E21\u0E35\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E21\u0E32\u0E01\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E43\u0E19\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13`,
        `\xA7a\u0E01\u0E25\u0E31\u0E1A`,
        `\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01`,
        (pl2, itemDB2) => {
          this.initiateItemSale(pl2, itemDB2);
        },
        () => {
        },
        pl,
        itemDB
      );
      return;
    }
    const interval = system5.runInterval(() => {
      this.savedUi.set(pl, true);
      pl.onScreenDisplay.setActionBar(
        `\xA77\u0E01\u0E32\u0E23\u0E25\u0E07\u0E02\u0E32\u0E22\xA76\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77:
    \xA7e-\xA77\u0E19\u0E33\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E07\xA7e\u0E02\u0E32\u0E22\xA77\u0E21\u0E32\u0E44\u0E27\u0E49\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2D\u0E40\u0E17\u0E47\u0E21\u0E0A\u0E48\u0E2D\u0E07\xA7c\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\xA77
    \xA7e-\xA77\u0E01\u0E14\u0E22\u0E48\u0E2D\u0E2B\u0E23\u0E37\u0E2D Shift \u0E40\u0E1E\u0E37\u0E48\u0E2D\xA7a\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\xA77`
      );
      if (pl.isSneaking) {
        const itemStack = pl.getComponent("inventory").container.getItem(8);
        if (itemStack) {
          this.showSellUi(pl, itemStack, itemDB);
        } else {
          this.showMessageForm(
            `\xA7c\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C`,
            `\xA77\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E01\u0E47\u0E1A\u0E02\u0E2D\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22`,
            `\xA7a\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07`,
            `\xA7c\u0E2D\u0E2D\u0E01`,
            () => {
              this.startSellItem(pl, itemDB);
            },
            () => {
              pl.playSound("mob.villager.no");
            },
            pl,
            itemDB
          );
        }
        this.savedUi.delete(pl);
        system5.clearRun(interval);
      }
    });
  }
  // Show sell item UI
  showSellUi(pl, item, itemDB) {
    const durability = item.hasComponent("durability") ? `\xA7c${item.getComponent("durability").maxDurability - item.getComponent("durability").damage}\xA77/\xA7c${item.getComponent("durability").maxDurability}\xA7r` : `\xA7c0\xA77/\xA7c0`;
    const ID = typeIdToDataId.get(item.typeId) ?? typeIdToID.get(item.typeId);
    const sellUi = new ModalFormData().title(
      `\xA7c\xA7h\xA7e\xA7y\xA7t${(ID + (ID < 262 ? 0 : 0)) * 65536 + ((item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0 ? 32768 : 0)}`
    ).textField(
      `

    \xA7e\u0E0A\u0E37\u0E48\u0E2D\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32: \xA7f${SimplifyItemTypeId(
        item
      )}
    \xA7c\u0E08\u0E33\u0E19\u0E27\u0E19\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\xA77: \xA7f${item.amount}\xA7cx\xA7r
    \xA7d\u0E04\u0E27\u0E32\u0E21\u0E04\u0E07\u0E17\u0E19\xA77: \xA77${durability}


`,
      "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E23\u0E32\u0E04\u0E32\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"
    ).toggle("\xA77\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E25\u0E07\xA7c\u0E02\u0E32\u0E22\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32");
    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues[0]) < 1) {
        return this.showSellUi(pl, item, itemDB);
      }
      if (res.formValues[1] == true) {
        const price = parseInt(res.formValues[0]);
        if (isNaN(price)) {
          pl.sendMessage(
            "\xA77\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E16\u0E39\u0E01\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\xA77\n  -\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13\u0E1B\u0E49\u0E2D\u0E19\u0E23\u0E32\u0E04\u0E32\u0E44\u0E21\u0E48\xA7c\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\xA77 (\xA7c\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\xA77)"
          );
          pl.playSound("mob.villager.no");
        } else {
          this.showMessageForm(
            "\xA7e\u0E40\u0E40\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19 \xA77| \xA77\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C",
            "\xA77\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E25\u0E07\u0E02\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E08\u0E30\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E43\u0E19\u0E15\u0E25\u0E32\u0E14\u0E2D\u0E35\u0E01 \xA7a3 \xA77\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 (\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E01\u0E47\u0E1A\u0E02\u0E2D\u0E07)",
            "\xA7a\u0E02\u0E32\u0E22",
            "\xA7c\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
            () => {
              const sysProduct = new Product(
                item,
                pl.name,
                price,
                CalculatePageSize(
                  Product.getProduct(2 /* all */).length
                ),
                itemDB
              );
              sysProduct.addProduct();
              pl.sendMessage(
                `\xA77\u0E25\u0E07\xA7c\u0E02\u0E32\u0E22\xA77\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \xA7e${SimplifyItemTypeId(item)} \xA77\u0E08\u0E33\u0E19\u0E27\u0E19 \xA7a${item.amount}\xA77x \xA77\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08`
              );
              pl.playSound("random.orb");
              pl.getComponent("inventory").container.setItem(8);
              new _MarketUi(this.config).showMainUi(pl, itemDB);
            },
            () => {
            },
            pl,
            itemDB
          );
        }
      } else {
        pl.sendMessage(
          "\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\n  -\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E25\u0E07\u0E02\u0E32\u0E22"
        );
        pl.playSound("mob.villager.no");
      }
    });
  }
};

// packs/scripts/plugins/MarketSystem/index.ts
var MarketSystem = class extends PluginBase {
  name = "MarketSystem";
  version = "1.0.0";
  itemDB = null;
  onLoad() {
    this.itemDB = new QuickItemDatabase("it_market", 5, 1);
    if (this.itemDB == null) return;
    this.events.on("AfterItemUse", (ev) => {
      const { source, itemStack } = ev;
      if (itemStack.typeId == "minecraft:compass") {
        if (source.isSneaking) {
          this.itemDB.clear();
          this.world.clearDynamicProperties();
          this.world.structureManager.getWorldStructureIds().forEach((id) => {
            if (id.includes("it_market")) {
              this.world.structureManager.delete(id);
            }
          });
          console.warn(
            `[MarketSystem] Cleared all market data by ${source.name}`
          );
          this.itemDB.clear();
          return;
        }
        const ui = new MarketUi({ moneyScore: "money" });
        ui.showMainUi(source, this.itemDB);
      }
    });
  }
};

// packs/scripts/Index.ts
new class KisuAPI extends SystemBase {
  onLoad() {
    console.warn(`[KisuAPI] Loading MarketSystem Plugin...`);
    this.pluginManagers.registerPlugin(MarketSystem);
  }
}();
//# sourceMappingURL=Index.js.map
