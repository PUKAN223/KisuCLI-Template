import { ItemStack, Player, system, world } from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import { DatabaseMap } from "./DatabaseMap.ts";
import { IMarketUiOptions } from "../types/IMarketUiOptions.ts";
import { QuickItemDatabase } from "./QickItemDatabase.ts";
import { IProductData } from "../types/IProductData.ts";
import { typeIdToDataId, typeIdToID } from "../utils/ItemToAuxIds.ts";
import { SimplifyItemTypeId } from "../utils/SimplifyItemTypeId.ts";
import { Product, ProductGetOptions } from "./Product.ts";
import { CalculatePageSize } from "../utils/CalculatePageSize.ts";
import { CalculateExpiredTime } from "../utils/CalculateExpiredTime.ts";
import { ChestFormData } from "./ChestForms.ts";
import { SimpifyEnchantText } from "../utils/SimplifyEnchantText.ts";

export class MarketUi {
  private moneyScore: DatabaseMap<number>;
  private savedUi: Map<Player, boolean>;
  private config: IMarketUiOptions;
  constructor(config: IMarketUiOptions) {
    this.moneyScore = new DatabaseMap<number>(config.moneyScore);
    this.savedUi = new Map<Player, boolean>();
    this.config = config;
  }

  private initializeScore(pl: Player) {
    let obj = world.scoreboard.getObjective(this.config.moneyScore);
    if (!obj) {
      world.scoreboard.addObjective(this.config.moneyScore);
      obj = world.scoreboard.getObjective(this.config.moneyScore);
    }
    if (obj && !obj.hasParticipant(pl)) {
      obj.setScore(pl.scoreboardIdentity ?? pl, 0);
    }

    return;
  }

  // Utility to show a simple message form
  private showMessageForm(
    title: string,
    message: string,
    confirmButton: string,
    cancelButton: string,
    onConfirm: (pl: Player, itemDB: QuickItemDatabase) => void,
    onCancel: (pl: Player) => void,
    pl: Player,
    itemDB: QuickItemDatabase,
  ) {
    const msgUi = new MessageFormData()
      .title(title)
      .body(message)
      .button1(confirmButton)
      .button2(cancelButton);

    msgUi.show(pl).then((res) => {
      if (res.canceled) return;
      res.selection === 0 ? onConfirm(pl, itemDB) : onCancel(pl);
    });
  }

  // Main UI for the market
  public showMainUi(pl: Player, itemDB: QuickItemDatabase) {
    this.initializeScore(pl);

    if (this.savedUi.get(pl) ?? false) return;
    const mainUi = new ActionFormData()
      .title("§dหน้าหลัก §7| §7ตลาดออนไลน์")
      .button(`§eสินค้าในตลาด`, "textures/ui/sidebar_icons/marketplace")
      .button(`§aบัญชี`, "textures/ui/sidebar_icons/my_characters")
      .button(`§bร้านค้า§7ของคุณ`, "textures/ui/sidebar_icons/promotag");
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

  private accountUI(pl: Player, itemDB: QuickItemDatabase) {
    const accountUi = new ModalFormData();
    accountUi.title(`§aบัญชี §7| §7ตลาดออนไลน์`);
    accountUi.textField(
      `\n §7คุณสามารถถอนเงินจากการขายสินค้าได้ที่นี่\n §7เงิน§7จากการ§cขาย§7สินค้า: §a$${
        (this.moneyScore.get(pl.id) as number) ?? 0
      }\n\n§7จำนวนเงิน: `,
      `§7กรุณาระบุเงินที่ต้องการถอน §7(1-${
        (this.moneyScore.get(pl.id) as number) ?? 0
      })`,
    );
    accountUi.toggle(`§7กลับ/§bถอนเงิน`);
    accountUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues![0] as string) < 1) {
        return this.accountUI(pl, itemDB);
      }
      if (res.formValues![1] == false) {
        this.showMainUi(pl, itemDB);
      } else if (
        ((this.moneyScore.get(pl.id) as number) ?? 0) <
          parseInt(res.formValues![0] as string)
      ) {
        this.showMessageForm(
          `§eเเจ้งเตือน §7| §7ตลาดออนไลน์`,
          `§7คุณมีเงินไม่พอที่จะถอนเงิน`,
          `§aกลับ`,
          `§cยกเลิก`,
          (pl, itemDB) => {
            this.accountUI(pl, itemDB);
          },
          () => {},
          pl,
          itemDB,
        );
      } else {
        this.moneyScore.set(
          pl.name,
          (this.moneyScore.get(pl.name) as number) -
            parseInt(res.formValues![0] as string),
        );
        world.scoreboard
          .getObjective(this.config.moneyScore)
          ?.setScore(pl, parseInt(res.formValues![0] as string));
        pl.playSound("random.orb");
        this.accountUI(pl, itemDB);
      }
    });
  }

  private buyProduct(
    pl: Player,
    itemDB: QuickItemDatabase,
    product: IProductData,
    data: DatabaseMap<IProductData>,
    page: number,
    res: number,
  ) {
    const selection = res;
    const item = (itemDB.get([...data.keys()][selection]) as ItemStack[])[0];
    const productUi = new ModalFormData();
    const ID = typeIdToDataId.get(item.typeId) ??
      (typeIdToID.get(item.typeId) as number);
    // const number_of_1_16_100_items = 0;
    const durability = item.hasComponent("durability")
      ? `§c${
        item.getComponent("durability")!.maxDurability -
        item.getComponent("durability")!.damage
      }§7/§c${item.getComponent("durability")!.maxDurability}§r`
      : `§c0§7/§c0`;
    const enchanted =
      (item.getComponent("enchantable")?.getEnchantments() ?? []).length > 0;
    productUi.title(
      `§c§h§e§y§t${
        (ID + (ID < 262 ? 0 : 0)) * 65536 + (enchanted ? 32768 : 0)
      }`,
    );
    productUi.textField(
      `\n\n\n    §eชื่อ§7สินค้า: §f${
        SimplifyItemTypeId(
          item,
        )
      }\n    §cจำนวน§7สินค้า§7: §f${item.amount}§cx§r\n    §dความคงทน§7: §7${durability}\n    §bราคา§7สินค้า§7: §a${
        [...data.entries()][res][1].prices
      }\n\n\n\n\n`,
      "hide(-)",
    );
    productUi.toggle(`§aยืนยัน§7การซื้อ §7(กลับ§7/ซื้อ§7)`);
    productUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (res.formValues![1] == false) {
        return this.viewProductUi(pl, itemDB, page);
      }
      const score =
        world.scoreboard.getObjective(this.config.moneyScore)?.getScore(pl) ??
          0;
      if (score < [...data.entries()][selection][1].prices) {
        this.showMessageForm(
          `§eเเจ้งเตือน §7| §7ตลาดออนไลน์`,
          `§7คุณมีเงินไม่พอที่จะซื้อสินค้านี้`,
          `§aกลับ`,
          `§cยกเลิก`,
          (pl, itemDB) => {
            this.buyProduct(pl, itemDB, product, data, page, selection);
          },
          () => {},
          pl,
          itemDB,
        );
      } else {
        const dataIt = [...data.entries()][selection][1];
        this.showMessageForm(
          `§eเเจ้งเตือน §7| §7ตลาดออนไลน์`,
          `§7คุณต้องการซื้อสินค้าราคา §c$${dataIt.prices} §7ใช่หรือไม่?\nหากซื้อคุณจะมี§aเงิน§7เหลือ §c($${
            score - dataIt.prices
          })`,
          `§aใช่`,
          `§cกลับ`,
          (pl, itemDB) => {
            const item = (itemDB.get(dataIt.itemStack) as ItemStack[])[0];
            pl.sendMessage(
              `§7ซื้อ§7สินค้า§7: §e${
                SimplifyItemTypeId(item)
              } §7จำนวน §a${item.amount}§7x §7สำเร็จ`,
            );
            pl.playSound("random.orb");
            pl.getComponent("inventory")!.container.addItem(item);
            world.scoreboard
              .getObjective(this.config.moneyScore)
              ?.setScore(pl, score - dataIt.prices);
            Product.removeProduct(dataIt.itemStack, itemDB, data);
            const now = (this.moneyScore.get(pl.name) as number) ?? 0;
            this.moneyScore.set(dataIt.owner, now + dataIt.prices);
          },
          () => {
            this.buyProduct(pl, itemDB, product, data, page, selection);
          },
          pl,
          itemDB,
        );
      }
    });
  }

  // View product UI
  private viewProductUi(pl: Player, itemDB: QuickItemDatabase, page: number) {
    const data = new DatabaseMap<IProductData>(`market:${page}`);
    for (let i = 0; i < [...data.keys()].length; i++) {
      if (
        CalculateExpiredTime(data.get([...data.keys()][i])!.releaseDate) == null
      ) {
        Product.removeProduct([...data.keys()][i], itemDB, data);
      }
    }
    const market = new ChestFormData("36");
    const productBtn: number[] = [];
    market.title(
      `§eꡄꢊนꜴา§7ในตลาด §7(${page}/${
        CalculatePageSize(
          Product.getProduct(ProductGetOptions.all, { hide: true }).length,
        )
      }) §eเงิน§7 §a$${
        world.scoreboard.getObjective(this.config.moneyScore)?.getScore(pl) ?? 0
      }`,
    );
    for (let i = 0; i < [...data.keys()].length; i++) {
      productBtn.push(i);
      const item = itemDB.get(data.get([...data.keys()][i])!.itemStack)![0];
      let des = "";
      des += item.getComponent("enchantable")?.getEnchantments()
        ? SimpifyEnchantText(
          item.getComponent("enchantable")?.getEnchantments() ?? [],
        )
        : "§7None Enchantments";
      des += "\n";
      if (item.hasComponent("durability")) {
        des += `§7Durability: ${
          item.getComponent("durability")!.maxDurability -
          item.getComponent("durability")!.damage
        }/${item.getComponent("durability")!.maxDurability}§r`;
      } else des += "§7Durability: §70/0§r";
      des += "\n\n";
      des += "-------------------------------------";
      des += "\n";
      des += "§cราคา§7สินค้า: §a$" + data.get([...data.keys()][i])!.prices;
      des += "\n";
      des += "§r§eผู้ขาย§7สินค้า: §e" + data.get([...data.keys()][i])!.owner;
      des += "\n";
      des += "§aเหลือเวลา§7อีก: §c" +
        CalculateExpiredTime(data.get([...data.keys()][i])!.releaseDate)!
          .hours +
        "." +
        CalculateExpiredTime(data.get([...data.keys()][i])!.releaseDate)!
          .minutes +
        "§7H";
      des += "\n";
      des += "-------------------------------------";

      if (!data.get([...data.keys()][i])!.isHide) {
        market.button(
          i,
          SimplifyItemTypeId(item),
          [des],
          item.typeId,
          item.amount,
          item.hasComponent("durability")
            ? (item.getComponent("durability")!.maxDurability -
              item.getComponent("durability")!.damage)
            : 0,
          (item.getComponent("enchantable")?.getEnchantments() ?? []).length >
            0,
        );
      }
    }
    market.button(27, "§cกลับ", [], "", 1, 0, false);
    market.button(31, "§7เลือกหน้า", [], "textures/ui/magnifyingGlass", 1);
    market.button(35, "§aถัดไป", [], "", 1, 0, false);
    market.show(pl).then((res) => {
      if (res.canceled) return;
      if (productBtn.some((x) => x == res.selection)) {
        this.buyProduct(
          pl,
          itemDB,
          data.get([...data.keys()][res.selection as number])!,
          data,
          page,
          res.selection as number,
        );
      } else if (res.selection == 31) {
        pl.playSound("random.click");
        const ui = new ModalFormData();
        ui.title(`§6เลือกหน้า §7| §7ตลาดออนไลน์`);
        ui.textField(
          `\n §7กรุณาใส่หมายเลขหน้าที่ต้องการไป\n\n`,
          `หมายเลขหน้า (1-${
            CalculatePageSize(
              Product.getProduct(ProductGetOptions.all, { hide: true }).length,
            )
          })`,
        );
        ui.show(pl).then((res) => {
          if (res.canceled) return;
          if (
            parseInt(res.formValues![0] as string) >
              CalculatePageSize(
                Product.getProduct(ProductGetOptions.all, { hide: true })
                  .length,
              ) ||
            parseInt(res.formValues![0] as string) < 1
          ) {
            return;
          }
          this.viewProductUi(
            pl,
            itemDB,
            parseInt(res.formValues![0] as string),
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
        if (
          page + 1 >
            CalculatePageSize(
              Product.getProduct(ProductGetOptions.all, { hide: true }).length,
            )
        ) {
          pl.playSound("mob.villager.no");
          return this.viewProductUi(pl, itemDB, page);
        } else {
          pl.playSound("random.click");
          return this.viewProductUi(pl, itemDB, page + 1);
        }
      }
    });
  }

  private initiateItemSale(pl: Player, itemDB: QuickItemDatabase) {
    for (let i = 0; i < 27; i++) {
      const itemStack = pl.getComponent("inventory")!.container.getItem(i);
      if (itemStack) {
        new Product(
          itemStack,
          pl.name,
          0,
          CalculatePageSize(
            Product.getProduct(ProductGetOptions.all, { hide: true }).length,
          ),
          itemDB,
        ).addProduct();
      }
    }
    const ui = new ActionFormData();
    const products = Product.getProduct(ProductGetOptions.owners, {
      owners: pl.name,
    });
    const productBtn: number[] = [];
    ui.title(`§6ร้านค้าของฉัน §7| §7ตลาดออนไลน์`);
    ui.body(`\n §7คุณสามารถดูสินค้าเเละจัดการสินค้าของคุณได้ที่นี่`);
    ui.button(
      `§6${pl.name}\n§aจำนวน§7สินค้าของคุณ §c${products.length}§7/§c5`,
      `textures/ui/default_cast/efe_icon`,
    );
    ui.button(`§cลงขาย§7สินค้า\n§7คลิกเพื่อลงขายสินค้า`);
    products.forEach((btn, i) => {
      productBtn.push(i + 2);
      const itemStack = (itemDB.get(btn.itemStack) as ItemStack[])[0];
      const ID = typeIdToDataId.get(itemStack.typeId) ??
        (typeIdToID.get(itemStack.typeId) as number);
      const number_of_1_16_100_items = 0;
      const enchanted =
        (itemStack.getComponent("enchantable")?.getEnchantments() ?? [])
          .length > 0;
      ui.button(
        `${
          SimplifyItemTypeId(itemStack)
        }\n§7จำนวน: §c${itemStack.amount}x §7| §7เหลือ§aเวลา§7: §c${
          CalculateExpiredTime(btn.releaseDate)!.hours
        }.${CalculateExpiredTime(btn.releaseDate)!.minutes} §7H`,
        `${
          (ID + (ID < 262 ? 0 : number_of_1_16_100_items)) * 65536 +
          (enchanted ? 32768 : 0)
        }`,
      );
    });
    if (products.length == 0) {
      ui.button(`§cไม่มีสินค้าในร้านค้าของคุณ`);
    }
    ui.button(`§fกลับ`, "");
    ui.show(pl).then((res) => {
      if (res.canceled) return;
      switch (res.selection) {
        case 1:
          this.startSellItem(pl, itemDB);
          break;
      }
      if (
        productBtn.some((x) => x == res.selection) && products.length !== 0
      ) {
        this.productManagers(
          pl,
          itemDB,
          products[(res.selection as number) - 2],
        );
      } else if ((res.selection as number) >= productBtn.length + 2) {
        this.showMainUi(pl, itemDB);
      }
    });
  }

  public productManagers(
    pl: Player,
    itemDB: QuickItemDatabase,
    product: IProductData,
  ) {
    const productM = new ActionFormData();
    const itemStack = (itemDB.get(product.itemStack) as ItemStack[])[0];
    productM.title(
      `§bจัดการ§7สินค้า | §7ตลาดออนไลน์ (§e${SimplifyItemTypeId(itemStack)}§7)`,
    );
    productM.body(`\n §7คุณสามารถจัดการสินค้าของคุณได้ที่นี่\n`);
    productM.button(
      `§eดูรายละเอียด§7สินค้า\n`,
      `textures/ui/icon_book_writable`,
    );
    productM.button(`§cลบ§7สินค้า`, `textures/ui/cancel`);
    productM.button(`§aเเก้ไข§7ราคาสินค้า`, `textures/ui/book_edit_default`);
    if (product.isHide) {
      productM.button(`§7ซ่อนสินค้า §7(§aเปิด§7)`, `textures/ui/icon_none`);
    } else {
      productM.button(`§7ซ่อนสินค้า §7(§cปิด§7)`, `textures/ui/icon_none`);
    }
    productM.button(`§fกลับ`, ``);
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
              Product.getProduct(ProductGetOptions.all, { hide: true }).length,
            ),
            product,
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

  public editProductPrice(
    pl: Player,
    itemDB: QuickItemDatabase,
    product: IProductData,
  ) {
    const item = (itemDB.get(product.itemStack) as ItemStack[])[0];
    const durability = item.hasComponent("durability")
      ? `§c${
        item.getComponent("durability")!.maxDurability -
        item.getComponent("durability")!.damage
      }§7/§c${item.getComponent("durability")!.maxDurability}§r`
      : `§c0§7/§c0`;
    const ID = typeIdToDataId.get(item.typeId) ??
      (typeIdToID.get(item.typeId) as number);
    const sellUi = new ModalFormData()
      .title(
        `§c§h§e§y§t${
          (ID + (ID < 262 ? 0 : 0)) * 65536 +
          ((item.getComponent("enchantable")?.getEnchantments() ?? []).length >
              0
            ? 32768
            : 0)
        }`,
      )
      .textField(
        `\n\n    §eชื่อ§7สินค้า: §f${
          SimplifyItemTypeId(
            item,
          )
        }\n    §cจำนวน§7สินค้า§7: §f${item.amount}§cx§r\n    §dความคงทน§7: §7${durability}\n\n\n`,
        "กรุณาใส่ราคาสินค้า",
        {
          defaultValue: `${product.prices}`,
        },
      )
      .toggle("§7ยืนยันที่จะเเก้ไข");

    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues![0] as string) < 1) {
        return this.editProductPrice(pl, itemDB, product);
      }
      if (res.formValues![1] == true) {
        const price = parseInt(res.formValues![0] as string);
        if (isNaN(price)) {
          pl.sendMessage(
            "§7การเเก้ไขราคาสินค้าถูก§cยกเลิก§7\n  -เนื่องจากคุณป้อนราคาไม่§cถูกต้อง§7 (§cตัวเลขเท่านั้น§7)",
          );
          pl.playSound("mob.villager.no");
        } else {
          this.showMessageForm(
            "§eเเจ้งเตือน §7| §7ตลาดออนไลน์",
            "§7คุณต้องการเเก้ไขราคาสินค้าใช่หรือไม่?",
            "§aใช่",
            "§cไม่ใช่",
            () => {
              pl.sendMessage(
                `§7เเก้ไขราคา§7สินค้า §e${
                  SimplifyItemTypeId(item)
                } §7จำนวน §a${item.amount}§7x §7สำเร็จ`,
              );
              pl.playSound("random.orb");
              product.prices = price;
              Product.setProduct(
                product.itemStack,
                CalculatePageSize(
                  Product.getProduct(ProductGetOptions.all).length,
                ),
                product,
              );
            },
            () => {},
            pl,
            itemDB,
          );
        }
      } else {
        pl.sendMessage(
          "การเเก้ไขราคาสินค้าถูกยกเลิก\n  -เนื่องจากไม่ได้ยืนยันการเเก้ไข",
        );
        pl.playSound("mob.villager.no");
      }
    });
  }

  public deleteProduct(
    pl: Player,
    itemDB: QuickItemDatabase,
    product: IProductData,
  ) {
    this.showMessageForm(
      `§eเเจ้งเตือน §7| §7ตลาดออนไลน์`,
      `\n§7คุณต้องการลบ§cสินค้า§7นี้ใช่หรือไม่?`,
      `§aใช่`,
      `§cไม่ใช่`,
      (pl, itemDB) => {
        pl.sendMessage(
          `§cลบ§7สินค้า§7: §e${
            SimplifyItemTypeId(
              (itemDB.get(product.itemStack) as ItemStack[])[0],
            )
          } §7จำนวน §a${
            (itemDB.get(product.itemStack) as ItemStack[])[0].amount
          }§7x §7สำเร็จ`,
        );
        pl.playSound("random.orb");
        let page = 1;
        Product.getProduct(ProductGetOptions.all).forEach((p, i) => {
          if (p.itemStack == product.itemStack) page = CalculatePageSize(i);
        });
        pl.getComponent("inventory")!.container.addItem(
          (itemDB.get(product.itemStack) as ItemStack[])[0],
        );
        Product.removeProduct(
          product.itemStack,
          itemDB,
          new DatabaseMap<IProductData>(`market:${page}`),
        );
      },
      () => {},
      pl,
      itemDB,
    );
  }

  public showProductDetails(
    pl: Player,
    itemDB: QuickItemDatabase,
    product: IProductData,
  ) {
    const item = (itemDB.get(product.itemStack) as ItemStack[])[0];
    pl.playSound("random.click");
    const durability = item.hasComponent("durability")
      ? `§c${
        item.getComponent("durability")!.maxDurability -
        item.getComponent("durability")!.damage
      }§7/§c${item.getComponent("durability")!.maxDurability}§r`
      : `§c0§7/§c0`;
    const ID = typeIdToDataId.get(item.typeId) ??
      (typeIdToID.get(item.typeId) as number);
    const sellUi = new ModalFormData()
      .title(
        `§c§h§e§y§t${
          (ID + (ID < 262 ? 0 : 0)) * 65536 +
          ((item.getComponent("enchantable")?.getEnchantments() ?? []).length >
              0
            ? 32768
            : 0)
        }`,
      )
      .textField(
        `\n\n\n    §eชื่อ§7สินค้า: §f${
          SimplifyItemTypeId(
            item,
          )
        }\n    §cจำนวน§7สินค้า§7: §f${item.amount}§cx§r\n    §dความคงทน§7: §7${durability}\n    §bราคา§7สินค้า§7: §a$${product.prices}\n\n\n\n\n`,
        "hide(-)",
      )
      .submitButton(`§7กลับ`);

    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      this.productManagers(pl, itemDB, product);
    });
  }

  private startSellItem(pl: Player, itemDB: QuickItemDatabase) {
    pl.playSound("random.click");
    if (
      Product.getProduct(ProductGetOptions.owners, { owners: pl.name })
        .length >= 100
    ) {
      this.showMessageForm(
        `§cข้อผิดพลาด §7| §7ตลาดออนไลน์`,
        `§7คุณมีสินค้ามากเกินไปในร้านค้าของคุณ`,
        `§aกลับ`,
        `§cยกเลิก`,
        (pl, itemDB) => {
          this.initiateItemSale(pl, itemDB);
        },
        () => {},
        pl,
        itemDB,
      );
      return;
    }
    const interval = system.runInterval(() => {
      this.savedUi.set(pl, true);
      pl.onScreenDisplay.setActionBar(
        `§7การลงขาย§6สินค้า§7:\n    §e-§7นำสินค้าที่ต้องการลง§eขาย§7มาไว้ช่องไอเท็มช่อง§cสุดท้าย§7\n    §e-§7กดย่อหรือ Shift เพื่อ§aยืนยัน§7`,
      );
      if (pl.isSneaking) {
        const itemStack = pl.getComponent("inventory")!.container.getItem(8);
        if (itemStack) {
          this.showSellUi(pl, itemStack, itemDB);
        } else {
          this.showMessageForm(
            `§cข้อผิดพลาด §7| §7ตลาดออนไลน์`,
            `§7คุณไม่มีสินค้าในช่องเก็บของสุดท้าย`,
            `§aลองอีกครั้ง`,
            `§cออก`,
            () => {
              this.startSellItem(pl, itemDB);
            },
            () => {
              pl.playSound("mob.villager.no");
            },
            pl,
            itemDB,
          );
        }
        this.savedUi.delete(pl);
        system.clearRun(interval);
      }
    });
  }

  // Show sell item UI
  public showSellUi(pl: Player, item: ItemStack, itemDB: QuickItemDatabase) {
    const durability = item.hasComponent("durability")
      ? `§c${
        item.getComponent("durability")!.maxDurability -
        item.getComponent("durability")!.damage
      }§7/§c${item.getComponent("durability")!.maxDurability}§r`
      : `§c0§7/§c0`;
    const ID = typeIdToDataId.get(item.typeId) ??
      (typeIdToID.get(item.typeId) as number);
    const sellUi = new ModalFormData()
      .title(
        `§c§h§e§y§t${
          (ID + (ID < 262 ? 0 : 0)) * 65536 +
          ((item.getComponent("enchantable")?.getEnchantments() ?? []).length >
              0
            ? 32768
            : 0)
        }`,
      )
      .textField(
        `\n\n    §eชื่อ§7สินค้า: §f${
          SimplifyItemTypeId(
            item,
          )
        }\n    §cจำนวน§7สินค้า§7: §f${item.amount}§cx§r\n    §dความคงทน§7: §7${durability}\n\n\n`,
        "กรุณาใส่ราคาสินค้า",
      )
      .toggle("§7ยืนยันที่จะลง§cขาย§7สินค้า");

    sellUi.show(pl).then((res) => {
      if (res.canceled) return;
      if (parseInt(res.formValues![0] as string) < 1) {
        return this.showSellUi(pl, item, itemDB);
      }
      if (res.formValues![1] == true) {
        const price = parseInt(res.formValues![0] as string);
        if (isNaN(price)) {
          pl.sendMessage(
            "§7การขายสินค้าถูก§cยกเลิก§7\n  -เนื่องจากคุณป้อนราคาไม่§cถูกต้อง§7 (§cตัวเลขเท่านั้น§7)",
          );
          pl.playSound("mob.villager.no");
        } else {
          this.showMessageForm(
            "§eเเจ้งเตือน §7| §7ตลาดออนไลน์",
            "§7หลังจากลงขายสินค้าจะถูกลบในตลาดอีก §a3 §7ชั่วโมง (สินค้าจะกลับมาในช่องเก็บของ)",
            "§aขาย",
            "§cยกเลิก",
            () => {
              const sysProduct = new Product(
                item,
                pl.name,
                price,
                CalculatePageSize(
                  Product.getProduct(ProductGetOptions.all).length,
                ),
                itemDB,
              );
              sysProduct.addProduct();
              pl.sendMessage(
                `§7ลง§cขาย§7สินค้า §e${
                  SimplifyItemTypeId(item)
                } §7จำนวน §a${item.amount}§7x §7สำเร็จ`,
              );
              pl.playSound("random.orb");
              pl.getComponent("inventory")!.container.setItem(8);
              new MarketUi(this.config).showMainUi(pl, itemDB);
            },
            () => {},
            pl,
            itemDB,
          );
        }
      } else {
        pl.sendMessage(
          "การขายสินค้าถูกยกเลิก\n  -เนื่องจากไม่ได้ยืนยันการลงขาย",
        );
        pl.playSound("mob.villager.no");
      }
    });
  }
}
