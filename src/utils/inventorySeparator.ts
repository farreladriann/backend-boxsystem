import { Inventory, InventoryModel } from '../models/Inventory';
import { LoanRequest, LoanRequestModel } from '../models/LoanRequest';
import { DocumentType } from '@typegoose/typegoose';
import createHttpError from 'http-errors';
import { RequestStatus } from '../models/LoanRequest';

export interface inventoryColumn {
  id: string;
  name: string;
  kategori: string;
  kondisi: string;
  kuantitas: number;
  imageUrl: string;
  status: string;
}

export async function inventorySeparator(id: string) {
  const inventory: DocumentType<Inventory> | null =
    await InventoryModel.findOne({ id });
  if (!inventory) throw createHttpError(404, 'Inventory not found');
  const loanRequests: DocumentType<LoanRequest>[] = await LoanRequestModel.find(
    { inventoryId: id },
  );

  const inventoryResponse: inventoryColumn[] = [];

  if (loanRequests.length === 0) {
    inventoryResponse.push({
      id: inventory.id,
      name: inventory.name,
      kategori: inventory.kategori,
      kondisi: 'baik',
      kuantitas: inventory.totalKuantitas,
      imageUrl: inventory.imageUrl || '',
      status: 'Available',
    });
  } else {
    loanRequests.forEach((loanRequest) => {
      inventoryResponse.push({
        id: inventory.id,
        name: inventory.name,
        kategori: inventory.kategori,
        kondisi: loanRequest.isReturned
          ? loanRequest.returnedCondition
          : 'baik',
        kuantitas: loanRequest.kuantitas,
        imageUrl: inventory.imageUrl || '',
        status:
          loanRequest.status === RequestStatus.Delivered
            ? 'Borrowed'
            : 'Available',
      });
    });

    // available, rusak
    // available, baik
    // borrowed, baik

    const editedInventoryResponse: inventoryColumn[] = [];

    for (const eachInventoryResponse of inventoryResponse) {
      if (
        eachInventoryResponse.status === 'Available' &&
        eachInventoryResponse.kondisi === 'baik'
      ) {
        const index = editedInventoryResponse.findIndex(
          (inv) => inv.status === 'Available' && inv.kondisi === 'baik',
        );
        if (index === -1) editedInventoryResponse.push(eachInventoryResponse);
        else
          editedInventoryResponse[index].kuantitas +=
            eachInventoryResponse.kuantitas;
      } else if (
        eachInventoryResponse.status === 'Available' &&
        eachInventoryResponse.kondisi === 'rusak'
      ) {
        const index = editedInventoryResponse.findIndex(
          (inv) => inv.status === 'Available' && inv.kondisi === 'rusak',
        );
        if (index === -1) editedInventoryResponse.push(eachInventoryResponse);
        else
          editedInventoryResponse[index].kuantitas +=
            eachInventoryResponse.kuantitas;
      } else if (
        eachInventoryResponse.status === 'Borrowed' &&
        eachInventoryResponse.kondisi === 'baik'
      ) {
        const index = editedInventoryResponse.findIndex(
          (inv) => inv.status === 'Borrowed' && inv.kondisi === 'baik',
        );
        if (index === -1) editedInventoryResponse.push(eachInventoryResponse);
        else
          editedInventoryResponse[index].kuantitas +=
            eachInventoryResponse.kuantitas;
      }
    }

    const totalKuantitas = inventory.totalKuantitas;
    const totalAvailableRusak =
      editedInventoryResponse.find(
        (inv) => inv.status === 'Available' && inv.kondisi === 'rusak',
      )?.kuantitas || 0;
    const totalBorrowed =
      editedInventoryResponse.find(
        (inv) => inv.status === 'Borrowed' && inv.kondisi === 'baik',
      )?.kuantitas || 0;

    const totalKeduanya = totalAvailableRusak + totalBorrowed;
    const totalAvailableBaik = totalKuantitas - totalKeduanya;

    const availableBaikInventoryColumn = editedInventoryResponse.find(
      (inv) => inv.status === 'Available' && inv.kondisi === 'baik',
    );
    if (availableBaikInventoryColumn)
      availableBaikInventoryColumn.kuantitas = totalAvailableBaik;
    else {
      editedInventoryResponse.push({
        id: inventory.id,
        name: inventory.name,
        kategori: inventory.kategori,
        kondisi: 'baik',
        kuantitas: totalAvailableBaik,
        imageUrl: inventory.imageUrl || '',
        status: 'Available',
      });
    }

    return editedInventoryResponse;
  }

  return inventoryResponse;
}
