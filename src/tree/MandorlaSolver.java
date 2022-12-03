package tree;

import game.MandorlaGame;
import game.MandorlaOperator;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Custom search algorith which will given a starting {@link MandorlaGame} will
 * find the shortest way to solve it.
 * 
 * @author Huxi
 *
 */
public class MandorlaSolver {

	/**
	 * Starting position.
	 */
	private Node<MandorlaGame> start;

	/**
	 * How deep should we go down the rabbit hole?
	 */
	private int MAX_DEPTH;

	/**
	 * Number of nodes touched by during the search.
	 */
	private int nodeCount;
	
	private int expandedNodeCount;
	// TODO ADD THIS

	/**
	 * Node containing the currently known shortest solution.
	 */
	private Node<MandorlaGame> shortestSolution;

	private final static Logger LOGGER = Logger.getLogger(MandorlaSolver.class
			.getName());

	/**
	 * Thread pool to make the tree expansion bigger.
	 */
	private ExecutorService executor;

	public MandorlaSolver(MandorlaGame game, ExecutorService executor) {
		this(game, executor, 30);
	}

	public MandorlaSolver(MandorlaGame game, ExecutorService executor, int i) {
		start = new Node<MandorlaGame>(game);
		this.executor = executor;
		MAX_DEPTH = i;
	}

	/**
	 * Kicks off the recursive tree expansion, which in the end will find the
	 * shortest answer available.
	 * 
	 * @return
	 */
	public Node<MandorlaGame> solve() {
		LOGGER.log(Level.INFO, "Starting search, check first solution before depth {0}", MAX_DEPTH);
		LOGGER.log(Level.INFO, "Starting position:\n--------------\n{0}\n--------------", start.getValue());

		nodeCount = 0;
		double nodes = Math.pow(2, MAX_DEPTH);
		double sum = 0;
		for (int i = 0; i <= MAX_DEPTH - 2; i++) {
			sum += Math.pow(2, i);
		}
		nodes = nodes - sum - 1;

		LOGGER.log(Level.INFO, "Will check ~{0} nodes at maximum", nodes);

		long startTime = System.nanoTime();

		expand(start, 0);

		long endTime = System.nanoTime();
		long duration = (endTime - startTime) / (1000000);
		LOGGER.log(
				Level.INFO,
				"Finished search in {0} ms, {1}solution found while going through {2} nodes",
				new Object[] { duration,
						(null == shortestSolution ? "no " : ""), nodeCount });
		LOGGER.log(Level.INFO,
				"Execution speed: {0} nodes / ms, % of tree checked: {1}%",
				new Object[] { nodeCount / duration,
						100 * (float) nodeCount / nodes });
		return shortestSolution;
	}

	/**
	 * Recursively expands a node at a certain depth.
	 * 
	 * @param node
	 * @param depth
	 * @return
	 */
	void expand(Node<MandorlaGame> node, int depth) {
		nodeCount++;
		if (0 == (nodeCount % 1000000))
			LOGGER.log(Level.INFO, "Gone through {0} nodes so far", nodeCount);

		LOGGER.log(Level.FINE, "Depth: {0}", depth);
		if (node == null) {
			LOGGER.log(Level.FINE, "Reached leaf");
			return;
		}
		
		if (node.getDepth() > MAX_DEPTH) {
			LOGGER.log(Level.FINE, "Stopping search, max depth reached!");
			return;
		}

		// if we found a solution
		if (node.getValue().isSolved()) {
			LOGGER.log(Level.INFO, "Found solution at {0} depth!", depth);
			// that is the shortest one that we know of at this time
			if (shortestSolution == null
					|| node.getDepth() < shortestSolution.getDepth()) {
				// save this node
				shortestSolution = node;
				// further solutions must be shorter then this one
				MAX_DEPTH = node.getDepth();
			}
			return;
		}
		
//		System.out.println(executor.toString());

		depth = depth + 1;
		MandorlaNodeExpandRunnable leftExpand = new MandorlaNodeExpandRunnable(
				node, depth, MandorlaOperator.Operators.LEFT);
		MandorlaNodeExpandRunnable rightExpand = new MandorlaNodeExpandRunnable(
				node, depth, MandorlaOperator.Operators.RIGHT);
		

		try {
			executor.submit(leftExpand).get();
			executor.submit(new DispatcherThread(node.getRight(), depth));
			executor.submit(rightExpand).get();
		} catch (InterruptedException | ExecutionException e) {			
			// TODO Auto-generated catch block
			e.printStackTrace();
		}


		// 'random walk', otherwise we would be going from the left side
		// of the tree to the right side, this way we are more likely to
		// to find a solution earlier to start cutting down the MAX_DEPTH
		if (depth % 2 == 0) {
			expand(node.getLeft(), depth);
			expand(node.getRight(), depth);
		} else {
			expand(node.getRight(), depth);
			expand(node.getLeft(), depth);
		}

	}
}
