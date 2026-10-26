# Crab-bot Simulator

A virtual Sally Lightfoot style crab robot in the browser: six walking legs, two claw arms, physics, rough terrain, a ramp, a basket, a soccer ball and a plain-language command bar. It runs as a single page (`index.html`) using Three.js and JSZip from cdnjs.

## Video
https://youtu.be/k0j4E7ZPR8w

## Demo
Try it live: https://geoffreyebrennan.github.io/crab-bot-simulator/

## Run it

Open `index.html` in a browser, or publish it with GitHub Pages (Settings, Pages, deploy from the `main` branch, `/ (root)`). The page needs internet access to load the two libraries.

## Controls

W/S or Up/Down move, A/D strafe, Q/E or Left/Right turn, Space jump, C crouch, T/G pitch, U/J roll, Y/H yaw, R reset. Drag to orbit, wheel to zoom.

## Command bar

Type plain-language instructions, for example:

- `move 12 cm forward, then jump`
- `go to the red pillar`
- `go to the pink ball and pick it up with your right claw`
- `put it in the basket`
- `dribble the soccer ball to the yellow pillar`
- `push the ball 60 cm left`
- `lean left 10 degrees`

Outside Claude the built-in parser handles the commands.

## STL export

The Export STL button downloads `hexapod_parts.zip` with printable proportion parts in millimetres.

## Tests

The scripts in `tests/` run the page logic headlessly with Node (`npm install three jszip playwright`, then for example `node tests/dribble_tests.js`). They expect the page at `/mnt/user-data/outputs/hexapod.html` unless you pass `--html index.html`.

## Licence

MIT, see `LICENSE`.
