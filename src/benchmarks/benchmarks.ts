import { Event, Suite } from "benchmark";
import copyArrayBench from "./copyArray.bench";

const suites: Suite[] = [copyArrayBench];

(function runAllTests(): void {
    setupBenchmarks();
    runNextTest();
})();

function setupBenchmarks(): void {
    suites.forEach((suite) => {
        createBenchmark(suite);
    });
}

function createBenchmark(suite: Suite): void {
    suite
        .on("cycle", (event: Event) => {
            // tslint:disable-next-line:no-console
            console.log(String(event.target));
        })
        .on("complete", () => {
            // tslint:disable-next-line:no-console
            console.log("Fastest is " + suite.filter("fastest"));

            // tests run async so next test will be triggered on completion
            // so that they don't interfere.
            runNextTest();
        });
}

function runNextTest(): void {
    // tslint:disable-next-line:no-console
    console.log("Starting test");
    const suite = suites.pop();
    // tslint:disable-next-line:no-console
    suite ? suite.run({ async: true }) : console.log("All tests complete");
}
