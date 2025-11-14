import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
  body: z.object({
    street: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    zipCode: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const deleteAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
});

export const getAddressByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
});
