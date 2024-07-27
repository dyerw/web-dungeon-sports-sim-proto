import { Maybe } from "npm:purify-ts/maybe";
import * as _ from "npm:radash";

import {
    inventoryFor,
    inventoryFull,
    isOnFloor,
    Item,
    ItemLocation,
    remainingWeight,
} from "./item.ts";
import {
    distanceBetween,
    Dungeon,
    moveToward,
    placeExit,
    placeTreasure,
    posEqual,
    Position,
} from "./dungeon.ts";
import { Adventurer, isAlive, Target } from "./adventurer.ts";
import { generateRandomDungeon } from "./procgen/generate_random_dungeon.ts";

export type Match = {
    tick: number;
    score: number;
    adventurers: Record<string, Adventurer>;
    items: Record<string, Item>;
    dungeon: Dungeon;
    exit: Position;
};

export function toASCII(match: Match): string {
    const symbols = match.dungeon.map((row, x) =>
        row.map((tile, y) => {
            if (
                Object.values(match.adventurers).some((a) =>
                    posEqual(a.position, { x, y })
                )
            ) {
                return "A";
            }
            if (
                itemList(match).some((i) =>
                    posEqual(getItemLocationPositon(match, i.location), {
                        x,
                        y,
                    })
                )
            ) {
                return "*";
            }
            return tile === -1 ? "#" : ".";
        })
    );
    return symbols.map((row) => row.join("")).join("\n");
}

export function makeMatch(adventurers: Adventurer[]): Match {
    const dungeon = generateRandomDungeon(20, 20);
    const items = placeTreasure(dungeon);
    const exit = placeExit(dungeon);
    const spawnedAdventurers = adventurers.map((a) => ({
        ...a,
        position: exit,
    }));
    return {
        tick: 0,
        score: 0,
        adventurers: Object.fromEntries(
            spawnedAdventurers.map((a) => [a.id, a]),
        ),
        items: Object.fromEntries(items.map((i) => [i.id, i])),
        dungeon,
        exit,
    };
}

export function itemList(match: Match): Item[] {
    return Object.values(match.items);
}

export function getAdventurer(
    match: Match,
    adventurerId: string,
): Adventurer {
    if (!(adventurerId in match.adventurers)) {
        throw new Error(
            `${adventurerId} not a valid adventurer id, you fucked up`,
        );
    }
    return match.adventurers[adventurerId];
}

export function getNearestCarryableTreasure(
    match: Match,
    agentId: string,
): Maybe<Item> {
    const a = getAdventurer(match, agentId);
    const canCarry = remainingWeight(Object.values(match.items), a);
    const treasures = Object.values(match.items).filter(isOnFloor).filter((
        i,
    ) => i.type === "treasure" && i.weight <= canCarry);
    const nearest = Maybe.fromNullable(_.min(
        treasures,
        (t) => distanceBetween(t.location.position, a.position),
    ));
    return nearest;
}

function getItemLocationPositon(
    match: Match,
    location: ItemLocation,
): Position {
    switch (location.tag) {
        case "floor":
            return location.position;
        case "inventory":
            return getAdventurer(match, location.adventurerId).position;
    }
}

function getTargetPositon(match: Match, target: Target): Position {
    switch (target.type) {
        case "exit":
            return match.exit;
        case "item":
            return getItemLocationPositon(
                match,
                match.items[target.id].location,
            );
    }
}

export type ActionStatus = "success" | "failure" | "running";
export const commandHandlers = {
    InventoryFull: (match: Match, adventurerId: string): boolean => {
        console.log("InventoryFull");
        const adventurer = getAdventurer(match, adventurerId);
        const inventoryF = inventoryFull(itemList(match), adventurer);
        console.log({ inventoryF });
        return inventoryF;
    },
    IsAlive(match: Match, adventurerId: string): boolean {
        console.log("IsAlive");
        const adventurer = getAdventurer(match, adventurerId);
        return isAlive(adventurer);
    },
    TargetInRange(
        match: Match,
        adventurerId: string,
        range: number,
    ): boolean {
        console.log("TargetInRange");
        const adventurer = getAdventurer(match, adventurerId);
        if (adventurer.target === undefined) {
            return false;
        }
        const inRange = distanceBetween(
            adventurer.position,
            getTargetPositon(match, adventurer.target),
        ) <= range;
        console.log({ inRange });
        return inRange;
    },
    TargetExit(match: Match, adventurerId: string): ActionStatus {
        console.log("TargetExit");
        const adventurer = getAdventurer(match, adventurerId);
        adventurer.target = { type: "exit" };
        return "success";
    },
    TargetTreasure(match: Match, adventurerId: string): ActionStatus {
        console.log("TargetTreasure");
        const adventurer = getAdventurer(match, adventurerId);
        const treasuresOnFloor = itemList(match).filter((i) =>
            i.type === "treasure"
        ).filter(isOnFloor);
        const closest = _.min(
            treasuresOnFloor,
            ({ location }) =>
                distanceBetween(location.position, adventurer.position),
        );
        if (closest === null) {
            console.log("NO TREASURE TO TARGET");
            return "failure";
        }
        console.log(
            "Targeting treasure at: ",
            JSON.stringify(closest.location.position),
        );
        adventurer.target = { type: "item", id: closest.id };
        return "success";
    },
    MoveToTarget(match: Match, adventurerId: string): ActionStatus {
        console.log("MoveToTarget");
        const adventurer = getAdventurer(match, adventurerId);
        if (adventurer.target === undefined) {
            console.log("TARGET UNDEFINED");
            return "failure";
        }

        const targetPosition = getTargetPositon(match, adventurer.target);
        if (posEqual(adventurer.position, targetPosition)) {
            console.log("Successfully moved toward target");
            return "success";
        }

        const newPosition = moveToward(
            match.dungeon,
            adventurer.position,
            targetPosition,
            adventurer.movement,
        );
        if (newPosition === undefined) {
            console.log("NO PATH TO TARGET");
            return "failure";
        }
        console.log(`Moving to: `, JSON.stringify(newPosition));
        adventurer.position = newPosition;
        return "running";
    },
    DropOffTreasure(match: Match, adventurerId: string): ActionStatus {
        console.log("DropOffTreasure");
        const items = inventoryFor(itemList(match), adventurerId).filter((i) =>
            i.type === "treasure"
        );
        if (items.length === 0) {
            return "failure";
        }
        const totalTreasureWeight = _.sum(
            items,
            (i) => i.weight,
        );
        match.score += totalTreasureWeight;
        items.forEach((i) => {
            delete match.items[i.id];
        });
        return "success";
    },
    PickUpTargetedTreasure(match: Match, adventurerId: string): ActionStatus {
        console.log("PickUpTargetedTreasure");
        const adventurer = getAdventurer(match, adventurerId);
        const target = adventurer.target;
        if (target === undefined) {
            console.log("TARGET UNDEFINED");
            return "failure";
        }
        if (target.type !== "item") {
            return "failure";
        }
        const item = match.items[target.id];
        if (!(item.type === "treasure" && item.location.tag === "floor")) {
            return "failure";
        }
        const distance = distanceBetween(
            adventurer.position,
            item.location.position,
        );
        if (distance > 0) {
            return "failure";
        }
        item.location = {
            tag: "inventory",
            adventurerId: adventurerId,
        };
        adventurer.target = undefined;
        return "success";
    },
    Idle(_match: Match, _adventurerId: string): ActionStatus {
        console.log("Idle");
        return "success";
    },
};
