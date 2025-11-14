import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as addressService from '../services/address.service';

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;

  const address = await addressService.createAddress({
    userId: req.user!.id,
    street,
    city,
    state,
    zipCode,
    country,
    isDefault,
  });

  res.status(201).json({
    success: true,
    message: 'Address created successfully',
    data: address,
  });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.getAddresses(req.user!.id);

  res.json({
    success: true,
    data: addresses,
  });
});

export const getAddressById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const address = await addressService.getAddressById(id, req.user!.id);

  res.json({
    success: true,
    data: address,
  });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const address = await addressService.updateAddress(id, req.user!.id, updateData);

  res.json({
    success: true,
    message: 'Address updated successfully',
    data: address,
  });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await addressService.deleteAddress(id, req.user!.id);

  res.json({
    success: true,
    message: 'Address deleted successfully',
  });
});
