# Police & Thief

A two-player hidden-movement chase game played across a building of connected rooms. The thief moves in secret; the police read heat signals to track it down.

Everything is plain HTML, CSS, SVG and JavaScript in a single file. There is no build step and no dependencies.

## Play

Open `index.html` in any modern browser. You can also enable GitHub Pages on this repository to play it from a link.

Modes:

- **Heist** (default): the thief must grab 2 of 3 loot and leave through an exit before the turns run out.
- **Classic hide**: the thief wins by staying free until the turns run out.
- **Two players, one device** (pass and play) or **police vs computer thief**.

## Rules

1. The thief picks a starting room while the police look away. It can't be the entrance, an exit or a vault.
2. The police start at the entrance. Each turn they move through a door to a neighbouring room, or wait.
3. After each police turn, the thief moves to a neighbouring room it has never visited. The thief can't wait.
4. The police win by entering the thief's room, if the thief walks into them, if the thief is cornered, or (Heist) if time runs out.

### Signals for the police

| Signal | Meaning |
|---|---|
| Hot | The thief is in a room next to you right now |
| Warm | The thief was in or next to your room one move ago |
| Faint | The thief passed in or next to your room a few moves ago (2–4 Easy, 2–3 Normal, off on Hard) |
| Cold | No sign of the thief |

The thief hears **Footsteps** when the police are in a room next door.

Robbing a vault trips a **silent alarm**: instant on Easy and Normal, one turn late on Hard.

### Difficulty

| | Easy | Normal | Hard |
|---|---|---|---|
| Rooms | about 25 | about 25 | about 36 |
| Heist / Classic turns | 14 / 12 | 14 / 10 | 14 / 11 |
| Exits | 2, close together | 2, far apart | 3, spread out |
| Alarms | Instant | Instant | One turn late |
| Faint trail | 2–4 moves | 2–3 moves | Off |
| Walls | Fewer doors | Medium | Mostly open |
| Computer thief | Careless | Careful | Cunning |

### Other features

- A new building every game: random outline (L, Z, T, U, H, cross, courtyard, long, rambling), random walls, every room reachable.
- Chess-clock time banks per player (off, 1, 2, 3 or 5 minutes).
- Room marking for the police (✕ ruled out, ? suspect).

## Balance simulation

`sim/sim.js` runs the real game code headlessly and pits two computer police players against the computer thief:

- **Sharp police** tracks every possible thief route that fits the clues (an expert player).
- **Casual police** reacts only to the latest signal (a newcomer).

Requires Node.js 18 or later.

```
npm run sim              # 400 games per combination, about a minute
node sim/sim.js index.html 100
```

Environment variables:

| Variable | Effect |
|---|---|
| `ONLY=heist/normal` | Run only matching mode/level combinations |
| `LAYOUT=shape\|random\|open` | Building type (default `shape`) |
| `EXITS=[0,4]` | Force exit rooms by index |
| `LOOP=0.5` | Override the share of extra doors |

A fourth argument overrides level settings, for example:

```
node sim/sim.js index.html 300 "{hard:{name:'Hard',size:6,turns:{heist:16,classic:10},alarms:'delayed',faint:[],ai:'hard',exits:'three',loop:0.85}}"
```

Output reports the police win rate, the average turn the game ended, and how games ended (`caught`, `walked`, `cornered`, `heist`, `escaped`, `timeout`).

Because the simulation runs the real game code, it doubles as a regression check: CI runs a short simulation on every push and fails if the game throws.

## Project structure

```
index.html                  the whole game
sim/sim.js                  headless balance simulation
.github/workflows/sim.yml   CI smoke test
```
