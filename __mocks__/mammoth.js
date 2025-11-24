// Mock for mammoth
module.exports = {
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Mock Word document content'
  })
}
