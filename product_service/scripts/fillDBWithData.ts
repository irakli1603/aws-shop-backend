import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

type Product = {
  title: string;
  description: string;
  price: number;
}

type Stock = {
  count: number;
}

const client = new DynamoDBClient({ region: "eu-central-1" });


const testProducts: Product[] = [
  { title: "Product #1", description: "Description of product 1", price: 100 },
  { title: "Product #2", description: "Description of product 2", price: 250 },
  { title: "Product #3", description: "Description of product 3", price: 50 },
  { title: "Product #4", description: "Description of product 4", price: 190 },
  { title: "Product #5", description: "Description of product 5", price: 170 },
];

const testStocks: Stock[] = [
  { count: 1 },
  { count: 20 },
  { count: 17 },
  { count: 8 },
  { count: 0 },
];

const createProduct = async (product: Product): Promise<string | undefined> => {
  const productId = uuidv4();
  const params = {
    TableName: "products",
    Item: {
      "id": { S: productId },
      "title": { S: product.title },
      "description": { S: product.description },
      "price": { N: product.price.toString() },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Inserted product with id: ${productId}`);
    return productId;
  } catch (err) {
    console.error("Error inserting product:", err);
    return undefined;
  }
};

const createStock = async (productId: string, stock: Stock): Promise<void> => {
  const params = {
    TableName: "stocks",
    Item: {
      "product_id": { S: productId },
      "count": { N: stock.count.toString() },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Inserted stock for product id: ${productId}`);
  } catch (err) {
    console.error("Error inserting stock:", err);
  }
};

const main = async (): Promise<void> => {
  console.log('Started filling DynamoDB with mock data...')
  for (let i = 0; i < testProducts.length; i++) {
    const productId = await createProduct(testProducts[i]);
    if (productId) {
      await createStock(productId, testStocks[i]);
    }
  }
};

main()
  .then(() => console.log("Script succesfully completed filling data into the DB."))
  .catch((err) => console.error("Script failed filling DB:", err));