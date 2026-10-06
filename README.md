# Killer Mortal GUI

A browser-based riichi mahjong replay viewer for [Mortal reviews](https://mjai.ekyu.moe), built on [KillerDucky's GUI](https://github.com/killerducky/killer_mortal_gui).

The app loads JSON reports produced by [mjai-reviewer](https://github.com/Equim-chan/mjai-reviewer), reconstructs the game, and displays Mortal's recommendations alongside the player's actual decisions. The main interface is a 3D mahjong table built with JavaScript and WebGL.

## Features

- Replay hands, discards, calls, riichi, dora, and round results.
- Navigate by round, decision, or differences from Mortal's recommendations.
- Compare discard and call options using Mortal's action probabilities.
- Show overall and round letter grades using mjai-reviewer's ratings and the existing S+ through F thresholds.
- Estimate deal-in risk against riichi players using visible tiles and discard patterns. These estimates are heuristics calculated by the GUI.
- Adjust advice visibility, sound volume, and replay speed.

## Code layout

- `new/`: the 3D interface, replay logic, WebGL renderer, and rating calculations.
- Root HTML and JavaScript files: the original 2D viewer and mahjong analysis utilities.
- `standalone/` and `functions/`: the report launcher, local server, and report-fetching proxy.
- `media/`: tile artwork, textures, sounds, and other visual assets.

## Credits

- [Equim-chan](https://github.com/Equim-chan): Mortal, mjai-reviewer, and the online review service.
- [KillerDucky](https://github.com/killerducky/killer_mortal_gui): the original GUI and defensive analysis.
- [FluffyStuff](https://github.com/FluffyStuff/riichi-mahjong-tiles): tile artwork.
- [tensoul](https://github.com/Equim-chan/tensoul) and [mahjong-discord-bot](https://github.com/Euophrys/mahjong-discord-bot): log conversion and mahjong utilities.
- [Tenhou English UI](https://chromewebstore.google.com/detail/tenhou-english-ui/cbomnmkpjmleifejmnjhfnfnpiileiin) and [lz-string](https://github.com/pieroxy/lz-string): translations and compression.
- [The Hopeless Girl on the Path of Houou](https://pathofhouou.blogspot.com/2021/04/guide-replay-analysis.html): games and analysis used to tune defensive heuristics.
