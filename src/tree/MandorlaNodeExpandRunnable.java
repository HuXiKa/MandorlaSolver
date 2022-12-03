package tree;

import game.MandorlaGame;
import game.MandorlaOperator;
import game.MandorlaOperator.Operators;
import game.TurnLeftSideOperator;
import game.TurnRightSideOperator;

import java.util.concurrent.Callable;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Thread that extends a {@link Node} element by applying the two possible
 * {@link MandorlaOperator}s.
 * 
 * @author Huxi
 *
 */
public class MandorlaNodeExpandRunnable implements Runnable {

	private Node<MandorlaGame> parentNode;
	private int depth;
	private final static Logger LOGGER = Logger
			.getLogger(MandorlaNodeExpandRunnable.class.getName());
	private Operators operator;

	public MandorlaNodeExpandRunnable(Node<MandorlaGame> node, int depth,
			Operators operator) {
		parentNode = node;
		this.depth = depth;
		this.operator = operator;

	}

	@Override
	public void run() {
		LOGGER.log(Level.FINE, "Turning left side");

		if (operator == MandorlaOperator.Operators.LEFT) {

			if (parentNode.shouldApplyLeft()) {
				MandorlaGame leftState = parentNode.getValue().apply(
						new TurnLeftSideOperator());
				Node<MandorlaGame> leftNode = new Node<MandorlaGame>(
						parentNode, new TurnLeftSideOperator(), leftState,
						depth);
				parentNode.setLeft(leftNode);
			}
		} else {
			if (parentNode.shouldApplyRight()) {
				LOGGER.log(Level.FINE, "Turning right side");
				MandorlaGame rightState = parentNode.getValue().apply(
						new TurnRightSideOperator());
				Node<MandorlaGame> rightNode = new Node<MandorlaGame>(
						parentNode, new TurnRightSideOperator(), rightState,
						depth);
				parentNode.setRight(rightNode);
			}
		}

	}
}
