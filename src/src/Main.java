package src;

import game.MandorlaOperator;
import game.MandorlaGame;
import game.MandorlaGame.Color;
import game.TurnLeftSideOperator;
import game.TurnRightSideOperator;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import tree.MandorlaSolver;
import tree.Node;

public class Main {

	private final static Logger LOGGER = Logger.getLogger(Main.class.getName());

	public static void main(String[] args) {
		/*Logger.getGlobal().setLevel(Level.INFO);
		MandorlaGame game = new MandorlaGame();
		LOGGER.info(game.toString());
		game = game.apply(new TurnRightSideOperator());
		LOGGER.info(game.toString());
		game = game.apply(new TurnRightSideOperator());

		ExecutorService executor = Executors.newFixedThreadPool(6);

		MandorlaSolver solver = new MandorlaSolver(game, executor);
		Node<MandorlaGame> solution = solver.solve();
		printSolution(solution);

		executor.shutdown();*/

		//randomSolve();

		Color[] state = new Color[] { null,
				Color.YELLOW,	// 1
				Color.YELLOW,	// 2
				Color.BLACK,	// 3
				Color.YELLOW,	// 4
				Color.RED,		// 5
				Color.BLACK,	// 6
				Color.RED,		// 7
				Color.BLACK,	// 8
				Color.BLACK,	// 9
				Color.YELLOW,	// A
				Color.BLACK,	// B
				Color.RED,		// C
				Color.RED,		// D
				Color.YELLOW,	// E
				Color.RED,		// F
				Color.YELLOW,	// G
				Color.YELLOW,	// H
				Color.BLACK,	// I
				Color.BLACK};	// J

		MandorlaGame game = new MandorlaGame(state);
		
		int depth = 25;

		ExecutorService executor = Executors.newFixedThreadPool(6);
		MandorlaSolver solver = new MandorlaSolver(game, executor, depth);
		Node<MandorlaGame> solution = solver.solve();
		printSolution(solution);

		executor.shutdown();
	}

	private static void randomSolve() {
		MandorlaGame game = new MandorlaGame();
		game.randomize(3);
		
		ExecutorService executor = Executors.newFixedThreadPool(6);
		MandorlaSolver solver = new MandorlaSolver(game, executor);
		Node<MandorlaGame> solution = solver.solve();
		printSolution(solution);

		executor.shutdown();
		
	}

	private static void printSolution(Node<MandorlaGame> solution) {
		if (solution == null) {
			LOGGER.log(Level.WARNING, "No solution found!");
			return;
		}
		Node<MandorlaGame> node = solution;
		List<MandorlaOperator> list = new LinkedList<MandorlaOperator>();
		while (node.getParent() != null) {
			list.add(node.getOperator());
			node = node.getParent();
		}
		LOGGER.log(Level.INFO, "Found {0} step long solution", list.size());
		Collections.reverse(list);
		int i = 1;
		StringBuilder sb = new StringBuilder();
		for (MandorlaOperator mandorlaOperator : list) {
			sb.append("[").append(i++).append(".] : ").append(mandorlaOperator).append("\t");
			if ((i-1) % 4 == 0)
				sb.append("\n");
		}
		sb.append("[").append(i++).append(".] : Solved");
		
		System.out.println(sb.toString());

	}

}
