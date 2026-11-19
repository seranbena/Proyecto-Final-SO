-- Datos de ejemplo. Postgres ejecuta este archivo la primera vez que arranca
-- con un volumen vacío (busca "docker-entrypoint-initdb.d").
CREATE TABLE sistemas_operativos (
    id     SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    anio   INT  NOT NULL,
    tipo   TEXT NOT NULL
);

INSERT INTO sistemas_operativos (nombre, anio, tipo) VALUES
    ('UNIX',        1969, 'Tiempo compartido'),
    ('MS-DOS',      1981, 'Monousuario'),
    ('Mac OS',      1984, 'Escritorio'),
    ('Linux',       1991, 'Kernel monolítico'),
    ('Windows NT',  1993, 'Kernel híbrido'),
    ('FreeRTOS',    2003, 'Tiempo real'),
    ('iOS',         2007, 'Móvil'),
    ('Android',     2008, 'Móvil');
