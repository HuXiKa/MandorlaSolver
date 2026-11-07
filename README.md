Automatic solver for the logical game [Mandorla](https://www.life.hu/kultura/20131129-vilagszenzacio-uj-magyar-talalmany-a-keszsegfejleszto-mandorla.html)

It is not a fancy, smart solver - it brute forces all possible moves with some 'smart' tree pruning and node extensions to find the shortest available solution.

The representation can be seen in [MandorlaGame](src/game/MandorlaGame.java), which can be fed in as an input to [Main](src/src/Main.java)

## Browser app

The repository root contains a static browser-based board editor and solver. It uses plain HTML, CSS, JavaScript, and Three.js for the 3D board; no build step is required. Three.js is loaded from jsDelivr, so the browser needs network access when the page loads. The in-browser solver finds the shortest route up to 25 turns, and the move list can be used to step through the resulting boards.

To preview it locally, run this from the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.