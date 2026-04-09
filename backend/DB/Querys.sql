
-- Config commands for Database / Doku only
SHOW shared_buffers;
SHOW work_mem;
SHOW all;  -- zeigt ALLE Parameter

-- ═══════════════════════════════════════════════════════
-- AirAware PostgreSQL Performance Config
-- Server: 32GB RAM | 12 Kerne | 500 Verbindungen
-- ═══════════════════════════════════════════════════════

-- MEMORY
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '20GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET wal_buffers = '64MB';

-- VERBINDUNGEN
ALTER SYSTEM SET max_connections = '600';

-- CPU (12 Kerne)
ALTER SYSTEM SET max_worker_processes = '12';
ALTER SYSTEM SET max_parallel_workers = '8';
ALTER SYSTEM SET max_parallel_workers_per_gather = '2';
ALTER SYSTEM SET max_parallel_maintenance_workers = '4';

-- STORAGE (SSD → 1.1 | HDD → 4.0 lassen)
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';

-- WAL / CHECKPOINTS
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET max_wal_size = '8GB';
ALTER SYSTEM SET min_wal_size = '1GB';

-- LOGGING
ALTER SYSTEM SET log_min_duration_statement = '500';

-- ANWENDEN
SELECT pg_reload_conf();

-- ═══════════════════════════════════════════════════════
-- DANACH: PostgreSQL Dienst neu starten! (services.msc)
-- postgresql-x64-18 → Neu starten
-- (nötig für shared_buffers, max_connections, max_worker_processes)
-- ═══════════════════════════════════════════════════════

-- PRÜFEN ob alles übernommen wurde:
SELECT name, setting, unit
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'work_mem', 'effective_cache_size',
  'maintenance_work_mem', 'wal_buffers', 'max_connections',
  'max_parallel_workers', 'random_page_cost',
  'effective_io_concurrency', 'max_wal_size'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- workspace / for active querys
select * from sensor_readings

-- einträge des users welche regeln er haben will für den alert
select * from alert_thresholds

-- speichert alle verstöße die gesetzt wurden bzw. wenn diese überschritten sind im threshhold
select * from alerts

select * from users

-- password user moritz = Qwe123! einfach in DB auf server kopieren so 

delete * from sensor_readings
