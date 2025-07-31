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

// Add APIError class
class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

OpenAI.APIError = APIError;

// Support both CommonJS and ES module imports
OpenAI.mockCreate = mockCreate;
module.exports = OpenAI;
module.exports.default = OpenAI;
module.exports.APIError = APIError;
module.exports.__esModule = true;