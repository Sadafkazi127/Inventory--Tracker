import type { Request, Response } from "express";
import { productBodySchema, updateProductBodySchema, categoryBodySchema } from "../schemas/product.schema";
import * as productService from "../services/product.service";

export async function listProductsHandler(_req: Request, res: Response) {
  res.json(await productService.listProducts());
}

export async function getProductHandler(req: Request, res: Response) {
  res.json(await productService.getProduct(req.params.id));
}

export async function createProductHandler(req: Request, res: Response) {
  const input = productBodySchema.parse(req.body);
  res.status(201).json(await productService.createProduct(input));
}

export async function updateProductHandler(req: Request, res: Response) {
  const input = updateProductBodySchema.parse(req.body);
  res.json(await productService.updateProduct(req.params.id, input));
}

export async function deleteProductHandler(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
}

export async function listCategoriesHandler(_req: Request, res: Response) {
  res.json(await productService.listCategories());
}

export async function createCategoryHandler(req: Request, res: Response) {
  const { name } = categoryBodySchema.parse(req.body);
  res.status(201).json(await productService.createCategory(name));
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  await productService.deleteCategory(req.params.id);
  res.status(204).send();
}
