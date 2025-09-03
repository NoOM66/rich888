import { test, expect } from '@playwright/test';

test.describe('Game State Machine', () => {
  test('should change game state on click', async ({ page }) => {
    await page.goto('http://localhost:8080/');

    // Function to get the current game state from the browser context
    const getGameState = async () => {
      return await page.evaluate(() => {
        // @ts-ignore - GameManager is globally accessible in the browser context
        return window.GameManager.instance.CurrentState;
      });
    };

    // Wait for the game to load and initial state to be MainMenu
    await expect(getGameState()).resolves.toBe(0); // GameState.MainMenu is 0

    // Click 1: MainMenu -> GamePlaying
    await page.locator('canvas').click();
    await expect(getGameState()).resolves.toBe(1); // GameState.GamePlaying is 1

    // Click 2: GamePlaying -> Paused
    await page.locator('canvas').click();
    await expect(getGameState()).resolves.toBe(2); // GameState.Paused is 2

    // Click 3: Paused -> GameOver
    await page.locator('canvas').click();
    await expect(getGameState()).resolves.toBe(3); // GameState.GameOver is 3

    // Click 4: GameOver -> MainMenu
    await page.locator('canvas').click();
    await expect(getGameState()).resolves.toBe(0); // GameState.MainMenu is 0
  });
});
