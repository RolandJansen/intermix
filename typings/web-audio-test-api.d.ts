// Type definitions for web-audio-test-api
// Project: Intermix.js
// Definitions by: Roland Jansen https://github.com/RolandJansen/intermix.js

/*~ This template shows how to write a global plugin. */

/*~ Write a declaration for the original type and add new members.
 *~ For example, this adds a 'toBinaryString' method with overloads to
 *~ the built-in number type.
 */
// interface Number {
//     toBinaryString(opts?: MyLibrary.BinaryFormatOptions): string;
//     toBinaryString(callback: MyLibrary.BinaryFormatCallback, opts?: MyLibrary.BinaryFormatOptions): string;
// }

// interface AudioContext {
//     WEB_AUDIO_TEST_API_VERSION: string;
//     testStuff: number;
// }

interface AudioContext {
    // WEB_AUDIO_TEST_API_VERSION: string;
    $name: string;
    $processTo: (time: string) => void;
}

interface IWebAudioTestAPI {
    VERSION: number | string;
    // utils is missing
    sampleRate: number;
    AnalyserNode: AnalyserNode;
    AudioBuffer: AudioBuffer;
    AudioBufferSourceNode: AudioBufferSourceNode;
    AudioContext: AudioContext;
    AudioDestinationNode: AudioDestinationNode;
    AudioListener: AudioListener;
    AudioNode: AudioNode;
    AudioParam: AudioParam;
    AudioProcessingEvent: AudioProcessingEvent;
    BiquadFilterNode: BiquadFilterNode;
    ChannelMergerNode: ChannelMergerNode;
    ChannelSplitterNode: ChannelSplitterNode;
    ConvolverNode: ConvolverNode;
    DelayNode: DelayNode;
    DynamicsCompressorNode: DynamicsCompressorNode;
    Element: Element;
    Event: Event;
    EventTarget: EventTarget;
    GainNode: GainNode;
    HTMLElement: HTMLElement;
    HTMLMediaElement: HTMLMediaElement;
    MediaElementAudioSourceNode: MediaElementAudioSourceNode;
    MediaStream: MediaStream;
    MediaStreamAudioDestinationNode: MediaStreamAudioDestinationNode;
    MediaStreamAudioSourceNode: MediaStreamAudioSourceNode;
    OfflineAudioCompletionEvent: OfflineAudioCompletionEvent;
    OfflineAudioContext: OfflineAudioContext;
    OscillatorNode: OscillatorNode;
    PannerNode: PannerNode;
    PeriodicWave: PeriodicWave;
    ScriptProcessorNode: ScriptProcessorNode;
    StereoPannerNode: StereoPannerNode;
    WaveShaperNode: WaveShaperNode;
    getState(name: string): string;
    setState(name: string, value: string): void;
    setState(config: WATA.APIConfig): void;
    use(): void;
    unuse(): void;
}

/*~ If you need to declare several types, place them inside a namespace
 *~ to avoid adding too many things to the global namespace.
 */
declare namespace WATA {
    interface APIConfig {
        [propName: string]: string;
    }
}

// type AudioContext.prototype.WEB_AUDIO_TEST_API_VERSION: string;


declare var WebAudioTestAPI: IWebAudioTestAPI;

// export namespace AudioContext {
//     export const WEB_AUDIO_TEST_API_VERSION: string;
// }
