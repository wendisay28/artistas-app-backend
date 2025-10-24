import { Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { db } from '../db.js';
import { disciplines, roles, specializations, tads, roleStats, customTadProposals, customSpecializationProposals } from '../schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Controlador para gestionar la jerarquía de artistas
 * Categoría → Disciplina → Rol → Especialización
 */

// ============================================
// DISCIPLINAS
// ============================================

/**
 * GET /api/v1/disciplines
 * Obtener todas las disciplinas o filtrar por categoría
 */
export const getDisciplines = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;

    let query = db.select().from(disciplines);

    if (categoryId) {
      query = query.where(eq(disciplines.categoryId, parseInt(categoryId as string)));
    }

    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    return res.status(500).json({ message: 'Error al obtener disciplinas' });
  }
};

/**
 * GET /api/v1/disciplines/:id
 * Obtener una disciplina por ID
 */
export const getDisciplineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(disciplines).where(eq(disciplines.id, parseInt(id)));

    if (result.length === 0) {
      return res.status(404).json({ message: 'Disciplina no encontrada' });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error('Error fetching discipline:', error);
    return res.status(500).json({ message: 'Error al obtener disciplina' });
  }
};

// ============================================
// ROLES
// ============================================

/**
 * GET /api/v1/roles
 * Obtener todos los roles o filtrar por disciplina
 */
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { disciplineId, categoryId } = req.query;

    let query = db.select().from(roles);

    if (disciplineId) {
      query = query.where(eq(roles.disciplineId, parseInt(disciplineId as string)));
    } else if (categoryId) {
      query = query.where(eq(roles.categoryId, parseInt(categoryId as string)));
    }

    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ message: 'Error al obtener roles' });
  }
};

/**
 * GET /api/v1/roles/:id
 * Obtener un rol por ID (incluye TADs y Stats sugeridos)
 */
export const getRoleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(id);

    // Obtener rol
    const roleResult = await db.select().from(roles).where(eq(roles.id, roleId));

    if (roleResult.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    const role = roleResult[0];

    // Obtener TADs sugeridos
    const tadResults = await db
      .select({
        id: tads.id,
        disciplineId: tads.suggestedDisciplineId,
        discipline: disciplines,
        priority: tads.priority,
      })
      .from(tads)
      .leftJoin(disciplines, eq(tads.suggestedDisciplineId, disciplines.id))
      .where(eq(tads.roleId, roleId))
      .orderBy(tads.priority);

    // Obtener Stats sugeridos
    const statsResults = await db
      .select()
      .from(roleStats)
      .where(eq(roleStats.roleId, roleId))
      .orderBy(roleStats.displayOrder);

    return res.json({
      ...role,
      suggestedTADs: tadResults,
      suggestedStats: statsResults,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({ message: 'Error al obtener rol' });
  }
};

// ============================================
// ESPECIALIZACIONES
// ============================================

/**
 * GET /api/v1/specializations
 * Obtener todas las especializaciones o filtrar por rol
 */
export const getSpecializations = async (req: Request, res: Response) => {
  try {
    const { roleId, disciplineId, categoryId } = req.query;

    let query = db.select().from(specializations).where(eq(specializations.isApproved, true));

    if (roleId) {
      query = query.where(eq(specializations.roleId, parseInt(roleId as string)));
    } else if (disciplineId) {
      query = query.where(eq(specializations.disciplineId, parseInt(disciplineId as string)));
    } else if (categoryId) {
      query = query.where(eq(specializations.categoryId, parseInt(categoryId as string)));
    }

    const result = await query;
    return res.json(result);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return res.status(500).json({ message: 'Error al obtener especializaciones' });
  }
};

/**
 * GET /api/v1/specializations/:id
 * Obtener una especialización por ID
 */
export const getSpecializationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.select().from(specializations).where(eq(specializations.id, parseInt(id)));

    if (result.length === 0) {
      return res.status(404).json({ message: 'Especialización no encontrada' });
    }

    return res.json(result[0]);
  } catch (error) {
    console.error('Error fetching specialization:', error);
    return res.status(500).json({ message: 'Error al obtener especialización' });
  }
};

/**
 * POST /api/v1/specializations/propose
 * Proponer una nueva especialización (requiere aprobación de admin)
 */
export const proposeSpecialization = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { roleId, proposedName, proposedCode, description, justification } = req.body;

    if (!roleId || !proposedName || !proposedCode) {
      return res.status(400).json({ message: 'roleId, proposedName y proposedCode son requeridos' });
    }

    // Crear propuesta
    const result = await db.insert(customSpecializationProposals).values({
      userId,
      roleId: parseInt(roleId),
      proposedName,
      proposedCode,
      description,
      justification,
      status: 'pending',
    }).returning();

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error proposing specialization:', error);
    return res.status(500).json({ message: 'Error al proponer especialización' });
  }
};

// ============================================
// TADs - TALENTOS ADICIONALES
// ============================================

/**
 * GET /api/v1/tads
 * Obtener TADs sugeridos por rol
 */
export const getTADsByRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.query;

    if (!roleId) {
      return res.status(400).json({ message: 'roleId es requerido' });
    }

    const result = await db
      .select({
        id: tads.id,
        disciplineId: tads.suggestedDisciplineId,
        discipline: disciplines,
        priority: tads.priority,
      })
      .from(tads)
      .leftJoin(disciplines, eq(tads.suggestedDisciplineId, disciplines.id))
      .where(eq(tads.roleId, parseInt(roleId as string)))
      .orderBy(tads.priority);

    return res.json(result);
  } catch (error) {
    console.error('Error fetching TADs:', error);
    return res.status(500).json({ message: 'Error al obtener TADs' });
  }
};

/**
 * POST /api/v1/tads/propose
 * Proponer un nuevo TAD (requiere aprobación de admin)
 */
export const proposeTAD = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { roleId, proposedDisciplineName, justification } = req.body;

    if (!roleId || !proposedDisciplineName) {
      return res.status(400).json({ message: 'roleId y proposedDisciplineName son requeridos' });
    }

    // Crear propuesta
    const result = await db.insert(customTadProposals).values({
      userId,
      roleId: parseInt(roleId),
      proposedDisciplineName,
      justification,
      status: 'pending',
    }).returning();

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error proposing TAD:', error);
    return res.status(500).json({ message: 'Error al proponer TAD' });
  }
};

// ============================================
// STATS
// ============================================

/**
 * GET /api/v1/role-stats/:roleId
 * Obtener stats sugeridos para un rol específico
 */
export const getStatsByRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;

    const result = await db
      .select()
      .from(roleStats)
      .where(eq(roleStats.roleId, parseInt(roleId)))
      .orderBy(roleStats.displayOrder);

    return res.json(result);
  } catch (error) {
    console.error('Error fetching role stats:', error);
    return res.status(500).json({ message: 'Error al obtener stats del rol' });
  }
};

// ============================================
// ADMIN: Gestión de propuestas
// ============================================

/**
 * GET /api/v1/admin/proposals/specializations
 * Obtener todas las propuestas de especializaciones pendientes
 */
export const getPendingSpecializationProposals = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    // TODO: Verificar que el usuario es admin

    const result = await db
      .select()
      .from(customSpecializationProposals)
      .where(eq(customSpecializationProposals.status, 'pending'));

    return res.json(result);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({ message: 'Error al obtener propuestas' });
  }
};

/**
 * PATCH /api/v1/admin/proposals/specializations/:id
 * Aprobar o rechazar una propuesta de especialización
 */
export const reviewSpecializationProposal = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status debe ser approved o rejected' });
    }

    // Actualizar propuesta
    const proposalResult = await db
      .update(customSpecializationProposals)
      .set({
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes,
      })
      .where(eq(customSpecializationProposals.id, parseInt(id)))
      .returning();

    if (proposalResult.length === 0) {
      return res.status(404).json({ message: 'Propuesta no encontrada' });
    }

    const proposal = proposalResult[0];

    // Si fue aprobada, crear la especialización
    if (status === 'approved') {
      await db.insert(specializations).values({
        code: proposal.proposedCode,
        name: proposal.proposedName,
        roleId: proposal.roleId,
        disciplineId: 0, // TODO: Obtener del rol
        categoryId: 0, // TODO: Obtener del rol
        description: proposal.description || '',
        isCustom: true,
        isApproved: true,
        proposedBy: proposal.userId,
      });
    }

    return res.json(proposal);
  } catch (error) {
    console.error('Error reviewing proposal:', error);
    return res.status(500).json({ message: 'Error al revisar propuesta' });
  }
};

/**
 * GET /api/v1/admin/proposals/tads
 * Obtener todas las propuestas de TADs pendientes
 */
export const getPendingTADProposals = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    // TODO: Verificar que el usuario es admin

    const result = await db
      .select()
      .from(customTadProposals)
      .where(eq(customTadProposals.status, 'pending'));

    return res.json(result);
  } catch (error) {
    console.error('Error fetching TAD proposals:', error);
    return res.status(500).json({ message: 'Error al obtener propuestas de TADs' });
  }
};

/**
 * PATCH /api/v1/admin/proposals/tads/:id
 * Aprobar o rechazar una propuesta de TAD
 */
export const reviewTADProposal = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status, reviewNotes, disciplineId } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status debe ser approved o rejected' });
    }

    // Actualizar propuesta
    const proposalResult = await db
      .update(customTadProposals)
      .set({
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes,
      })
      .where(eq(customTadProposals.id, parseInt(id)))
      .returning();

    if (proposalResult.length === 0) {
      return res.status(404).json({ message: 'Propuesta no encontrada' });
    }

    const proposal = proposalResult[0];

    // Si fue aprobada, crear el TAD
    if (status === 'approved' && disciplineId) {
      await db.insert(tads).values({
        roleId: proposal.roleId,
        suggestedDisciplineId: parseInt(disciplineId),
        priority: 0,
      });
    }

    return res.json(proposal);
  } catch (error) {
    console.error('Error reviewing TAD proposal:', error);
    return res.status(500).json({ message: 'Error al revisar propuesta de TAD' });
  }
};
