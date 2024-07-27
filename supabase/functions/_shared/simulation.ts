import { BehaviourTree } from "npm:mistreevous";
import { itemList, makeMatch, Match, toASCII } from "./match.ts";
import { Adventurer } from "./adventurer.ts";
import { behaviourTreeForAdventurerId } from "./behavior_tree.ts";
import { inventoryFor } from "./item.ts";
import * as _ from "npm:radash";
// import { search } from "npm:@evilkiwi/astar";

export class Simulation {
    history: Match[];
    currentMatchState: Match;
    trees: BehaviourTree[];

    constructor(adventurers: Adventurer[]) {
        this.history = [];
        this.trees = adventurers.map((a) =>
            behaviourTreeForAdventurerId(
                a.id,
                this._getState.bind(this),
                this._setState.bind(this),
            )
        );
        this.currentMatchState = makeMatch(adventurers);
        console.log(this.currentMatchState.adventurers);
        console.log(toASCII(this.currentMatchState));
    }

    private _setState(state: Match) {
        this.history.push(this.currentMatchState);
        this.currentMatchState = state;
    }

    private _getState(): Match {
        return this.currentMatchState;
    }

    step() {
        console.log("--Step--");
        this.trees.forEach((tree) => tree.step());
        console.log(toASCII(this.currentMatchState));
        console.log(this.currentMatchState.adventurers);
        console.log(inventoryFor(itemList(this.currentMatchState), "test-id"));
        console.log("Score: ", this.currentMatchState.score);
        // If there were environmental stuff it would happen here
    }
}

const adventurers: Adventurer[] = [
    {
        id: "test-id",
        movement: 1,
        currentHitPoints: 10,
        position: { x: 0, y: 0 },
        maxInventoryWeight: 30,
        visionRange: 10,
        attackRange: 1,
    },
];

const sim = new Simulation(adventurers);
for (const _x of _.range(1000)) {
    sim.step();
}
