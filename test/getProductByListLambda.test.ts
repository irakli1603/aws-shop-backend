import { handler } from '../lib/lambdas/getProductListLambda';

describe('getProductListLambda', () => {
  it('should return a list of products with status code 200', async () => {
    const result = await handler({});

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);


    body.forEach((product: any) => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('description');
    });
  });   
});