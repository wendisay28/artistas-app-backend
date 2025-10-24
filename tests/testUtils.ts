import { Express } from 'express';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';

export class TestServer {
  private server: Server;
  public app: Express;
  public baseUrl: string;
  private connections: Set<any> = new Set();

  constructor(app: Express) {
    this.app = app;
    this.server = createServer(app);
    
    // Manejar nuevas conexiones para poder cerrarlas forzosamente después de las pruebas
    this.server.on('connection', (connection) => {
      this.connections.add(connection);
      connection.on('close', () => this.connections.delete(connection));
    });
    
    // Iniciar el servidor en un puerto aleatorio
    this.server.listen(0); // 0 asigna un puerto disponible automáticamente
    
    // Obtener la URL base del servidor
    const address = this.server.address() as AddressInfo;
    this.baseUrl = `http://localhost:${address.port}`;
  }

  async close(): Promise<void> {
    // Cerrar todas las conexiones activas
    for (const connection of this.connections) {
      connection.destroy();
    }
    
    return new Promise<void>((resolve, reject) => {
      // Cerrar el servidor
      this.server.close((err) => {
        if (err) {
          console.error('Error al cerrar el servidor de pruebas:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const createTestApp = async (): Promise<TestServer> => {
  // Importación dinámica para evitar problemas con el orden de inicialización
  const appModule = await import('../src/index.js');
  return new TestServer(appModule.default);
};
