CREATE DATABASE IF NOT EXISTS birthday_reminder;
USE birthday_reminder;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS birthdays (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    relationship VARCHAR(30),
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS reminder_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    birthday_id BIGINT UNSIGNED NOT NULL,
    reminder_type ENUM('7_day','1_day') NOT NULL,
    occurrence_year INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (birthday_id, reminder_type, occurrence_year),
    FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
);
