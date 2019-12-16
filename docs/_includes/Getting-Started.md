short introduction to the concepts of intermix

build a small app that loads and triggers audio data.

then we want to trigger the audio file with a sequencer. Explain how events work and what relays are (keep it short and explain it in detail in the synth example when it comes to handlers).

the sequencer should have a visual representation. create a led that flashes red every time a note is played.

create a synthesizer to dive in deeper into intermix:

- Explain how the intermix namespace works
- Create oscillator, filter, amp and connect them
- Create ADSR envelopes (explain how they work, first)
- Add the synth to the instrument relay and create handlers for note and volume
- Create a custom event and handler for the cutoff
- Add note, volume and cutoff events to the sequencer and play them


# Getting Started

## Why Intermix?

There are quite some Javascript audio libraries. Some tend to be all purpose tools, some have a clean focus on game development or audio playback. They all are doing a great job but none of them seem to be suitable for music production.

A music app needs rock-solid timing in the first place. Intermix is designed just for that. It has some other functions but sequencing is the superior goal of everything. So if you are interested in web development and music production, Intermix is for you.

