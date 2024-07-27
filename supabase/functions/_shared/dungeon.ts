import * as _ from "npm:radash";
import { Maybe } from "npm:purify-ts/maybe";
import { search } from "npm:@evilkiwi/astar";
import * as metric from "https://deno.land/x/metric@v1.2.0/src/index.ts";

import { Item } from "./item.ts";

type DungeonTile = -1 | 0;
export type Dungeon = DungeonTile[][];

export type Position = { x: number; y: number };

export function posEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

export function distanceBetween(pos1: Position, pos2: Position): number {
    return metric.distance([pos1.x, pos1.y], [pos2.x, pos2.y]);
}

export function placeTreasure(
    dungeon: Dungeon,
): Item[] {
    const treasures: Item[] = [];
    for (const x of _.range(dungeon.length - 1)) {
        for (const y of _.range(dungeon[0].length - 1)) {
            if (dungeon[x][y] === 0 && _.random(0, 20) === 0) {
                treasures.push(
                    {
                        id: _.uid(6),
                        type: "treasure",
                        weight: _.random(5, 20),
                        location: {
                            tag: "floor",
                            position: { x, y },
                        },
                    },
                );
            }
        }
    }
    return treasures;
}

export function placeExit(dungeon: Dungeon): Position {
    const x = _.random(0, dungeon.length - 1);
    const y = _.random(0, dungeon[0].length - 1);
    if (dungeon[x][y] === 0) {
        return { x, y };
    }
    return placeExit(dungeon);
}

export function moveToward(
    dungeon: Dungeon,
    pos1: Position,
    pos2: Position,
    speed: number,
): Position | undefined {
    return Maybe.fromNullable(search({
        cutCorners: false,
        diagonal: false,
        from: [pos1.x, pos1.y],
        to: [pos2.x, pos2.y],
        grid: dungeon,
    })).map((path) => {
        const positions = path.map(([x, y]) => ({ x, y }));
        console.log({ pos1, pos2, positions });
        if (positions.length <= speed) {
            return positions[positions.length - 1];
        }
        return positions[speed];
    }).extract();
}
