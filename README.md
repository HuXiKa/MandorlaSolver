Automatic solver for the logical game [Mandorla](https://www.life.hu/kultura/20131129-vilagszenzacio-uj-magyar-talalmany-a-keszsegfejleszto-mandorla.html)

It is not a fancy, smart solver - it brute forces all possible moves with some 'smart' tree pruning and node extensions to find the shortest available solution.

The representation can be seen in [MandorlaGame](src/game/MandorlaGame.java), which can be fed in as an input to [Main](src/src/Main.java)