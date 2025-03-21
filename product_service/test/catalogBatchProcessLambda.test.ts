import { handler } from "../lib/lambdas/catalogBatchProcessLambda";
import { TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

jest.mock("/opt/nodejs/uuid-utils", () => ({
  v4: jest.fn(() => "test-uuid"),
}));


const mockSend = jest.fn();


jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend,
      })),
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.PRODUCT_TABLE = "test-products";
  process.env.STOCKS_TABLE = "test-stocks";
});

describe("Lambda handler", () => {
  it("should process a valid event with count provided", async () => {
    mockSend.mockResolvedValueOnce({});
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test product",
            description: "Test description",
            price: "20",
            count: "3",
          }),
        },
      ],
    };


    await handler(event);


    expect(mockSend).toHaveBeenCalledTimes(1);
    const commandArg = mockSend.mock.calls[0][0];
    expect(commandArg).toBeInstanceOf(TransactWriteItemsCommand);
    expect(commandArg.input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: "test-products",
            Item: marshall({
              id: "test-uuid",
              title: "Test product",
              description: "Test description",
              price: 20,
            }),
          },
        },
        {
          Put: {
            TableName: "test-stocks",
            Item: marshall({
              product_id: "test-uuid",
              count: 3,
            }),
          },
        },
      ],
    });
  });

  it("should default count to 0 when not provided", async () => {
    // Arrange: simulate successful DynamoDB operation
    mockSend.mockResolvedValueOnce({});
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test product 2",
            description: "Test description 2",
            price: "30",
          }),
        },
      ],
    };


    await handler(event);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const commandArg = mockSend.mock.calls[0][0];
    expect(commandArg.input).toEqual({
      TransactItems: [
        {
          Put: {
            TableName: "test-products",
            Item: marshall({
              id: "test-uuid",
              title: "Test product 2",
              description: "Test description 2",
              price: 30,
            }),
          },
        },
        {
          Put: {
            TableName: "test-stocks",
            Item: marshall({
              product_id: "test-uuid",
              count: 0,
            }),
          },
        },
      ],
    });
  });

  it("should handle errors during the DynamoDB operation", async () => {
    const error = new Error("DynamoDB error");
    mockSend.mockRejectedValueOnce(error);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test product",
            description: "Test description",
            price: "20",
            count: "3",
          }),
        },
      ],
    };

    await handler(event);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
