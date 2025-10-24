// Mock para @supabase/supabase-js en pruebas
console.log('🔧 Usando mock de Supabase para pruebas');

// Definir tipos para los mocks
type MockQueryBuilder = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  [key: string]: any; // Para permitir otros métodos encadenados
};

// Crear un constructor de mocks encadenados
const createMockQueryBuilder = (): MockQueryBuilder => {
  const mock = jest.fn() as unknown as MockQueryBuilder;
  
  // Configurar los métodos encadenados
  mock.select = jest.fn().mockReturnThis();
  mock.insert = jest.fn().mockReturnThis();
  mock.update = jest.fn().mockReturnThis();
  mock.delete = jest.fn().mockReturnThis();
  mock.eq = jest.fn().mockReturnThis();
  mock.single = jest.fn().mockResolvedValue({ data: null, error: null });
  mock.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  
  return mock;
};

// Mock para auth
const mockAuth = {
  signInWithPassword: jest.fn(() => 
    Promise.resolve({ 
      data: { 
        user: { id: 'test-user-id' }, 
        session: { access_token: 'test-token' } 
      }, 
      error: null 
    })
  ),
  signUp: jest.fn(() => 
    Promise.resolve({ 
      data: { 
        user: { id: 'test-user-id' }, 
        session: { access_token: 'test-token' } 
      }, 
      error: null 
    })
  ),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  getUser: jest.fn(() => 
    Promise.resolve({ 
      data: { 
        user: { 
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        } 
      }, 
      error: null 
    })
  ),
  getSession: jest.fn(() => 
    Promise.resolve({ 
      data: { 
        session: { 
          access_token: 'test-token',
          refresh_token: 'test-refresh-token',
          user: { id: 'test-user-id' }
        } 
      }, 
      error: null 
    })
  ),
  onAuthStateChange: jest.fn((callback) => {
    // Simular un cambio de autenticación
    const unsubscribe = () => {};
    return { data: { subscription: { unsubscribe } } };
  }),
  // Añadir más métodos según sea necesario
};

// Mock para storage
const mockStorage = {
  from: jest.fn().mockImplementation(() => ({
    upload: jest.fn(() => 
      Promise.resolve({ 
        data: { 
          path: 'test-path',
          id: 'test-file-id',
          fullPath: 'test/full/path'
        }, 
        error: null 
      })
    ),
    getPublicUrl: jest.fn(() => ({ 
      data: { 
        publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-path' 
      } 
    })),
    remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
    download: jest.fn(() => 
      Promise.resolve({ 
        data: { 
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) 
        }, 
        error: null 
      })
    ),
    // Añadir más métodos según sea necesario
  })),
};

// Crear el mock principal
const mockSupabaseClient = {
  from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
  auth: mockAuth,
  storage: mockStorage,
  rpc: jest.fn().mockReturnThis(),
  // Añadir más métodos según sea necesario
};

// Función para crear el cliente mockeado
const createClient = jest.fn(() => mockSupabaseClient);

// Exportar todo
export {
  createClient,
  mockSupabaseClient as supabase,
  mockAuth,
  mockStorage,
  createMockQueryBuilder,
};

export default createClient;