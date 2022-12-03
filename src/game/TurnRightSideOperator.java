package game;

import java.util.ArrayList;
import java.util.List;

/**
 * Operator representing a single downward right turn in the game.
 * @author Huxi
 *
 */
public class TurnRightSideOperator extends MandorlaOperator {
	
	/**
	 * List of the transformations for each piece inside the right circle.
	 */
	@SuppressWarnings("serial")
	private static final List<Rotation> rotations = new ArrayList<Rotation>() {{
		add(new Rotation(4, 11, 6));
		add(new Rotation(3, 13, 5));
		add(new Rotation(16, 19, 18));
		add(new Rotation(10, 12, 14));
	}};
	
	public String toString(){
		return "Right";
	}

	@Override
	public List<Rotation> getRotations() {
		return rotations;
	}

}
