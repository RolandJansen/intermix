// typing for the webpack worker-loader

// 2020-08-31: currently the webpack
// config is still there and can be used.
// When it gets removed, this should get cleaned up, too.
declare module "worker-loader!*" {
    class WebpackWorker extends Worker {
        constructor();
    }

    export default WebpackWorker;
}
