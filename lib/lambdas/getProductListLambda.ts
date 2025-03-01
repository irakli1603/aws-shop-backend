import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({region: 'eu-central-1'});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    console.log('Incoming event', event);
  const productTable = process.env.PRODUCT_TABLE!;
  const stocksTable = process.env.STOCKS_TABLE!;

  try {
    const productsData = await documentClient.send(
      new ScanCommand({ TableName: productTable })
    );
    const products = productsData.Items || [];

    if (products.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify([]),
      };
    }

    const productIds = products.map((p: any) => p.id);

    // Prepare the BatchGet request for the stocks table.
    const batchGetParams = {
      RequestItems: {
        [stocksTable]: {
          Keys: productIds.map((id: string) => ({ product_id: id })),
        },
      },
    };

    const stocksData = await documentClient.send(new BatchGetCommand(batchGetParams));
    const stocks = stocksData.Responses ? stocksData.Responses[stocksTable] : [];

    const stockMap = new Map<string, number>();
    stocks.forEach((stock: any) => {
      stockMap.set(stock.product_id, stock.count);
    });

    const joinedProducts = products.map((product: any) => ({
      ...product,
      count: stockMap.get(product.id) || 0,
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(joinedProducts),
    };
  } catch (error) {
    console.error("Error retrieving products:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Error retrieving products", error }),
    };
  }
};