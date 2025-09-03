import { SimpleEventEmitter } from './TurnManager';

export type GameState = 'init' | 'playing' | 'paused' | 'ended';

export class GameManager {
  public state: GameState = 'init';
  public events = new SimpleEventEmitter();

  setState(newState: GameState) {
    this.state = newState;
    this.events.emit('state-changed', newState);
  }
}

export default new GameManager();
