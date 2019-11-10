
export const mockOnmessage = jest.fn();
export const mockPostMessage = jest.fn();

const mock = jest.fn().mockImplementation(() => {
    return {
        onmessage: mockOnmessage,
        postMessage: mockPostMessage,
    };
});

export default mock;
