# Killer Mortal GUI functionality inventory

This is the parity checklist for rebuilding the GUI. It documents user-visible behavior in the current implementation (`index.html`, `index.js`, `efficiency.js`, and `shanten.js`) as of 22 June 2026.

## Data loading and review preparation

- Loads a review from the required `?data=<file-or-url>` query parameter and reports an invalid or failed URL.
- Accepts deep-link parameters: `hand`, `ply`, `showMortal`, and the developer-only `alphaTestMode`.
- Parses MJAI logs into rounds and events, converts Mortal and Tenhou tile encodings, merges Mortal evaluations into matching game events, and calculates normalized action probabilities.
- Reconstructs complete game state at any event: hands, draws, discards, calls, riichi, dora, tiles remaining, scores, honba, riichi sticks, round result, and score changes.
- Handles chi, pon, daiminkan, ankan, kakan, riichi, tsumo, discard, win, and exhaustive-draw events, including called/rotated tiles and added dora.
- Calculates shanten, ukeire, and defensive danger estimates used by the analysis UI.

## Table and game-state display

- Shows all four seats relative to the reviewed player, with seat wind and live score.
- Shows concealed hands, drawn tiles, open calls/kans, rotated call tiles, hidden opponent tiles, and revealed winning hands.
- Shows each discard pond, including tsumogiri styling, rotated riichi discards, called-discard fading, and the latest-discard marker.
- Shows the current round, honba/riichi sticks, tiles remaining, and up to five dora indicators (with unrevealed indicators face-down).
- Shows end-of-round result details automatically: tsumo/ron/draw, translated yaku, and each player's score change.
- Highlights the tile/action actually chosen by the player.

## Mortal action analysis

- Shows the player's actual action beside Mortal's preferred action.
- Lists every evaluated action with its Q value and probability.
- Draws Mortal probability bars above discard candidates.
- Draws probability bars for non-discard actions such as calls, riichi, or win, with the mascot panel.
- Can hide/show all Mortal advice; clicking the discard probability chart also toggles it.
- Detects agreement and mismatches between the player and Mortal.
- Supports an adjustable error threshold used when navigating decisions/errors.

## Defensive analysis

- Optional deal-in-rate mode estimates risk against riichi players from visible/unseen tiles, genbutsu, wait shapes, discard patterns, dora, red fives, suji, matagi-suji, ura-suji, and riichi suji traps.
- Draws opponent-coloured danger bars for each possible hero discard.
- Clicking the danger chart opens detailed danger analysis for the current state.
- Detailed view breaks a tile's danger down by wait type, candidate waits, remaining copies, and estimated share.
- Summary view compares pushers, discard tiles, tenpai opponents, per-opponent risk, and combined risk.
- Keyboard shortcuts open the danger summary (`A`) and detail (`Z`) when the feature is enabled.

## Navigation

- Previous/next event.
- Previous/next reviewed decision (“choice”).
- Previous/next mismatch above the configured error threshold.
- Previous/next round with wraparound.
- Clicking a row in the all-round results table jumps to that round.
- Mouse wheel moves one event backward/forward when no blocking modal is open.
- URL bookmarking writes the current `hand`, `ply`, and `showMortal` state to the address bar (`B`).

### Keyboard map

| Key | Action |
| --- | --- |
| `Left` / `Right` | Previous / next reviewed decision |
| `Down` / `Up` | Previous / next AI decision diff |
| `PageUp` or `,` | Previous mismatch |
| `PageDown` or `.` | Next mismatch |
| `Home` or `[` | Start of round; previous round if already at start |
| `End` or `]` | End of round; next round if already at end |
| `H` | Toggle hidden opponent hands |
| `M` | Toggle Mortal advice |
| `D` | Toggle deal-in-rate analysis |
| `E` | Cycle the error threshold |
| `A` | Open danger summary |
| `Z` | Open danger detail |
| `B` | Bookmark the current position in the URL |
| `?` | Open About |

Typing a normal character, Escape, Space, Enter, or Backspace closes an open modal before performing any other shortcut.

## Round and match summaries

- Clicking the centre round button opens a match-wide table.
- The table shows every round's starting scores, riichi-stick pot, score changes, and final scores.
- Large and medium losses are visually flagged; styling hooks also exist for medium and large wins.
- About shows engine name, model tag, reviewer version, game length, loading/review time, temperature, match count/percentage, and rating.

## Options and persistence

- Language selector: English, Simplified Chinese, Korean, Japanese, and Russian; all dynamic labels, actions, positions, results, and yaku use i18next translations.
- Toggle visibility of opponent hands (also available by clicking any opponent hand).
- Toggle Mortal advice.
- Toggle estimated deal-in rates.
- Cycle the mismatch/error threshold.
- Persists language, deal-in-rate visibility, and error threshold in `localStorage`.

## Responsive and interaction behavior

- Scales the table and tiles for small screens and recalculates scale when device orientation changes.
- Switches to a vertically stacked layout in portrait/coarse-pointer contexts and hides the detailed option table on coarse pointers.
- Dialogs close from their close button, by clicking their surrounding dialog in supported cases, or through keyboard/wheel behavior.
- Hover states identify interactive controls and table rows.

## Developer/debug facilities

- Exposes `window.MM` with `main`, global state (`GS`), and `debugState()` for browser-console inspection.
- Includes internal danger and discard-overflow test helpers.
