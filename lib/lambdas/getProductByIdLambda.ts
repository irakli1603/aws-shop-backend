import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-central-1" });
const DBDocumentClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  console.log('Incoming event', event);
  const productId = event.pathParameters?.productId;
  const productTable = process.env.PRODUCT_TABLE!;
  const stocksTable = process.env.STOCKS_TABLE!;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "ProductId is required." }),
    };
  }

  const productParams = {
    TableName: productTable,
    Key: { id: productId },
  };

  try {
    const productData = await DBDocumentClient.send(
      new GetCommand(productParams)
    );
    if (!productData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Product with id ${productId} is not found.`,
        }),
      };
    }

    const stockParams = {
      TableName: stocksTable,
      Key: { product_id: productId },
    };
    const stockData = await DBDocumentClient.send(new GetCommand(stockParams));

    const combinedData = {
      ...productData.Item,
      count: stockData.Item?.count,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(combinedData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
