// Mock canvas BEFORE jest environment is created
// This prevents the "Cannot find module '../build/Release/canvas.node'" error
jest.mock('canvas', () => ({}), { virtual: true });
