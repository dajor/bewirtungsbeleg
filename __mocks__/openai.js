const mockCreate = jest.fn();

class OpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: mockCreate
      }
    };
  }
}

// Support both CommonJS and ES module imports
OpenAI.mockCreate = mockCreate;
module.exports = OpenAI;
module.exports.default = OpenAI;
module.exports.__esModule = true;