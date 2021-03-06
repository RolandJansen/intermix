/* eslint-disable @typescript-eslint/no-unused-vars */
import { IState } from "../interfaces/interfaces";
import { ICoreAction } from "../interfaces/IActions";
import { IControllerPlugin } from "../interfaces/IRegistryItems";
import { AbstractPlugin } from "./AbstractPlugin";

export abstract class AbstractControllerPlugin extends AbstractPlugin implements IControllerPlugin {
    /**
     * This is where you drop in actions that should be dispatched for
     * other plugins (not in this plugins actionCreators list).
     * The implementation will be injected by the registry so we just have to
     * provide an empty method here. It has to be public so the registry can see it.
     * @param action An action object that normally holds data for an audio device
     */
    public sendAction(action: ICoreAction): void {
        /* nothing */
    }

    protected getGlobalState(): IState {
        // will be overridden by the registry
        return {};
    }
}
