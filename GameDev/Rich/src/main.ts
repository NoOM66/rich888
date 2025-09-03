// Example bootstrap that demonstrates how to initialize GameManager in a Phaser app.
// This file is illustrative and does not include a full Phaser build setup.
import GameManager from './GameManager';
import { initGameManagerWithScene } from './adapter';

// Dynamically import Phaser so the bundler places it in a separate vendor chunk.
(async () => {
  const PhaserModule = await import('phaser');
  const Phaser = (PhaserModule as any).default ?? PhaserModule;

  class BootScene extends (Phaser as any).Scene {
    constructor() {
      super({ key: 'BootScene' });
    }

    create() {
      // Initialize GameManager with Phaser's events emitter
      initGameManagerWithScene(this as any);

      const gm = GameManager.instance;
      const text = (this as any).add.text(10, 10, `State: ${gm.currentState}`, { color: '#ffffff' });

      gm.onStateChanged((s) => text.setText(`State: ${s}`));

      // Keyboard controls: S=start, P=pause, E=end, M=menu
      (this as any).input.keyboard.on('keydown', (ev: KeyboardEvent) => {
        switch (ev.key.toUpperCase()) {
          case 'S':
            gm.startNewGame();
            break;
          case 'P':
            gm.pauseGame();
            break;
          case 'E':
            gm.endGame();
            break;
          case 'M':
            gm.goToMainMenu();
            break;
        }
      });
    }
  }

  const config = {
    type: (Phaser as any).AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: [BootScene],
  } as any;

  new (Phaser as any).Game(config);
})();

export {};
