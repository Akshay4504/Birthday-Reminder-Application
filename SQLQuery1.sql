CREATE DATABASE BirthdayReminderApp;
GO
USE BirthdayReminderApp;
GO
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO
-- 3. Create Birthdays Table
CREATE TABLE Birthdays (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    person_name NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    relationship NVARCHAR(50),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    
    -- Add foreign key constraint to link with Users table
    CONSTRAINT FK_Birthdays_Users FOREIGN KEY (user_id)
        REFERENCES Users(id) ON DELETE CASCADE
);
GO
-- 4. Create an index on the user_id for faster lookups
CREATE INDEX IX_Birthdays_UserId ON Birthdays(user_id);
GO


USE BirthdayReminderApp;
GO
-- Drop existing tables
IF OBJECT_ID('dbo.reminder_log', 'U') IS NOT NULL DROP TABLE dbo.reminder_log;
IF OBJECT_ID('dbo.Birthdays', 'U') IS NOT NULL DROP TABLE dbo.Birthdays;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO
-- 1. Create Users Table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    timezone NVARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    email_reminders_enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP
);
GO
-- 2. Create Birthdays Table
CREATE TABLE Birthdays (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    relationship NVARCHAR(30),
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT FK_Birthdays_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
GO
CREATE INDEX IX_Birthdays_UserId ON Birthdays(user_id);
GO
-- 3. Create Reminder Log Table
CREATE TABLE reminder_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    birthday_id INT NOT NULL,
    reminder_type NVARCHAR(20) NOT NULL CHECK (reminder_type IN ('7_day','1_day')),
    occurrence_year INT NOT NULL,
    sent_at DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT UQ_ReminderLog UNIQUE (birthday_id, reminder_type, occurrence_year),
    CONSTRAINT FK_ReminderLog_Birthdays FOREIGN KEY (birthday_id) REFERENCES Birthdays(id) ON DELETE CASCADE
);
GO
