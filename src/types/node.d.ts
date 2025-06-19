// Tipos para módulos de Node.js
declare module '*.js' {
  const value: any;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Extender el tipo ProcessEnv para incluir nuestras variables de entorno
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    // Agrega aquí más variables de entorno según sea necesario
  }
}
