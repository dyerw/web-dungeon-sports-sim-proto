import * as _ from "npm:radash";

import { Position } from "./dungeon.ts";
import { Denormalized } from "./util.ts";
import { Adventurer } from "./adventurer.ts";

export type ItemType = "treasure";

type ItemFloorLocation = {
    tag: "floor";
    position: Position;
};
type ItemInventoryLocation = {
    tag: "inventory";
    adventurerId: string;
};

export type ItemLocation = ItemFloorLocation | ItemInventoryLocation;

export type Item = {
    id: string;
    weight: number;
    type: ItemType;
    location: ItemLocation;
};

export function isOnFloor(
    item: Item,
): item is Item & { location: ItemFloorLocation } {
    return item.location.tag === "floor";
}

export function inventoryFor(items: Item[], adventurerId: string) {
    return items.filter((i) =>
        i.location.tag === "inventory" &&
        i.location.adventurerId === adventurerId
    );
}

export function inventoryWeight(
    items: Item[],
    adventurerId: string,
): number {
    const inventory = inventoryFor(items, adventurerId);
    return _.sum(inventory, (item) => item.weight);
}

export function remainingWeight(
    items: Item[],
    adventurer: Denormalized<Adventurer>,
): number {
    return adventurer.maxInventoryWeight -
        inventoryWeight(items, adventurer.id);
}

export function inventoryFull(
    items: Item[],
    adventurer: Denormalized<Adventurer>,
): boolean {
    return remainingWeight(items, adventurer) <= 0;
}
