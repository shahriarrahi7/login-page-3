-- SQL Server Database and Table Setup Script for Login Page 3

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UserAuthDB')
BEGIN
    CREATE DATABASE UserAuthDB;
    PRINT 'Database UserAuthDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database UserAuthDB already exists.';
END
GO

USE UserAuthDB;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(256) NOT NULL,
        PasswordSalt NVARCHAR(256) NOT NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'user',
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Users created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Users already exists.';
END
GO
