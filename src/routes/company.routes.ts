import { Router } from 'express';
import { companyController } from '../controllers/company.controller.js';

const router = Router();

// Obtener todas las empresas del usuario autenticado
router.get('/my-companies', companyController.getMyCompanies);

// Obtener una empresa específica por ID
router.get('/:id', companyController.getCompanyById);

// Crear una nueva empresa
router.post('/', companyController.createCompany);

// Actualizar una empresa existente
router.put('/:id', companyController.updateCompany);

// Eliminar una empresa
router.delete('/:id', companyController.deleteCompany);

// Marcar una empresa como principal
router.patch('/:id/set-primary', companyController.setPrimaryCompany);

export default router;
