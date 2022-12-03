package game;

import java.util.ArrayList;
import java.util.List;

/**
 * Operator representing a single downward left turn in the game.
 * @author Huxi
 *
 */
public class TurnLeftSideOperator extends MandorlaOperator {
	
	/**
	 * List of the transformations for each piece inside the left circle.
	 */
	@SuppressWarnings("serial")
	private static final List<Rotation> rotations = new ArrayList<Rotation>() {{
		add(new Rotation(1, 12, 7));
		add(new Rotation(2, 14, 8));
		add(new Rotation(15, 19, 17));
		add(new Rotation(9, 11, 13));
	}};
	

	public String toString(){
		return "Left";
	}
	
	@Override
	public List<Rotation> getRotations() {
		return rotations;
	}
}
