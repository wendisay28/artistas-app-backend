import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as hierarchyController from '../controllers/artist-hierarchy.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Artist Hierarchy
 *   description: Gestión de la jerarquía de artistas (Disciplinas, Roles, Especializaciones, TADs, Stats)
 */

// ============================================
// DISCIPLINAS
// ============================================

/**
 * @swagger
 * /v1/disciplines:
 *   get:
 *     summary: Obtener todas las disciplinas (filtrar por categoría opcional)
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: ID de la categoría para filtrar
 *     responses:
 *       200:
 *         description: Lista de disciplinas
 */
router.get('/disciplines', hierarchyController.getDisciplines);

/**
 * @swagger
 * /v1/disciplines/:id:
 *   get:
 *     summary: Obtener una disciplina por ID
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Disciplina encontrada
 *       404:
 *         description: Disciplina no encontrada
 */
router.get('/disciplines/:id', hierarchyController.getDisciplineById);

// ============================================
// ROLES
// ============================================

/**
 * @swagger
 * /v1/roles:
 *   get:
 *     summary: Obtener todos los roles (filtrar por disciplina o categoría)
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: query
 *         name: disciplineId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/roles', hierarchyController.getRoles);

/**
 * @swagger
 * /v1/roles/:id:
 *   get:
 *     summary: Obtener un rol por ID (incluye TADs y Stats sugeridos)
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol encontrado con TADs y Stats
 *       404:
 *         description: Rol no encontrado
 */
router.get('/roles/:id', hierarchyController.getRoleById);

// ============================================
// ESPECIALIZACIONES
// ============================================

/**
 * @swagger
 * /v1/specializations:
 *   get:
 *     summary: Obtener todas las especializaciones (filtrar por rol, disciplina o categoría)
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: disciplineId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de especializaciones aprobadas
 */
router.get('/specializations', hierarchyController.getSpecializations);

/**
 * @swagger
 * /v1/specializations/:id:
 *   get:
 *     summary: Obtener una especialización por ID
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Especialización encontrada
 *       404:
 *         description: Especialización no encontrada
 */
router.get('/specializations/:id', hierarchyController.getSpecializationById);

/**
 * @swagger
 * /v1/specializations/propose:
 *   post:
 *     summary: Proponer una nueva especialización (requiere autenticación)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - proposedName
 *               - proposedCode
 *             properties:
 *               roleId:
 *                 type: integer
 *               proposedName:
 *                 type: string
 *               proposedCode:
 *                 type: string
 *               description:
 *                 type: string
 *               justification:
 *                 type: string
 *     responses:
 *       201:
 *         description: Propuesta creada exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/specializations/propose', authMiddleware, hierarchyController.proposeSpecialization);

// ============================================
// TADs - TALENTOS ADICIONALES
// ============================================

/**
 * @swagger
 * /v1/tads:
 *   get:
 *     summary: Obtener TADs sugeridos por rol
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de TADs sugeridos
 *       400:
 *         description: roleId es requerido
 */
router.get('/tads', hierarchyController.getTADsByRole);

/**
 * @swagger
 * /v1/tads/propose:
 *   post:
 *     summary: Proponer un nuevo TAD (requiere autenticación)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - proposedDisciplineName
 *             properties:
 *               roleId:
 *                 type: integer
 *               proposedDisciplineName:
 *                 type: string
 *               justification:
 *                 type: string
 *     responses:
 *       201:
 *         description: Propuesta de TAD creada exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/tads/propose', authMiddleware, hierarchyController.proposeTAD);

// ============================================
// STATS
// ============================================

/**
 * @swagger
 * /v1/role-stats/:roleId:
 *   get:
 *     summary: Obtener stats sugeridos para un rol específico
 *     tags: [Artist Hierarchy]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de stats sugeridos para el rol
 */
router.get('/role-stats/:roleId', hierarchyController.getStatsByRole);

// ============================================
// ADMIN: Gestión de propuestas
// ============================================

/**
 * @swagger
 * /v1/admin/proposals/specializations:
 *   get:
 *     summary: Obtener propuestas de especializaciones pendientes (admin)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de propuestas pendientes
 */
router.get('/admin/proposals/specializations', authMiddleware, hierarchyController.getPendingSpecializationProposals);

/**
 * @swagger
 * /v1/admin/proposals/specializations/:id:
 *   patch:
 *     summary: Aprobar o rechazar una propuesta de especialización (admin)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reviewNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Propuesta revisada exitosamente
 *       404:
 *         description: Propuesta no encontrada
 */
router.patch('/admin/proposals/specializations/:id', authMiddleware, hierarchyController.reviewSpecializationProposal);

/**
 * @swagger
 * /v1/admin/proposals/tads:
 *   get:
 *     summary: Obtener propuestas de TADs pendientes (admin)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de propuestas de TADs pendientes
 */
router.get('/admin/proposals/tads', authMiddleware, hierarchyController.getPendingTADProposals);

/**
 * @swagger
 * /v1/admin/proposals/tads/:id:
 *   patch:
 *     summary: Aprobar o rechazar una propuesta de TAD (admin)
 *     tags: [Artist Hierarchy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reviewNotes:
 *                 type: string
 *               disciplineId:
 *                 type: integer
 *                 description: ID de la disciplina a asociar (requerido si se aprueba)
 *     responses:
 *       200:
 *         description: Propuesta de TAD revisada exitosamente
 *       404:
 *         description: Propuesta no encontrada
 */
router.patch('/admin/proposals/tads/:id', authMiddleware, hierarchyController.reviewTADProposal);

export default router;
