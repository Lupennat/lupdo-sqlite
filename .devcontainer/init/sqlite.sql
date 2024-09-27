DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "companies";
DROP TABLE IF EXISTS "types";
CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT,"name" TEXT NOT NULL,"gender" TEXT NOT NULL);
CREATE TABLE "companies" ("id" INTEGER PRIMARY KEY AUTOINCREMENT,"name" TEXT NOT NULL, "opened" TEXT NOT NULL, "active" REAL NOT NULL,"binary" BLOB NULL);
CREATE TABLE "types" (
"int" INT NULL,
"integer" INTEGER NULL,
"tinyint" TINYINT NULL,
"smallint" SMALLINT NULL,
"mediumint" MEDIUMINT NULL,
"bigint" BIGINT NULL,
"unsigned_big_int" UNSIGNED BIG INT NULL,
"int2" INT2 NULL,
"int8" INT8 NULL,
"character" CHARACTER(20) NULL,
"varchar" VARCHAR(255) NULL,
"varying_character" VARYING CHARACTER(255) NULL,
"nchar" NCHAR(55) NULL,
"native_character" NATIVE CHARACTER(70) NULL,
"nvarchar" NVARCHAR(100) NULL,
"text" TEXT NULL,
"clob" CLOB NULL,
"blob" BLOB NULL,
"real" REAL NULL,
"double" DOUBLE NULL,
"double_precision" DOUBLE PRECISION NULL,
"float" FLOAT NULL,
"numeric" NUMERIC NULL,
"decimal" DECIMAL(10,5) NULL,
"boolean" BOOLEAN NULL,
"date" DATE NULL,
"datetime" DATETIME NULL
);
INSERT INTO "users" (`name`, `gender`) VALUES ("Edmund","Multigender");
INSERT INTO "users" (`name`, `gender`) VALUES ("Kyleigh","Cis man");
INSERT INTO "users" (`name`, `gender`) VALUES ("Josefa","Cisgender male");
INSERT INTO "users" (`name`, `gender`) VALUES ("Cecile","Agender");
INSERT INTO "users" (`name`, `gender`) VALUES ("Sincere","Demi-girl");
INSERT INTO "users" (`name`, `gender`) VALUES ("Baron","Cisgender male");
INSERT INTO "users" (`name`, `gender`) VALUES ("Mckayla","Genderflux");
INSERT INTO "users" (`name`, `gender`) VALUES ("Wellington","Cisgender woman");
INSERT INTO "users" (`name`, `gender`) VALUES ("Tod","Demi-man");
INSERT INTO "users" (`name`, `gender`) VALUES ("Jeffrey","Androgyne");
INSERT INTO "users" (`name`, `gender`) VALUES ("Keenan","Two-spirit person");
INSERT INTO "users" (`name`, `gender`) VALUES ("Lucile","Man");
INSERT INTO "users" (`name`, `gender`) VALUES ("Kyra","Other");
INSERT INTO "users" (`name`, `gender`) VALUES ("Jermain","Gender neutral");
INSERT INTO "users" (`name`, `gender`) VALUES ("Kelli","Agender");
INSERT INTO "users" (`name`, `gender`) VALUES ("Jeffry","Two-spirit person");
INSERT INTO "users" (`name`, `gender`) VALUES ("Dawn","Male to female");
INSERT INTO "users" (`name`, `gender`) VALUES ("Ofelia","Cis female");
INSERT INTO "users" (`name`, `gender`) VALUES ("Icie","F2M");
INSERT INTO "users" (`name`, `gender`) VALUES ("Matilde","Trans");
INSERT INTO "users" (`name`, `gender`) VALUES ("Marcelina","Transgender female");
INSERT INTO "users" (`name`, `gender`) VALUES ("Destin","Male to female transsexual woman");
INSERT INTO "users" (`name`, `gender`) VALUES ("Reilly","Intersex man");
INSERT INTO "users" (`name`, `gender`) VALUES ("Casimer","Other");
INSERT INTO "users" (`name`, `gender`) VALUES ("Carli","Bigender");
INSERT INTO "users" (`name`, `gender`) VALUES ("Harry","Cis man");
INSERT INTO "users" (`name`, `gender`) VALUES ("Ellie","Omnigender");
INSERT INTO "users" (`name`, `gender`) VALUES ("Solon","Gender neutral");
INSERT INTO "users" (`name`, `gender`) VALUES ("Lesley","Cis");
INSERT INTO "users" (`name`, `gender`) VALUES ("Nikolas","Agender");
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Satterfield Inc", '2022-10-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Grimes - Reinger", '2022-11-22T00:00:00.000Z', 0);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Skiles LLC", '2022-12-12T00:00:00.000Z', 0);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("White, Hermiston and Kihn", '2020-10-01T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Huel LLC", '2018-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Aufderhar - Schroeder", '2019-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Powlowski - VonRueden", '2014-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Murray - Hagenes", '2015-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Bednar LLC", '2013-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Kirlin - Bednar", '2011-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Kassulke - Auer", '2010-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Orn - Pouros", '2021-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Greenfelder - Paucek", '2009-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Hand, Effertz and Shields", '2000-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Harber - Heidenreich", '2001-12-22T00:00:00.000Z', 0);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Greenholt - Durgan", '2000-12-22T00:00:00.000Z', 1);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Hauck - Murazik", '2000-12-22T00:00:00.000Z', 0);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Beier and Sons", '1999-12-22T00:00:00.000Z', 0);
INSERT INTO "companies" (`name`, `opened`, `active`) VALUES ("Harvey Inc", '2022-12-22T00:00:00.000Z', 1);
