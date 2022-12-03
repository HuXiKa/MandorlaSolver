package game;

import game.MandorlaGame.Color;

import java.util.Arrays;
import java.util.List;
/**
 * An abstract operator, which can perform it's operation on a Mandorla game instance.
 * @author Huxi
 *
 */
public abstract class MandorlaOperator {
	
	public enum Operators {LEFT, RIGHT};
	
	
	public Color[] apply(MandorlaGame mandorlaState) {
		Color[] state = Arrays.copyOf(mandorlaState.getState(),mandorlaState.getState().length);
		for (Rotation rotation : getRotations()) {
			rotation.applyRotation(state);
		}
		return state;
	}
	
	public abstract List<Rotation> getRotations();
	
}
