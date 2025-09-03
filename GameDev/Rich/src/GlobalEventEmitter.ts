import Phaser from 'phaser';

class GlobalEventEmitter extends Phaser.Events.EventEmitter {
  private static _instance: GlobalEventEmitter;

  public static get instance(): GlobalEventEmitter {
    if (!GlobalEventEmitter._instance) {
      GlobalEventEmitter._instance = new GlobalEventEmitter();
    }
    return GlobalEventEmitter._instance;
  }

  private constructor() {
    super();
    console.log('GlobalEventEmitter initialized.');
  }
}

export { GlobalEventEmitter };
