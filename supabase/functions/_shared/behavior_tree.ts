import { produce } from "npm:immer";
import * as _ from "npm:radash";
import { ActionStatus, commandHandlers, Match } from "./match.ts";
import { BehaviourTree, State as BTState } from "npm:mistreevous";

const definition = `
root {
    repeat while(IsAlive) {
        selector {
            sequence {
                condition [InventoryFull]
                action [TargetExit]
                action [MoveToTarget]
                action [DropOffTreasure]
            }
            sequence {
                action [TargetTreasure]
                action [MoveToTarget]
                action [PickUpTargetedTreasure]
            }
            action [Idle]
        }
    }
}
`;

const createAgent = (
    adventurerId: string,
    getState: () => Match,
    setState: (matchState: Match) => void,
) => {
    return _.mapValues(commandHandlers, (f) => {
        return (...args: unknown[]) => {
            let result: ActionStatus | boolean = false;
            const nextState = produce(
                getState(),
                (draft) => {
                    // @ts-ignore: This isn't type safe since we can't validate the args passed
                    // from the BTree DSL. You could do something w/ schemas but not worth it rn.
                    result = f.apply(null, [
                        draft,
                        adventurerId,
                        ...args,
                    ]);
                },
            );
            if (typeof result === "boolean") {
                return result;
            } else {
                setState(nextState);
                return {
                    success: BTState.SUCCEEDED,
                    failure: BTState.FAILED,
                    running: BTState.RUNNING,
                }[result];
            }
        };
    });
};

export function behaviourTreeForAdventurerId(
    adventurerId: string,
    getState: () => Match,
    setState: (matchState: Match) => void,
) {
    const agent = createAgent(adventurerId, getState, setState);
    const behaviourTree = new BehaviourTree(definition, agent);
    return behaviourTree;
}
