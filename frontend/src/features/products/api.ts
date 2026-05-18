import { api } from '@/lib/api';
import type {
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from '@/types/product';
import type { Paginated } from '@/types/api';

export async function listProducts(query: ProductListQuery = {}): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>('/products', { params: query });
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await api.post<Product>('/products', input);
  return data;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${id}`, input);
  return data;
}

export async function archiveProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}
