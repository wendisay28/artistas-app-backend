import type { Request, Response } from 'express';
import { documentStorage } from '../storage/documents.js';
import { uploadFile, getPublicUrl, supabase } from '../config/supabase.js';

export class DocumentsController {
  // Obtener todos los documentos del usuario
  async getUserDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const documents = await documentStorage.getUserDocuments(userId);

      return res.json(documents);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return res.status(500).json({ message: 'Error al obtener documentos' });
    }
  }

  // Obtener un documento específico
  async getDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const documentId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const document = await documentStorage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      // Verificar que el documento pertenezca al usuario
      if (document.userId !== userId) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      return res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      return res.status(500).json({ message: 'Error al obtener documento' });
    }
  }

  // Subir un documento
  async uploadDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { documentType, fileName, expiryDate } = req.body;
      const file = (req as any).file;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      if (!file) {
        return res.status(400).json({ message: 'No se proporcionó archivo' });
      }

      if (!documentType) {
        return res.status(400).json({ message: 'Tipo de documento requerido' });
      }

      // Validar tipo de documento
      const validTypes = ['id', 'tax', 'contract', 'certification'];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({ message: 'Tipo de documento inválido' });
      }

      // Subir archivo a storage
      const filePath = `${userId}/${documentType}/${Date.now()}_${fileName || file.originalname}`;
      const { data, error: uploadError } = await uploadFile(
        'documents' as any,
        filePath,
        file.buffer,
        { contentType: file.mimetype, upsert: false }
      );

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`);
      }

      const fileUrl = getPublicUrl('documents' as any, data?.path || filePath);

      // Crear registro en base de datos
      const document = await documentStorage.createDocument({
        userId,
        documentType,
        fileName: fileName || file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      });

      return res.status(201).json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ message: 'Error al subir documento' });
    }
  }

  // Actualizar estado del documento (para admin)
  async updateDocumentStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const documentId = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // TODO: Verificar que el usuario sea admin
      // if (!req.user.isAdmin) {
      //   return res.status(403).json({ message: 'No autorizado' });
      // }

      const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      const document = await documentStorage.updateDocumentStatus(
        documentId,
        status,
        userId,
        rejectionReason
      );

      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      return res.json(document);
    } catch (error) {
      console.error('Error updating document status:', error);
      return res.status(500).json({ message: 'Error al actualizar estado' });
    }
  }

  // Eliminar documento
  async deleteDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const documentId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Obtener documento para verificar ownership y obtener fileUrl
      const document = await documentStorage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      if (document.userId !== userId) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      // Eliminar archivo de storage
      try {
        // Extraer path del fileUrl si es necesario
        const pathMatch = document.fileUrl.match(/documents\/(.+)$/);
        if (pathMatch) {
          const { error: deleteError } = await supabase.storage
            .from('documents')
            .remove([pathMatch[1]]);

          if (deleteError) {
            console.error('Error deleting file from storage:', deleteError);
          }
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error);
        // Continuar aunque falle la eliminación del archivo
      }

      // Eliminar registro de base de datos
      await documentStorage.deleteDocument(documentId, userId);

      return res.json({ message: 'Documento eliminado' });
    } catch (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ message: 'Error al eliminar documento' });
    }
  }

  // Obtener estadísticas de documentos
  async getDocumentsStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const [total, pending, approved, rejected] = await Promise.all([
        documentStorage.getDocumentsCount(userId),
        documentStorage.getDocumentsCount(userId, 'pending'),
        documentStorage.getDocumentsCount(userId, 'approved'),
        documentStorage.getDocumentsCount(userId, 'rejected'),
      ]);

      return res.json({
        total,
        pending,
        approved,
        rejected,
      });
    } catch (error) {
      console.error('Error fetching documents stats:', error);
      return res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
  }
}

export const documentsController = new DocumentsController();
