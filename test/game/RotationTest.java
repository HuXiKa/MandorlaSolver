package game;

import static org.junit.Assert.*;
import game.MandorlaGame.Color;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class RotationTest {
	
	MandorlaGame state;

	@Before
	public void setUp() throws Exception {
		state = new MandorlaGame();
	}

	@After
	public void tearDown() throws Exception {
	}

	@Test
	public void test() {
		Rotation rotation = new Rotation(15, 19, 17);
		assertTrue(state.getState()[15] == Color.BLACK);
		assertTrue(state.getState()[19] == Color.RED);
		assertTrue(state.getState()[17] == Color.BLACK);
		rotation.applyRotation(state.getState());
		assertTrue(state.getState()[15] == Color.BLACK);
		assertTrue(state.getState()[19] == Color.BLACK);
		assertTrue(state.getState()[17] == Color.RED);		
	}

}
