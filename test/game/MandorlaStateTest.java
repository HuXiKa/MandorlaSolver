package game;

import static org.junit.Assert.*;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

public class MandorlaStateTest {
	
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
		assertTrue(state.isSolved());
		state.apply(new TurnLeftSideOperator());
		assertTrue(state.isSolved());
		state = state.apply(new TurnLeftSideOperator());
		assertFalse(state.isSolved());
		state = state.apply(new TurnLeftSideOperator());
		state = state.apply(new TurnLeftSideOperator());
		assertTrue(state.isSolved());
	}

}
