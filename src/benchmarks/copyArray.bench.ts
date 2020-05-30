import { Suite } from "benchmark";
import { forEachLambda, preAllocatedWhile, spreadOperator } from "./copyArray";
import { getRandomNumberArray } from "./helpers";

const arrayLength = 200;
const intLength = 1000;
const numbers: number[] = getRandomNumberArray(arrayLength, intLength);

const suite = new Suite("copyArrayByValue");

suite
    .add("pre-allocated while with numbers", () => {
        preAllocatedWhile(numbers);
    })

    .add("forEach with lambda function", () => {
        forEachLambda(numbers);
    })

    .add("spread operator", () => {
        spreadOperator(numbers);
    });

export default suite;
