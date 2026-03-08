// src/controllers/verificationController.js
// Controlador para el sistema de verificación de artistas

const { pool } = require('../database/connection');
const { sendNotification } = require('../utils/notifications');

class VerificationController {
  // Obtener estado de verificación de un artista
  async getVerificationStatus(req, res) {
    try {
      const { artistId } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT 
          a.verified,
          a.verification_status,
          a.verification_documents,
          a.verification_submitted_at,
          a.verification_reviewed_at,
          a.verification_notes,
          u.email,
          u.name as user_name
        FROM artists a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ? AND a.user_id = ?
      `;

      const [result] = await pool.execute(query, [artistId, userId]);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Artista no encontrado'
        });
      }

      res.json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado de verificación'
      });
    }
  }

  // Solicitar verificación
  async submitVerification(req, res) {
    try {
      const { artistId } = req.params;
      const userId = req.user.id;
      const { documents, notes } = req.body;

      // Verificar que el artista pertenezca al usuario
      const artistQuery = 'SELECT id FROM artists WHERE id = ? AND user_id = ?';
      const [artist] = await pool.execute(artistQuery, [artistId, userId]);

      if (artist.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Artista no encontrado'
        });
      }

      // Actualizar estado de verificación
      const updateQuery = `
        UPDATE artists 
        SET 
          verification_status = 'pending',
          verification_documents = ?,
          verification_notes = ?,
          verification_submitted_at = NOW(),
          verified = false
        WHERE id = ? AND user_id = ?
      `;

      await pool.execute(updateQuery, [
        JSON.stringify(documents),
        notes || null,
        artistId,
        userId
      ]);

      // Notificar al admin sobre nueva solicitud
      await sendNotification({
        type: 'verification_request',
        title: 'Nueva Solicitud de Verificación',
        message: `El artista ha solicitado verificación`,
        data: { artistId, userId }
      });

      res.json({
        success: true,
        message: 'Solicitud de verificación enviada correctamente'
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar solicitud de verificación'
      });
    }
  }

  // Aprobar verificación (solo admin)
  async approveVerification(req, res) {
    try {
      const { artistId } = req.params;
      const { adminNotes } = req.body;

      // Verificar que sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }

      // Actualizar estado a verificado
      const updateQuery = `
        UPDATE artists 
        SET 
          verified = true,
          verification_status = 'approved',
          verification_reviewed_at = NOW(),
          verification_notes = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await pool.execute(updateQuery, [adminNotes || null, artistId]);

      // Obtener info del artista para notificación
      const artistQuery = `
        SELECT a.user_id, u.email, u.name 
        FROM artists a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.id = ?
      `;
      const [artist] = await pool.execute(artistQuery, [artistId]);

      if (artist.length > 0) {
        // Notificar al artista
        await sendNotification({
          userId: artist[0].user_id,
          type: 'verification_approved',
          title: '¡Verificación Aprobada!',
          message: 'Tu cuenta ha sido verificada exitosamente',
          data: { artistId }
        });
      }

      res.json({
        success: true,
        message: 'Verificación aprobada correctamente'
      });
    } catch (error) {
      console.error('Error approving verification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aprobar verificación'
      });
    }
  }

  // Rechazar verificación (solo admin)
  async rejectVerification(req, res) {
    try {
      const { artistId } = req.params;
      const { rejectionReason, adminNotes } = req.body;

      // Verificar que sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }

      // Actualizar estado a rechazado
      const updateQuery = `
        UPDATE artists 
        SET 
          verified = false,
          verification_status = 'rejected',
          verification_reviewed_at = NOW(),
          verification_notes = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      const notes = {
        rejectionReason,
        adminNotes,
        reviewedAt: new Date().toISOString()
      };

      await pool.execute(updateQuery, [JSON.stringify(notes), artistId]);

      // Obtener info del artista para notificación
      const artistQuery = `
        SELECT a.user_id, u.email, u.name 
        FROM artists a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.id = ?
      `;
      const [artist] = await pool.execute(artistQuery, [artistId]);

      if (artist.length > 0) {
        // Notificar al artista
        await sendNotification({
          userId: artist[0].user_id,
          type: 'verification_rejected',
          title: 'Verificación Rechazada',
          message: `Tu solicitud de verificación fue rechazada: ${rejectionReason}`,
          data: { artistId, rejectionReason }
        });
      }

      res.json({
        success: true,
        message: 'Verificación rechazada correctamente'
      });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar verificación'
      });
    }
  }

  // Listar solicitudes pendientes (solo admin)
  async getPendingVerifications(req, res) {
    try {
      // Verificar que sea admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }

      const query = `
        SELECT 
          a.id as artist_id,
          a.verification_status,
          a.verification_submitted_at,
          a.verification_documents,
          a.verification_notes,
          u.name as user_name,
          u.email,
          u.phone,
          a.name as artist_name,
          a.category,
          a.specialty
        FROM artists a
        JOIN users u ON a.user_id = u.id
        WHERE a.verification_status = 'pending'
        ORDER BY a.verification_submitted_at ASC
      `;

      const [results] = await pool.execute(query);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener solicitudes pendientes'
      });
    }
  }
}

module.exports = new VerificationController();
