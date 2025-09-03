import GameManager, { EventEmitterLike } from './GameManager';

export interface SceneLike {
  events?: {
    on: (...args: unknown[]) => void;
    off: (...args: unknown[]) => void;
    emit: (...args: unknown[]) => void;
  };
}

/**
 * Adapter to initialize GameManager with a Phaser Scene.
 * Use this in a scene's `create()` or boot pipeline: `initGameManagerWithScene(this)`.
 */
export function initGameManagerWithScene(scene?: SceneLike): GameManager {
  if (!scene || !scene.events || typeof scene.events.on !== 'function') {
    // Fallback to default init if scene doesn't expose events
    return GameManager.init();
  }

  return GameManager.init(scene.events as EventEmitterLike);
}
