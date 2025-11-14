import { Router } from 'express';
import * as addressController from '../controllers/address.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
  getAddressByIdSchema,
} from '../validators/address.schema';

const router = Router();

// All address routes require authentication
router.use(authenticate);

// Create address
router.post('/', validate(createAddressSchema), addressController.createAddress);

// Get all addresses for current user
router.get('/', addressController.getAddresses);

// Get address by ID
router.get('/:id', validate(getAddressByIdSchema), addressController.getAddressById);

// Update address
router.put('/:id', validate(updateAddressSchema), addressController.updateAddress);

// Delete address
router.delete('/:id', validate(deleteAddressSchema), addressController.deleteAddress);

export default router;
