import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

interface CreateAddressInput {
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface UpdateAddressInput {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
}

export const createAddress = async (input: CreateAddressInput) => {
  const { userId, isDefault, ...addressData } = input;

  // If setting as default, unset other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      ...addressData,
      isDefault: isDefault ?? false,
    },
  });

  return address;
};

export const getAddresses = async (userId: string) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  });

  return addresses;
};

export const getAddressById = async (addressId: string, userId: string) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
  }

  if (address.userId !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  return address;
};

export const updateAddress = async (
  addressId: string,
  userId: string,
  input: UpdateAddressInput
) => {
  // Verify ownership
  await getAddressById(addressId, userId);

  const { isDefault, ...updateData } = input;

  // If setting as default, unset other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data: {
      ...updateData,
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  return address;
};

export const deleteAddress = async (addressId: string, userId: string) => {
  // Verify ownership
  await getAddressById(addressId, userId);

  await prisma.address.delete({
    where: { id: addressId },
  });
};
