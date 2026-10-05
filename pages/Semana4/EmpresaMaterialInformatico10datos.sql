-- =====================================================================
-- ACTIVIDAD 02 - ENUNCIADO 02: EMPRESA DE MATERIAL INFORMATICO
-- Modelo fisico para SQL Server
--
-- Este script crea la base de datos EmpresaMaterialInformatico desde
-- cero. Si ya existe una con ese nombre, la elimina y la vuelve a crear.
-- =====================================================================

USE master;
GO

IF DB_ID(N'EmpresaMaterialInformatico') IS NOT NULL
BEGIN
    ALTER DATABASE EmpresaMaterialInformatico SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE EmpresaMaterialInformatico;
END
GO

CREATE DATABASE EmpresaMaterialInformatico;
GO

USE EmpresaMaterialInformatico;
GO

-- ---------------------------------------------------------------------
-- SECCION: se identifica por un id y un nombre de seccion.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Seccion (
    IdSeccion      INT          IDENTITY(1,1) NOT NULL,
    NombreSeccion  VARCHAR(60)  NOT NULL,

    CONSTRAINT PK_Seccion PRIMARY KEY (IdSeccion),
    CONSTRAINT UQ_Seccion_Nombre UNIQUE (NombreSeccion)
);
GO

-- ---------------------------------------------------------------------
-- EMPLEADO: NIF, nombre, apellidos y la seccion donde trabaja.
-- Un empleado trabaja en una unica seccion.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Empleado (
    NIF        VARCHAR(9)    NOT NULL,
    Nombre     VARCHAR(60)   NOT NULL,
    Apellidos  VARCHAR(100)  NOT NULL,
    IdSeccion  INT           NOT NULL,

    CONSTRAINT PK_Empleado PRIMARY KEY (NIF),
    CONSTRAINT FK_Empleado_Seccion
        FOREIGN KEY (IdSeccion) REFERENCES dbo.Seccion(IdSeccion),
    CONSTRAINT CHK_Empleado_NIF CHECK (LEN(NIF) >= 8)
);
GO

-- ---------------------------------------------------------------------
-- CLIENTE: NIF, nombre, apellidos, domicilio, ciudad, provincia
-- y telefono.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Cliente (
    NIF        VARCHAR(9)    NOT NULL,
    Nombre     VARCHAR(60)   NOT NULL,
    Apellidos  VARCHAR(100)  NOT NULL,
    Domicilio  VARCHAR(150)  NOT NULL,
    Ciudad     VARCHAR(60)   NOT NULL,
    Provincia  VARCHAR(60)   NOT NULL,
    Telefono   VARCHAR(15)   NULL,

    CONSTRAINT PK_Cliente PRIMARY KEY (NIF),
    CONSTRAINT CHK_Cliente_NIF CHECK (LEN(NIF) >= 8)
);
GO

-- ---------------------------------------------------------------------
-- EQUIPO: codigo de equipo, descripcion, precio y stock disponible.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Equipo (
    CodigoEquipo  VARCHAR(10)    NOT NULL,
    Descripcion   VARCHAR(200)   NOT NULL,
    Precio        DECIMAL(10,2)  NOT NULL,
    Stock         INT            NOT NULL DEFAULT 0,

    CONSTRAINT PK_Equipo PRIMARY KEY (CodigoEquipo),
    CONSTRAINT CHK_Equipo_Precio CHECK (Precio >= 0),
    CONSTRAINT CHK_Equipo_Stock  CHECK (Stock >= 0)
);
GO

-- ---------------------------------------------------------------------
-- COMPONENTE: codigo de componente, descripcion, precio y stock.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Componente (
    CodigoComponente  VARCHAR(10)    NOT NULL,
    Descripcion       VARCHAR(200)   NOT NULL,
    Precio            DECIMAL(10,2)  NOT NULL,
    Stock             INT            NOT NULL DEFAULT 0,

    CONSTRAINT PK_Componente PRIMARY KEY (CodigoComponente),
    CONSTRAINT CHK_Componente_Precio CHECK (Precio >= 0),
    CONSTRAINT CHK_Componente_Stock  CHECK (Stock >= 0)
);
GO

-- ---------------------------------------------------------------------
-- EQUIPO_COMPONENTE: un equipo consta de varios componentes y se
-- guarda la cantidad de cada componente que se necesita.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.EquipoComponente (
    CodigoEquipo      VARCHAR(10)  NOT NULL,
    CodigoComponente  VARCHAR(10)  NOT NULL,
    Cantidad          INT          NOT NULL,

    CONSTRAINT PK_EquipoComponente PRIMARY KEY (CodigoEquipo, CodigoComponente),
    CONSTRAINT FK_EquipoComponente_Equipo
        FOREIGN KEY (CodigoEquipo) REFERENCES dbo.Equipo(CodigoEquipo),
    CONSTRAINT FK_EquipoComponente_Componente
        FOREIGN KEY (CodigoComponente) REFERENCES dbo.Componente(CodigoComponente),
    CONSTRAINT CHK_EquipoComponente_Cantidad CHECK (Cantidad > 0)
);
GO

-- ---------------------------------------------------------------------
-- COMPRA: cada compra la hace un cliente en una fecha y en ella
-- interviene un empleado. Como cada compra es un registro distinto, un
-- mismo cliente puede comprar lo mismo en diferentes fechas y queda el
-- historico completo.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.Compra (
    IdCompra     INT         IDENTITY(1,1) NOT NULL,
    NIFCliente   VARCHAR(9)  NOT NULL,
    NIFEmpleado  VARCHAR(9)  NOT NULL,
    FechaCompra  DATE        NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),

    CONSTRAINT PK_Compra PRIMARY KEY (IdCompra),
    CONSTRAINT FK_Compra_Cliente
        FOREIGN KEY (NIFCliente) REFERENCES dbo.Cliente(NIF),
    CONSTRAINT FK_Compra_Empleado
        FOREIGN KEY (NIFEmpleado) REFERENCES dbo.Empleado(NIF)
);
GO

-- ---------------------------------------------------------------------
-- COMPRA_EQUIPO: equipos completos incluidos en cada compra y cantidad.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.CompraEquipo (
    IdCompra      INT          NOT NULL,
    CodigoEquipo  VARCHAR(10)  NOT NULL,
    Cantidad      INT          NOT NULL,

    CONSTRAINT PK_CompraEquipo PRIMARY KEY (IdCompra, CodigoEquipo),
    CONSTRAINT FK_CompraEquipo_Compra
        FOREIGN KEY (IdCompra) REFERENCES dbo.Compra(IdCompra),
    CONSTRAINT FK_CompraEquipo_Equipo
        FOREIGN KEY (CodigoEquipo) REFERENCES dbo.Equipo(CodigoEquipo),
    CONSTRAINT CHK_CompraEquipo_Cantidad CHECK (Cantidad > 0)
);
GO

-- ---------------------------------------------------------------------
-- COMPRA_COMPONENTE: componentes sueltos incluidos en cada compra
-- y cantidad.
-- ---------------------------------------------------------------------
CREATE TABLE dbo.CompraComponente (
    IdCompra          INT          NOT NULL,
    CodigoComponente  VARCHAR(10)  NOT NULL,
    Cantidad          INT          NOT NULL,

    CONSTRAINT PK_CompraComponente PRIMARY KEY (IdCompra, CodigoComponente),
    CONSTRAINT FK_CompraComponente_Compra
        FOREIGN KEY (IdCompra) REFERENCES dbo.Compra(IdCompra),
    CONSTRAINT FK_CompraComponente_Componente
        FOREIGN KEY (CodigoComponente) REFERENCES dbo.Componente(CodigoComponente),
    CONSTRAINT CHK_CompraComponente_Cantidad CHECK (Cantidad > 0)
);
GO

-- =====================================================================
-- DATOS DE EJEMPLO (para poder visualizar la base de datos)
-- =====================================================================

INSERT INTO dbo.Seccion (NombreSeccion) VALUES
('Ventas'),
('Almacen'),
('Atencion al cliente');
GO

INSERT INTO dbo.Empleado (NIF, Nombre, Apellidos, IdSeccion) VALUES
('11111111A', 'Ana',   'Lopez Garcia', 1),
('22222222B', 'Luis',  'Perez Ruiz',   1),
('33333333C', 'Marta', 'Sanchez Gil',  3);
GO

INSERT INTO dbo.Cliente (NIF, Nombre, Apellidos, Domicilio, Ciudad, Provincia, Telefono) VALUES
('88888888H', 'Javier', 'Ortiz Ramos', 'Calle Alcala 20',          'Madrid',   'Madrid',   '600888888'),
('99999999J', 'Sofia',  'Blanco Lara', 'Avenida Constitucion 8',   'Sevilla',  'Sevilla',  '600999999'),
('10101010K', 'Diego',  'Vidal Paz',   'Calle Colon 3',            'Valencia', 'Valencia', NULL);
GO

INSERT INTO dbo.Componente (CodigoComponente, Descripcion, Precio, Stock) VALUES
('CP001', 'Procesador 8 nucleos',         250.00,  40),
('CP002', 'Memoria RAM 8GB',               45.00, 120),
('CP003', 'Disco SSD 512GB',               60.00,  80),
('CP004', 'Placa base',                   120.00,  35),
('CP005', 'Fuente de alimentacion 550W',   50.00,  60),
('CP006', 'Tarjeta grafica 8GB',          400.00,  20);
GO

INSERT INTO dbo.Equipo (CodigoEquipo, Descripcion, Precio, Stock) VALUES
('EQ001', 'PC de oficina',  650.00, 15),
('EQ002', 'PC gamer',      1400.00,  8);
GO

INSERT INTO dbo.EquipoComponente (CodigoEquipo, CodigoComponente, Cantidad) VALUES
('EQ001', 'CP001', 1),
('EQ001', 'CP002', 2),
('EQ001', 'CP003', 1),
('EQ001', 'CP004', 1),
('EQ001', 'CP005', 1),
('EQ002', 'CP001', 1),
('EQ002', 'CP002', 4),
('EQ002', 'CP003', 2),
('EQ002', 'CP004', 1),
('EQ002', 'CP005', 1),
('EQ002', 'CP006', 1);
GO

INSERT INTO dbo.Compra (NIFCliente, NIFEmpleado, FechaCompra) VALUES
('88888888H', '11111111A', '2026-03-10'),
('88888888H', '11111111A', '2026-06-15'),
('99999999J', '22222222B', '2026-04-02'),
('10101010K', '33333333C', '2026-05-20');
GO

INSERT INTO dbo.CompraEquipo (IdCompra, CodigoEquipo, Cantidad) VALUES
(1, 'EQ001', 1),
(2, 'EQ001', 1),
(3, 'EQ002', 1);
GO

INSERT INTO dbo.CompraComponente (IdCompra, CodigoComponente, Cantidad) VALUES
(2, 'CP006', 1),
(4, 'CP002', 2),
(4, 'CP003', 1);
GO


-- =====================================================================
-- DATOS ADICIONALES DE PRUEBA: minimo 10 registros por tabla principal
-- =====================================================================

INSERT INTO dbo.Seccion (NombreSeccion) VALUES
('Soporte Tecnico'), ('Compras'), ('Administracion'), ('Sistemas'),
('Logistica'), ('Marketing'), ('Recursos Humanos');
GO

INSERT INTO dbo.Empleado (NIF, Nombre, Apellidos, IdSeccion) VALUES
('44444444D','Pablo','Diaz Torres',2),
('55555555E','Carla','Morales Vega',4),
('66666666F','Jorge','Castillo Ruiz',5),
('77777777G','Elena','Navarro Cruz',6),
('12121212L','Mario','Herrera Soto',7),
('13131313M','Lucia','Ramos Perez',1),
('14141414N','Andres','Vega Molina',3);
GO

INSERT INTO dbo.Cliente (NIF, Nombre, Apellidos, Domicilio, Ciudad, Provincia, Telefono) VALUES
('15151515P','Alberto','Garcia Leon','Calle Sol 14','Madrid','Madrid','611151515'),
('16161616Q','Maria','Torres Diaz','Calle Luna 22','Barcelona','Barcelona','611161616'),
('17171717R','Pedro','Mendoza Gil','Avenida Peru 45','Lima','Lima','611171717'),
('18181818S','Rosa','Castro Vera','Calle Norte 8','Bilbao','Vizcaya','611181818'),
('19191919T','Daniel','Ruiz Mora','Avenida Central 31','Valencia','Valencia','611191919'),
('20202020U','Paula','Santos Rey','Calle Real 7','Sevilla','Sevilla','611202020'),
('21212121V','Hugo','Flores Paz','Calle Comercio 19','Zaragoza','Zaragoza','611212121');
GO

INSERT INTO dbo.Componente (CodigoComponente, Descripcion, Precio, Stock) VALUES
('CP007','Teclado mecanico',85.00,50),
('CP008','Mouse inalambrico',35.00,70),
('CP009','Monitor 24 pulgadas',180.00,30),
('CP010','Gabinete ATX',95.00,25);
GO

INSERT INTO dbo.Equipo (CodigoEquipo, Descripcion, Precio, Stock) VALUES
('EQ003','Laptop empresarial',950.00,12),
('EQ004','PC de diseno',1250.00,10),
('EQ005','Servidor basico',2200.00,5),
('EQ006','Estacion de trabajo',1800.00,7),
('EQ007','PC economica',520.00,20),
('EQ008','Laptop gamer',1650.00,6),
('EQ009','Mini PC',480.00,15),
('EQ010','PC oficina avanzada',780.00,11);
GO

INSERT INTO dbo.EquipoComponente (CodigoEquipo, CodigoComponente, Cantidad) VALUES
('EQ003','CP001',1),('EQ003','CP002',2),('EQ003','CP003',1),
('EQ004','CP001',1),('EQ004','CP006',1),('EQ004','CP009',1),
('EQ005','CP001',2),('EQ005','CP002',4),('EQ006','CP006',1),
('EQ007','CP008',1);
GO

INSERT INTO dbo.Compra (NIFCliente, NIFEmpleado, FechaCompra) VALUES
('15151515P','44444444D','2026-07-01'),
('16161616Q','55555555E','2026-07-03'),
('17171717R','66666666F','2026-07-05'),
('18181818S','77777777G','2026-07-07'),
('19191919T','12121212L','2026-07-10'),
('20202020U','13131313M','2026-07-12'),
('21212121V','14141414N','2026-07-15'),
('88888888H','11111111A','2026-07-18'),
('99999999J','22222222B','2026-07-20'),
('10101010K','33333333C','2026-07-22');
GO

INSERT INTO dbo.CompraEquipo (IdCompra, CodigoEquipo, Cantidad) VALUES
(5,'EQ003',1),(6,'EQ004',1),(7,'EQ005',1),(8,'EQ006',1),(9,'EQ007',2),
(10,'EQ008',1),(11,'EQ009',1),(12,'EQ010',1);
GO

INSERT INTO dbo.CompraComponente (IdCompra, CodigoComponente, Cantidad) VALUES
(5,'CP007',1),(6,'CP008',2),(7,'CP009',2),(8,'CP010',1),(9,'CP007',1),
(10,'CP008',1),(11,'CP009',1),(12,'CP010',2);
GO

-- =====================================================================
-- CONSULTAS DE COMPROBACION
-- =====================================================================

-- Historico de equipos comprados por cada cliente (con fechas)
SELECT c.NIF, c.Nombre, co.FechaCompra, ce.CodigoEquipo, ce.Cantidad
FROM dbo.Cliente c
JOIN dbo.Compra co        ON co.NIFCliente = c.NIF
JOIN dbo.CompraEquipo ce  ON ce.IdCompra = co.IdCompra
ORDER BY c.NIF, co.FechaCompra;
GO

-- Componentes que lleva cada equipo y en que cantidad
SELECT e.CodigoEquipo, e.Descripcion AS Equipo, c.Descripcion AS Componente, ec.Cantidad
FROM dbo.Equipo e
JOIN dbo.EquipoComponente ec ON ec.CodigoEquipo = e.CodigoEquipo
JOIN dbo.Componente c        ON c.CodigoComponente = ec.CodigoComponente
ORDER BY e.CodigoEquipo, c.CodigoComponente;
GO

PRINT 'BASE DE DATOS EmpresaMaterialInformatico CREADA CORRECTAMENTE.';
GO
