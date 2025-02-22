import { handler } from '../lib/lambdas/getProductByIdLambda';

describe('getProductsByIdLambda', () => {
  it('should return product with id "2" and status code 200', async () => {
    const event = {
      pathParameters: { productId: "2" }
    };

    const result = await handler(event);
    const product = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(product.id).toBe("2");
  });

  it('should return 404 for a non-existing productId', async () => {
    const event = {
      pathParameters: { productId: "0" }
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(404);
    expect(response).toHaveProperty('error');
  });

  it('should return 400 if productId is missing', async () => {
    const event = {};

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    expect(response).toHaveProperty('error');
  });
});
