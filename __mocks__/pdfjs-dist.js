// Mock for pdfjs-dist
module.exports = {
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'Mock PDF content' }]
        })
      })
    })
  })
}
