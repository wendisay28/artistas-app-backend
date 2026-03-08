-- Migración: Sistema de disponibilidad y reservas para artistas
-- Fecha: 2026-03-08
-- Basado en el modelo correcto: availability_rules + blocked_dates + bookings

-- ============================================
-- TABLA AVAILABILITY_RULES (Disponibilidad semanal)
-- ============================================
CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  -- Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Horarios de disponibilidad
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Configuración
  is_active BOOLEAN DEFAULT true,
  slot_duration_minutes INTEGER DEFAULT 60, -- Duración de cada slot en minutos
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Restricción: Un artista no puede tener múltiples reglas para el mismo día
  UNIQUE(artist_id, day_of_week)
);

-- ============================================
-- TABLA BLOCKED_DATES (Días bloqueados/vacaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  
  -- Fecha bloqueada
  date DATE NOT NULL,
  
  -- Razón del bloqueo
  reason TEXT,
  
  -- Tipo de bloqueo
  block_type VARCHAR CHECK (block_type IN ('vacation', 'personal', 'event', 'other')) DEFAULT 'personal',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Restricción: Un artista no puede bloquear la misma fecha dos veces
  UNIQUE(artist_id, date)
);

-- ============================================
-- TABLA ARTIST_BOOKINGS (Reservas específicas para artistas)
-- ============================================
CREATE TABLE IF NOT EXISTS artist_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  client_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Información del evento
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Fechas y horarios
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Ubicación (si aplica)
  location_type VARCHAR CHECK (location_type IN ('online', 'client_place', 'artist_place', 'venue')) DEFAULT 'online',
  location TEXT,
  city VARCHAR,
  
  -- Información de contacto del cliente
  client_name VARCHAR,
  client_email VARCHAR,
  client_phone VARCHAR,
  
  -- Costos
  price NUMERIC(10, 2),
  currency VARCHAR DEFAULT 'USD',
  deposit NUMERIC(10, 2),
  deposit_paid BOOLEAN DEFAULT FALSE,
  
  -- Estado de la reserva
  status VARCHAR CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed', 'expired')) DEFAULT 'pending',
  
  -- Notas
  client_notes TEXT,
  artist_notes TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps importantes
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- Cuándo expira la oferta
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES para mejorar rendimiento
-- ============================================
CREATE INDEX IF NOT EXISTS idx_availability_rules_artist_id ON availability_rules(artist_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_day_of_week ON availability_rules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_rules_active ON availability_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_artist_id ON blocked_dates(artist_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);

CREATE INDEX IF NOT EXISTS idx_artist_bookings_artist_id ON artist_bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_bookings_client_id ON artist_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_artist_bookings_status ON artist_bookings(status);
CREATE INDEX IF NOT EXISTS idx_artist_bookings_date_time ON artist_bookings(event_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_artist_bookings_expires_at ON artist_bookings(expires_at);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================
-- Activar RLS en todas las tablas
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para availability_rules
-- Los artistas solo pueden ver/editar sus propias reglas
CREATE POLICY "Artistas pueden ver sus propias reglas de disponibilidad" ON availability_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = availability_rules.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden insertar sus propias reglas de disponibilidad" ON availability_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = availability_rules.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden actualizar sus propias reglas de disponibilidad" ON availability_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = availability_rules.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden eliminar sus propias reglas de disponibilidad" ON availability_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = availability_rules.artist_id 
      AND a.user_id = auth.uid()
    )
  );

-- Políticas para blocked_dates
CREATE POLICY "Artistas pueden ver sus propias fechas bloqueadas" ON blocked_dates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = blocked_dates.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden insertar sus propias fechas bloqueadas" ON blocked_dates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = blocked_dates.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden actualizar sus propias fechas bloqueadas" ON blocked_dates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = blocked_dates.artist_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Artistas pueden eliminar sus propias fechas bloqueadas" ON blocked_dates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = blocked_dates.artist_id 
      AND a.user_id = auth.uid()
    )
  );

-- Políticas para artist_bookings
-- Clientes pueden ver sus propias reservas
CREATE POLICY "Clientes pueden ver sus propias reservas" ON artist_bookings
  FOR SELECT USING (
    client_id = auth.uid()
  );

-- Artistas pueden ver las reservas dirigidas a ellos
CREATE POLICY "Artistas pueden ver reservas dirigidas a ellos" ON artist_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = artist_bookings.artist_id 
      AND a.user_id = auth.uid()
    )
  );

-- Clientes pueden crear reservas
CREATE POLICY "Clientes pueden crear reservas" ON artist_bookings
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
  );

-- Artistas pueden actualizar el estado de sus reservas
CREATE POLICY "Artistas pueden actualizar estado de sus reservas" ON artist_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artists a 
      WHERE a.id = artist_bookings.artist_id 
      AND a.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para verificar conflictos de horarios
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_artist_id INTEGER,
  p_event_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM artist_bookings
  WHERE artist_id = p_artist_id
    AND event_date = p_event_date
    AND status = 'accepted'
    AND start_time < p_end_time
    AND end_time > p_start_time
    AND (p_booking_id IS NULL OR id != p_booking_id);
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Función para generar slots de tiempo disponibles
CREATE OR REPLACE FUNCTION generate_available_slots(
  p_artist_id INTEGER,
  p_date DATE,
  p_slot_duration_minutes INTEGER DEFAULT 60
) RETURNS TIME[] AS $$
DECLARE
  available_slots TIME[] := '{}';
  rule RECORD;
  current_time TIME;
  end_time TIME;
  blocked BOOLEAN;
  booking RECORD;
BEGIN
  -- Buscar regla de disponibilidad para ese día
  FOR rule IN 
    SELECT * FROM availability_rules 
    WHERE artist_id = p_artist_id 
      AND day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
      AND is_active = true
  LOOP
    current_time := rule.start_time;
    end_time := rule.end_time;
    
    -- Generar slots mientras haya tiempo disponible
    WHILE current_time + (p_slot_duration_minutes || ' minutes')::INTERVAL <= end_time LOOP
      blocked := false;
      
      -- Verificar si el slot está bloqueado por alguna reserva aceptada
      FOR booking IN 
        SELECT * FROM artist_bookings
        WHERE artist_id = p_artist_id
          AND event_date = p_date
          AND status = 'accepted'
          AND start_time <= current_time
          AND end_time > current_time
      LOOP
        blocked := true;
        EXIT;
      END LOOP;
      
      -- Si no está bloqueado, agregar al array
      IF NOT blocked THEN
        available_slots := array_append(available_slots, current_time);
      END IF;
      
      -- Avanzar al siguiente slot
      current_time := current_time + (p_slot_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
  
  RETURN available_slots;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas
CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_dates_updated_at
  BEFORE UPDATE ON blocked_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artist_bookings_updated_at
  BEFORE UPDATE ON artist_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE availability_rules IS 'Reglas de disponibilidad semanal de artistas';
COMMENT ON TABLE blocked_dates IS 'Fechas específicas bloqueadas por artistas (vacaciones, eventos personales)';
COMMENT ON TABLE artist_bookings IS 'Reservas de clientes para servicios de artistas';
COMMENT ON FUNCTION check_booking_conflict IS 'Verifica si una nueva reserva conflictúa con existentes';
COMMENT ON FUNCTION generate_available_slots IS 'Genera array de horarios disponibles para una fecha específica';

-- ============================================
-- MENSAJE DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de disponibilidad de artistas creado exitosamente';
    RAISE NOTICE '📅 Tablas: availability_rules, blocked_dates, artist_bookings';
    RAISE NOTICE '🔒 RLS configurado para seguridad';
    RAISE NOTICE '⚡ Funciones de utilidad listas';
    RAISE NOTICE '🚀 Sistema de agenda listo para usar';
END $$;
