package game;

import game.MandorlaGame.Color;

import java.util.ArrayList;
import java.util.List;

/**
 * A ternary element representing the transformation needed to be done on a single piece in the game.
 * @author Huxi
 *
 */
public class Rotation {

	/**
	 * List of indexes that needs to be shifted.
	 */
	private List<Integer> indexes = new ArrayList<Integer>(3);
	
	
	public Rotation(Integer first, Integer second, Integer third){
		indexes.add(first);
		indexes.add(second);
		indexes.add(third);
	}

	/**
	 * Replaces the necessary elements in the game state.
	 * @param state to be changed
	 */
	public void applyRotation(Color[] state){
		Color tmp = state[indexes.get(0)];
		state[indexes.get(0)] = state[indexes.get(2)];
		state[indexes.get(2)] = state[indexes.get(1)];
		state[indexes.get(1)] = tmp;
	}
}
