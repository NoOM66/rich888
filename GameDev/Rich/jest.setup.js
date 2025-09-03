jest.mock('phaser', () => ({
  Events: {
    EventEmitter: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    })),
  },
  Math: {
    Clamp: jest.fn((value, min, max) => Math.max(min, Math.min(value, max))),
  },
}));