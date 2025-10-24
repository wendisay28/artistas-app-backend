import { db } from '../db.js';
import { userContracts, userQuotations } from '../schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type UserContract = typeof userContracts.$inferSelect;
type NewUserContract = typeof userContracts.$inferInsert;
type UserQuotation = typeof userQuotations.$inferSelect;
type NewUserQuotation = typeof userQuotations.$inferInsert;

export class UserContractsStorage {
  constructor(private db: PostgresJsDatabase<Record<string, unknown>>) {}

  // ============ CONTRATACIONES ============

  /**
   * Obtener historial de contrataciones del usuario
   */
  async getUserContracts(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<UserContract[]> {
    const conditions = [eq(userContracts.userId, userId)];
    
    if (options?.status) {
      conditions.push(eq(userContracts.status, options.status as any));
    }

    let query = this.db
      .select()
      .from(userContracts)
      .where(and(...conditions))
      .orderBy(desc(userContracts.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    return await query;
  }

  /**
   * Obtener una contratación por ID
   */
  async getContractById(contractId: number): Promise<UserContract | null> {
    const [contract] = await this.db
      .select()
      .from(userContracts)
      .where(eq(userContracts.id, contractId));

    return contract || null;
  }

  /**
   * Crear nueva contratación
   */
  async createContract(data: NewUserContract): Promise<UserContract> {
    const [contract] = await this.db
      .insert(userContracts)
      .values(data)
      .returning();

    if (!contract) {
      throw new Error('Failed to create contract');
    }

    return contract;
  }

  /**
   * Actualizar estado de contratación
   */
  async updateContractStatus(
    contractId: number,
    status: string,
    additionalData?: Partial<UserContract>
  ): Promise<UserContract> {
    const [updated] = await this.db
      .update(userContracts)
      .set({
        status: status as any,
        ...additionalData,
        updatedAt: new Date(),
      })
      .where(eq(userContracts.id, contractId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update contract status');
    }

    return updated;
  }

  /**
   * Agregar reseña a contratación
   */
  async addReview(
    contractId: number,
    rating: number,
    review: string
  ): Promise<UserContract> {
    const [updated] = await this.db
      .update(userContracts)
      .set({
        rating,
        review,
        updatedAt: new Date(),
      })
      .where(eq(userContracts.id, contractId))
      .returning();

    if (!updated) {
      throw new Error('Failed to add review');
    }

    return updated;
  }

  /**
   * Obtener estadísticas de contrataciones
   */
  async getContractStats(userId: string): Promise<{
    totalContracts: number;
    totalSpent: number;
    completedContracts: number;
    pendingContracts: number;
    cancelledContracts: number;
    averageRating: number;
  }> {
    // Total de contrataciones
    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userContracts)
      .where(eq(userContracts.userId, userId));

    // Total gastado
    const [spentResult] = await this.db
      .select({ total: sql<number>`coalesce(sum(amount), 0)::numeric` })
      .from(userContracts)
      .where(
        and(
          eq(userContracts.userId, userId),
          eq(userContracts.status, 'completed')
        )
      );

    // Contrataciones completadas
    const [completedResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userContracts)
      .where(
        and(
          eq(userContracts.userId, userId),
          eq(userContracts.status, 'completed')
        )
      );

    // Contrataciones pendientes
    const [pendingResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userContracts)
      .where(
        and(
          eq(userContracts.userId, userId),
          eq(userContracts.status, 'pending')
        )
      );

    // Contrataciones canceladas
    const [cancelledResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userContracts)
      .where(
        and(
          eq(userContracts.userId, userId),
          eq(userContracts.status, 'cancelled')
        )
      );

    // Rating promedio
    const [ratingResult] = await this.db
      .select({ avg: sql<number>`coalesce(avg(rating), 0)::numeric` })
      .from(userContracts)
      .where(
        and(
          eq(userContracts.userId, userId),
          sql`${userContracts.rating} IS NOT NULL`
        )
      );

    return {
      totalContracts: totalResult?.count || 0,
      totalSpent: parseFloat(spentResult?.total?.toString() || '0'),
      completedContracts: completedResult?.count || 0,
      pendingContracts: pendingResult?.count || 0,
      cancelledContracts: cancelledResult?.count || 0,
      averageRating: parseFloat(ratingResult?.avg?.toString() || '0'),
    };
  }

  // ============ COTIZACIONES ============

  /**
   * Obtener cotizaciones del usuario
   */
  async getUserQuotations(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<UserQuotation[]> {
    const conditions = [eq(userQuotations.userId, userId)];
    
    if (options?.status) {
      conditions.push(eq(userQuotations.status, options.status as any));
    }

    let query = this.db
      .select()
      .from(userQuotations)
      .where(and(...conditions))
      .orderBy(desc(userQuotations.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }

    return await query;
  }

  /**
   * Obtener una cotización por ID
   */
  async getQuotationById(quotationId: number): Promise<UserQuotation | null> {
    const [quotation] = await this.db
      .select()
      .from(userQuotations)
      .where(eq(userQuotations.id, quotationId));

    return quotation || null;
  }

  /**
   * Crear solicitud de cotización
   */
  async createQuotation(data: NewUserQuotation): Promise<UserQuotation> {
    const [quotation] = await this.db
      .insert(userQuotations)
      .values(data)
      .returning();

    if (!quotation) {
      throw new Error('Failed to create quotation');
    }

    return quotation;
  }

  /**
   * Actualizar estado de cotización
   */
  async updateQuotationStatus(
    quotationId: number,
    status: string,
    additionalData?: Partial<UserQuotation>
  ): Promise<UserQuotation> {
    const [updated] = await this.db
      .update(userQuotations)
      .set({
        status: status as any,
        ...additionalData,
        updatedAt: new Date(),
      })
      .where(eq(userQuotations.id, quotationId))
      .returning();

    if (!updated) {
      throw new Error('Failed to update quotation status');
    }

    return updated;
  }

  /**
   * Responder a cotización (desde el artista)
   */
  async respondToQuotation(
    quotationId: number,
    quotedAmount: number,
    artistResponse: string
  ): Promise<UserQuotation> {
    const [updated] = await this.db
      .update(userQuotations)
      .set({
        status: 'quoted',
        quotedAmount: quotedAmount.toString(),
        artistResponse,
        responseDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userQuotations.id, quotationId))
      .returning();

    if (!updated) {
      throw new Error('Failed to respond to quotation');
    }

    return updated;
  }

  /**
   * Aceptar cotización (convertir en contrato)
   */
  async acceptQuotation(quotationId: number): Promise<{
    quotation: UserQuotation;
    contract: UserContract;
  }> {
    const quotation = await this.getQuotationById(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Actualizar cotización
    const [updatedQuotation] = await this.db
      .update(userQuotations)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
      })
      .where(eq(userQuotations.id, quotationId))
      .returning();

    // Crear contrato
    const contract = await this.createContract({
      userId: quotation.userId,
      artistId: quotation.artistId,
      serviceType: quotation.serviceType,
      serviceName: quotation.title,
      description: quotation.description,
      amount: quotation.quotedAmount?.toString() || '0',
      status: 'confirmed',
      serviceDate: quotation.preferredDate,
      metadata: {
        quotationId: quotation.id,
        ...quotation.metadata,
      },
    });

    return {
      quotation: updatedQuotation!,
      contract,
    };
  }
}

export const userContractsStorage = new UserContractsStorage(db);
