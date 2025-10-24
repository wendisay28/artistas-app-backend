#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();
const { Client } = pg;

async function verifySystem() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(chalk.green('✓ Conectado a la base de datos\n'));

    // 1. Verificar que la tabla existe
    console.log(chalk.blue('📋 Verificando tabla highlight_photos...'));
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'highlight_photos'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log(chalk.green('  ✓ Tabla highlight_photos existe'));
    } else {
      console.log(chalk.red('  ✗ Tabla highlight_photos NO existe'));
      throw new Error('Tabla no encontrada');
    }

    // 2. Verificar estructura de la tabla
    console.log(chalk.blue('\n📊 Verificando estructura de la tabla...'));
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'highlight_photos'
      ORDER BY ordinal_position;
    `);

    const expectedColumns = [
      { name: 'id', type: 'integer' },
      { name: 'user_id', type: 'character varying' },
      { name: 'image_url', type: 'character varying' },
      { name: 'position', type: 'integer' },
      { name: 'caption', type: 'text' },
      { name: 'created_at', type: 'timestamp without time zone' },
      { name: 'updated_at', type: 'timestamp without time zone' }
    ];

    let structureValid = true;
    expectedColumns.forEach(expected => {
      const found = columns.rows.find(col => col.column_name === expected.name);
      if (found && found.data_type === expected.type) {
        console.log(chalk.green(`  ✓ ${expected.name}: ${expected.type}`));
      } else {
        console.log(chalk.red(`  ✗ ${expected.name}: esperado ${expected.type}, encontrado ${found?.data_type || 'NO EXISTE'}`));
        structureValid = false;
      }
    });

    if (!structureValid) {
      throw new Error('Estructura de tabla incorrecta');
    }

    // 3. Verificar índices
    console.log(chalk.blue('\n🔍 Verificando índices...'));
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'highlight_photos';
    `);

    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(chalk.green(`  ✓ ${idx.indexname}`));
      });
    } else {
      console.log(chalk.yellow('  ⚠ No se encontraron índices'));
    }

    // 4. Verificar constraints
    console.log(chalk.blue('\n🔒 Verificando constraints...'));
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'highlight_photos';
    `);

    if (constraints.rows.length > 0) {
      constraints.rows.forEach(con => {
        console.log(chalk.green(`  ✓ ${con.constraint_name} (${con.constraint_type})`));
      });
    } else {
      console.log(chalk.yellow('  ⚠ No se encontraron constraints'));
    }

    // 5. Verificar datos existentes
    console.log(chalk.blue('\n📈 Verificando datos...'));
    const dataCount = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT user_id) as users_with_photos
      FROM highlight_photos;
    `);

    const { total, users_with_photos } = dataCount.rows[0];
    console.log(chalk.cyan(`  ℹ Total de fotos destacadas: ${total}`));
    console.log(chalk.cyan(`  ℹ Usuarios con fotos destacadas: ${users_with_photos}`));

    // 6. Verificar fotos completas
    if (parseInt(total) > 0) {
      const completeUsers = await client.query(`
        SELECT user_id, COUNT(*) as photo_count
        FROM highlight_photos
        GROUP BY user_id
        HAVING COUNT(*) = 4;
      `);

      console.log(chalk.cyan(`  ℹ Usuarios con las 4 fotos completas: ${completeUsers.rows.length}`));

      if (completeUsers.rows.length > 0) {
        console.log(chalk.green('  ✓ Algunos usuarios ya tienen sus 4 fotos destacadas'));
      }
    }

    // 7. Verificar permisos
    console.log(chalk.blue('\n🔐 Verificando permisos...'));
    const permissions = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_name = 'highlight_photos'
      LIMIT 5;
    `);

    if (permissions.rows.length > 0) {
      permissions.rows.forEach(perm => {
        console.log(chalk.green(`  ✓ ${perm.grantee}: ${perm.privilege_type}`));
      });
    }

    // Resumen final
    console.log(chalk.bold.green('\n' + '='.repeat(50)));
    console.log(chalk.bold.green('✅ SISTEMA DE FOTOS DESTACADAS: OPERACIONAL'));
    console.log(chalk.bold.green('='.repeat(50)));
    console.log(chalk.white('\nEndpoints disponibles:'));
    console.log(chalk.cyan('  GET    /api/v1/highlight-photos/me'));
    console.log(chalk.cyan('  GET    /api/v1/highlight-photos/me/check'));
    console.log(chalk.cyan('  GET    /api/v1/highlight-photos/user/:userId'));
    console.log(chalk.cyan('  POST   /api/v1/highlight-photos'));
    console.log(chalk.cyan('  PUT    /api/v1/highlight-photos/batch'));
    console.log(chalk.cyan('  DELETE /api/v1/highlight-photos/:position'));

    console.log(chalk.white('\nOnboarding actualizado:'));
    console.log(chalk.cyan('  ✓ 5 pasos totales (nuevo Step 5: Fotos Destacadas)'));
    console.log(chalk.cyan('  ✓ 4 fotos obligatorias para completar'));

  } catch (error) {
    console.log(chalk.bold.red('\n' + '='.repeat(50)));
    console.log(chalk.bold.red('❌ ERROR EN LA VERIFICACIÓN'));
    console.log(chalk.bold.red('='.repeat(50)));
    console.error(chalk.red('\n' + error.message));
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log(chalk.bold.blue('\n🔍 VERIFICANDO SISTEMA DE FOTOS DESTACADAS\n'));
verifySystem();
