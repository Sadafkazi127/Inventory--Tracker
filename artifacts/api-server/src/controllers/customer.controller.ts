import type { Request, Response } from "express";
import { customerBodySchema, updateCustomerBodySchema } from "../schemas/customer.schema";
import * as customerService from "../services/customer.service";

export async function listCustomersHandler(_req: Request, res: Response) {
  res.json(await customerService.listCustomers());
}

export async function getCustomerHandler(req: Request, res: Response) {
  res.json(await customerService.getCustomer(req.params.id));
}

export async function createCustomerHandler(req: Request, res: Response) {
  const input = customerBodySchema.parse(req.body);
  res.status(201).json(await customerService.createCustomer(input));
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const input = updateCustomerBodySchema.parse(req.body);
  res.json(await customerService.updateCustomer(req.params.id, input));
}

export async function deleteCustomerHandler(req: Request, res: Response) {
  await customerService.deleteCustomer(req.params.id);
  res.status(204).send();
}
