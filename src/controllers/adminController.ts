import { Request, Response, NextFunction } from 'express';
import { Inventory, InventoryModel } from '../models/Inventory';
import createHttpError from 'http-errors';
import { DocumentType } from '@typegoose/typegoose';
import {
  inventorySeparator,
  inventoryColumn,
} from '../utils/inventorySeparator';

export class AdminController {
  static async createInventory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { name, totalKuantitas, kategori, paymentMethod } = req.body;
      if (!name || !totalKuantitas || !kategori)
        throw createHttpError(400, 'All fields are required');

      const inventory: DocumentType<Inventory> = new InventoryModel({
        name,
        totalKuantitas,
        kategori,
        paymentMethod,
      });

      await inventory.save();
      res.status(201).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async getAllInventory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const inventories: DocumentType<Inventory>[] =
        await InventoryModel.find();
      console.log(inventories);
      const inventoryResponse: inventoryColumn[] = [];
      for (const inventory of inventories) {
        const separatedInventory: inventoryColumn[] = await inventorySeparator(
          inventory.id,
        );
        inventoryResponse.push(...separatedInventory);
      }
      res.status(200).json(inventoryResponse);
    } catch (error) {
      next(error);
    }
  }
}