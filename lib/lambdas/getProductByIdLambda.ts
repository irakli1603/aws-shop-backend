export const handler = async (event: any) => {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ProductId is required' }),
    };
  }

  const mockData = [
    {
        description: "Product with attractive price #1 (Nice)",
        id: "1",
        price: 69,
        title: "Product #1"
    },
    {
        description: "Product with comically large price",
        id: "2",
        price: 420,
        title: "Product #2"
    }
 ]

 const product = mockData.find((entry) => entry.id === productId)

 if(!product) {
    return {
        statusCode: 404,
        body: JSON.stringify({ error: `Product with id ${productId} not found!`})
    }

 }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(product),
  };
};