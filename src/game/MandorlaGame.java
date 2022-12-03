package game;

import java.util.Arrays;
import java.util.List;
import java.util.Random;


/**
 * State-space representation of a Mandorla game.
 * 
 * @author Huxi
 *
 */
public class MandorlaGame {

	/**
	 * Enum containing the three colors of the game.
	 * If the first letter of any colors match (Brown,Black) the output
	 * will be a little bit harder to understand.
	 *  
	 */
	public enum Color {
		BLACK, YELLOW, RED;

		public char firstLetter() {
			return this.toString().charAt(0);
		}
	};

	/**
	 * Each position has a {@link MandorlaGame.Color} value associated to it.
	 * Note that the indexing of the array is NOT starting from zero.
	 * 
	 * The current state of the game. Each position has it's own, unique identifier the following way (1-9,A-J):
	 * <pre>
	 *       2   3
	 *    1 F B C G 4
	 *     9   J   A
	 *    8 H D E I 5
	 *       7   6
	 * 	 * 
	 * </pre>
	 */
	private Color[] state;

	/**
	 * Size of the {@link #State} array.
	 */
	private static final int SIZE = 20;

	/**
	 * The position ids of the left hand side, which should all be the same color when the game is solved.
	 */
	private static final List<Integer> LEFT_SIDE = Arrays.asList(1, 2, 15, 9,
			17, 8, 7);
	/**
	 * The position ids of the right hand side, which should all be the same color when the game is solved.
	 */
	private static final List<Integer> RIGHT_SIDE = Arrays.asList(3, 4, 16, 10,
			18, 6, 5);
	/**
	 * The position ids of the middle, which should all be the same color when the game is solved.
	 */
	private static final List<Integer> MIDDLE = Arrays.asList(11, 12, 19, 13,
			14);

	/**
	 * Default constructor, creates a new game instance, which will be in a solved state.
	 */
	public MandorlaGame() {
		state = new Color[SIZE];
		for (Integer index : LEFT_SIDE) {
			state[index] = Color.BLACK;
		}
		for (Integer index : RIGHT_SIDE) {
			state[index] = Color.YELLOW;
		}
		for (Integer index : MIDDLE) {
			state[index] = Color.RED;
		}
	}

	/**
	 * Creates a new game instance with a certain state.
	 * @param state
	 */
	public MandorlaGame(Color[] state) {
		this.state = state;
	}
	
	/**
	 * Randomizes the state of the current game.
	 * @param times to execute a random operator on the game state
	 */
	public void randomize(int times){
		Random rand = new Random();
		for (int i = 0; i < times; i++) {
			if(rand.nextBoolean())
				this.state = new TurnLeftSideOperator().apply(this);
			else
				this.state = new TurnRightSideOperator().apply(this);
		}
	}

	/**
	 * Applies an operator to the current game state, and returnes the new game state as a result.
	 * @param operator
	 * @return
	 */
	public MandorlaGame apply(MandorlaOperator operator) {
		return new MandorlaGame(operator.apply(this));

	}

	/**
	 * Checks if the current game is solved or not.	
	 * @return
	 */
	public boolean isSolved() {
		return isBlackInPlace() && isYellowInPlace() && isRedInPlace();
	}

	private boolean isRedInPlace() {
		return isColorInPlace(Color.RED, MIDDLE);
	}

	private boolean isYellowInPlace() {
		return isLeftSideInPlace(Color.YELLOW)
				|| isRightSideInPlace(Color.YELLOW);
	}

	private boolean isBlackInPlace() {
		return isLeftSideInPlace(Color.BLACK)
				|| isRightSideInPlace(Color.BLACK);
	}

	private boolean isLeftSideInPlace(Color color) {
		return isColorInPlace(color, LEFT_SIDE);
	}

	private boolean isRightSideInPlace(Color color) {
		return isColorInPlace(color, RIGHT_SIDE);
	}

	private boolean isColorInPlace(Color color, List<Integer> side) {
		for (Integer index : side) {
			if (state[index] != color)
				return false;
		}
		return true;
	}

	public Color[] getState() {
		return state;
	}

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder();
		sb.append(System.lineSeparator()).append("   ").append(state[2].firstLetter()).append("   ")
				.append(state[3].firstLetter()).append("\n");
		sb.append(state[1].firstLetter()).append(" ")
				.append(state[15].firstLetter()).append(" ")
				.append(state[11].firstLetter()).append(" ")
				.append(state[12].firstLetter()).append(" ")
				.append(state[16].firstLetter()).append(" ")
				.append(state[10].firstLetter()).append("\n");
		sb.append(" ").append(state[9].firstLetter()).append("   ")
				.append(state[19].firstLetter()).append("   ")
				.append(state[10].firstLetter()).append("\n");
		sb.append(state[8].firstLetter()).append(" ")
				.append(state[17].firstLetter()).append(" ")
				.append(state[13].firstLetter()).append(" ")
				.append(state[14].firstLetter()).append(" ")
				.append(state[18].firstLetter()).append(" ")
				.append(state[5].firstLetter()).append("\n");
		sb.append("   ").append(state[7].firstLetter()).append("   ")
				.append(state[6].firstLetter()).append("\n");

		return sb.toString();
		// return "MandorlaState [state=" + Arrays.toString(state) + "]";
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + Arrays.hashCode(state);
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		MandorlaGame other = (MandorlaGame) obj;
		if (!Arrays.equals(state, other.state))
			return false;
		return true;
	}
	
	
}
