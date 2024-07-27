import { Position } from "./dungeon.ts";
import * as _ from "npm:radash";

export type Target = {
    type: "item";
    id: string;
} | {
    type: "exit";
};

export type Adventurer = {
    id: string;
    movement: number;
    currentHitPoints: number;
    position: Position;
    maxInventoryWeight: number;
    visionRange: number;
    attackRange: number;
    // A target is a stored reference, the behavior
    // tree will often conditionally acquire a target
    // and then do actions relative to it
    target?: Target;
};

export function isAlive(adventurer: Adventurer): boolean {
    return adventurer.currentHitPoints > 0;
}
