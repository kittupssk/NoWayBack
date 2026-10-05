# NoWayBack: notes for Claude

NoWayBack ("Police & Thief") is a two-player hidden-movement chase game designed by Krishna. The whole game is `index.html` (plain HTML, CSS, SVG and JavaScript, no build step, no dependencies). `sim/sim.js` runs that same game code headlessly for balance testing.

## Core rules (do not change without asking)

- The thief can never re-enter a room it has visited and cannot wait. This no-revisit rule is the game's identity.
- The police may wait. This fixes the even/odd distance problem on a grid of rooms.
- Police signals at the start of each police turn, strongest wins: Hot (thief in a neighbouring room, through a door), Warm (thief was in or next to the police's room one move ago), Faint (2+ moves ago, length set by level), Cold.
- Signal colours follow a heat scale: Hot red, Warm orange, Faint yellow, Cold blue. Every signal also has a written name.
- The thief hears Footsteps when the police are in a neighbouring room.
- Heist mode (default): 3 vaults visible to both sides; the thief needs 2 loot then any exit. Robbing a vault trips a silent alarm (instant, delayed one turn, or off). Police win on timeout.
- Classic mode: the thief wins by surviving until the turn limit.
- The police also win if the thief walks into them or is cornered with no unvisited neighbour.
- Each player has a chess-clock time bank (setting, independent of difficulty). It pauses on the hand-over screen.
- Every game generates a new building: random outline (L, Z, T, U, H, cross, courtyard, long, rambling), random walls via spanning tree plus extra doors, every room reachable. Entrance faces the bottom; exits face the outside, never an enclosed courtyard.

## Difficulty levels (`LEVELS` in index.html)

Difficulty is from the police player's point of view. Balance targets, as the police win rate averaged over the sim's sharp and casual police:

| Level | Target |
|---|---|
| Easy | about 70–80% |
| Normal | about 55–65% |
| Hard | about 40–50% |

After any rule or level change, rerun the simulation and keep the levels clearly ordered with roughly 10+ points between them.

## Testing

- `npm test` plays 30 games per mode, level and police type. It runs in CI on every push and fails if the game throws.
- `npm run sim` plays 400 games per combination for balance numbers (about a minute).
- `ONLY=heist/hard`, `LAYOUT=shape|random|open`, `EXITS=[...]`, `LOOP=0.5` and a fourth JSON-ish argument to override `LEVELS` are documented in README.md.
- The simulation stubs the DOM, so any new browser API used at load time (timers, querySelectorAll, etc.) needs a stub in `sim/sim.js`.
- The computer police in the sim must use only information a real police player has. The computer thief in the game likewise uses only Footsteps, never the police's true position.

## Conventions

- Keep everything in the single `index.html`. Colours are CSS variables in `:root`; the page is a deliberately dark single theme.
- Rendering rebuilds the SVG board and side panel from the state object `S` after every action.
- Hidden information must never leak in pass-and-play: anything shown to one player must be hidden behind the hand-over screen before the other player's turn.
- Write player-facing text plainly, from the player's side of the screen.

## Ideas discussed but not built yet

- Play as the thief against the sharp computer police (its particle-filter logic lives in `sim/sim.js`).
- One-time powers: police Scan row / Sniffer dog / Lock door; thief Hide / Smoke / Sprint.
- Decoy safes (5 safes, 3 real).
- Daily challenge with a shared seed and star scoring.
- Two-device online play (would need a small WebSocket server).
