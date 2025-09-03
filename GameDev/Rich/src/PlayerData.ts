export interface PlayerData {
  money: number;
  health: number;
  happiness: number;
  education: number;
  stress: number;
}

export const DefaultPlayerData: PlayerData = {
  money: 1000,
  health: 100,
  happiness: 100,
  education: 0,
  stress: 0,
};
