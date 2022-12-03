package tree;

import game.MandorlaOperator;
import game.TurnLeftSideOperator;
import game.TurnRightSideOperator;

/**
 * Custom binary tree implementation used by the {@link MandorlaSolver} algorithm.
 * @author Huxi
 *
 * @param <T> type of the {@link #value} field in a node 
 */
public class Node<T> {
	
	/**
	 * Custon object hold by a node.
	 */
	private T value;
	
	/**
	 * Left child node.
	 */
	private Node<T> left;
	
	/**
	 * Right child node.
	 */
	private Node<T> right;
	
	/**
	 * Operator used on the parent to get this node.
	 */
	private MandorlaOperator operator;
	
	/**
	 * Parent node in the tree.
	 */
	private Node<T> parent;
	
	/**
	 * Depth of the node in the tree.
	 */
	private int depth;
	
	/**
	 * Constructor to initialize a new node created from a parent node by an operator at a certain depth. 
	 * @param node
	 * @param op
	 * @param newState
	 * @param depth
	 */
	public Node(Node<T> node, MandorlaOperator op,
			T newState, int depth) {
		parent = node;
		operator = op;
		value = newState;
		this.depth = depth;
	}

	/**
	 * Constructor used to initialize the root node.
	 * @param value
	 */
	public Node(T value) {
		parent = null;
		this.value = value;
		this.depth = 0;
		this.operator = null;
	}

	public T getValue() {
		return value;
	}

	public Node<T> getLeft() {
		return left;
	}

	public void setLeft(Node<T> left) {
		this.left = left;
	}

	public Node<T> getRight() {
		return right;
	}

	public void setRight(Node<T> right) {
		this.right = right;
	}

	public MandorlaOperator getOperator() {
		return operator;
	}

	public void setOperator(MandorlaOperator operator) {
		this.operator = operator;
	}

	public Node<T> getParent() {
		return parent;
	}

	public void setParent(Node<T> parent) {
		this.parent = parent;
	}

	public boolean contains(Node<T> node) {
		if (value.equals(node.getValue()))
			return true;
		if (left != null)
			left.contains(node);
		if (right != null)
			right.contains(node);
		return false;
	}

	public int getDepth() {
		return depth;
	}
	
	/**
	 * Checks if it is reasonable to extend the tree to the left side.
	 * If both the current and it's parent node have been created by the same operator applying it a third time
	 * would result in the same game state that was present in the tree 3 steps earlier.
	 * It's easier to prevent the majority of duplicates to appear in the tree like this in the first place rather
	 * then checking the tree every time we create a new element if it's already in it or not. 
	 * 
	 * @return
	 */
	public boolean shouldApplyLeft() {
		return depth < 2 || !(this.operator instanceof TurnLeftSideOperator && this.parent.getOperator() instanceof TurnLeftSideOperator);
	}

	/**
	 * Checks if it is reasonable to extend the tree to the right side.
	 * If both the current and it's parent node have been created by the same operator applying it a third time
	 * would result in the same game state that was present in the tree 3 steps earlier.
	 * It's easier to prevent the majority of duplicates to appear in the tree like this in the first place rather
	 * then checking the tree every time we create a new element if it's already in it or not. 
	 * 
	 * @return
	 */
	public boolean shouldApplyRight() {		
		return depth < 2 || !(this.operator instanceof TurnRightSideOperator && this.parent.getOperator() instanceof TurnRightSideOperator);
	}
}
