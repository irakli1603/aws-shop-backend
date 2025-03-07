type Validation = {
  valid: boolean;
  message?: string;
}

export function validateProduct(product: any): Validation {
  if (!product.title || typeof product.title !== "string" || product.title.trim() === "") {
    return { valid: false, message: "Product 'title' is required and cannot be empty." };
  }
  if (typeof product.description !== "string") {
    return { valid: false, message: "Product 'description' must be a string." };
  }
  if (typeof product.price !== "number" || !Number.isInteger(product.price)) {
    return { valid: false, message: "Product 'price' must be an integer." };
  }
  if (typeof product.count !== "number" || !Number.isInteger(product.count)) {
    return { valid: false, message: "Stock 'count' must be an integer." };
  }
  return { valid: true };
}
