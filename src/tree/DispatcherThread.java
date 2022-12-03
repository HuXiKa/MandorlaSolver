package tree;

import game.MandorlaGame;

public class DispatcherThread implements Runnable {

	private Node<MandorlaGame> node;
	private int depth;

	public DispatcherThread(Node<MandorlaGame> node, int depth) {
		this.node = node;
		this.depth = depth;
	}

	@Override
	public void run() {
		// TODO Auto-generated method stub

	}

}
