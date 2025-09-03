import { GameSaveData } from './GameSaveData';
import { PlayerStatsController } from './PlayerStatsController';
import { TurnManager } from './TurnManager';
import { DefaultPlayerData } from './PlayerData';

class SaveLoadManager {
  private static _instance: SaveLoadManager;
  private readonly SAVE_KEY: string = 'rich888_game_save';

  public static get instance(): SaveLoadManager {
    if (!SaveLoadManager._instance) {
      SaveLoadManager._instance = new SaveLoadManager();
    }
    return SaveLoadManager._instance;
  }

  private constructor() {
    console.log('SaveLoadManager initialized.');
  }

  public saveGame(): void {
    const playerData = PlayerStatsController.instance.getPlayerData();
    const currentWeek = TurnManager.instance.currentWeek;

    const gameSaveData: GameSaveData = {
      playerData,
      currentWeek,
    };

    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(gameSaveData));
      console.log('Game saved successfully!', gameSaveData);
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  public loadGame(): GameSaveData | null {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (savedData) {
        const gameSaveData: GameSaveData = JSON.parse(savedData);
        // Load data into respective managers
        PlayerStatsController.instance.loadPlayerData(gameSaveData.playerData);
        TurnManager.instance.currentWeek = gameSaveData.currentWeek;
        TurnManager.instance.timeBudget = TurnManager.instance['DEFAULT_WEEKLY_BUDGET']; // Reset budget on load
        console.log('Game loaded successfully!', gameSaveData);
        return gameSaveData;
      }
    } catch (e) {
      console.error('Failed to load game:', e);
      // Clear corrupted save data
      localStorage.removeItem(this.SAVE_KEY);
    }
    console.log('No saved game found or failed to parse.');
    return null;
  }

  public hasSaveData(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  public clearSaveData(): void {
    localStorage.removeItem(this.SAVE_KEY);
    console.log('Save data cleared.');
  }
}

export { SaveLoadManager };
