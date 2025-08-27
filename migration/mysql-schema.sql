-- MySQL Schema for Obituary App
-- Run this in your MySQL database to create all tables

USE `obituary-db`;

-- Users table
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `password` text NOT NULL,
  `company` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `secondaryCity` varchar(100) DEFAULT NULL,
  `role` enum('USER','FUNERAL_COMPANY','FLORIST','SUPERADMIN') NOT NULL DEFAULT 'USER',
  `slugKey` varchar(500) DEFAULT NULL,
  `createObituaryPermission` tinyint(1) DEFAULT '0',
  `assignKeeperPermission` tinyint(1) DEFAULT '0',
  `sendGiftsPermission` tinyint(1) DEFAULT '0',
  `sendMobilePermission` tinyint(1) DEFAULT '0',
  `isBlocked` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text,
  `adminRating` varchar(1) DEFAULT NULL,
  `hasFlorist` tinyint(1) NOT NULL DEFAULT '0',
  `isPaid` tinyint(1) NOT NULL DEFAULT '0',
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `slugKey` (`slugKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens table
CREATE TABLE `refreshTokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `token` text NOT NULL,
  `expiresAt` datetime NOT NULL,
  `isValid` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `refreshTokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company pages table
CREATE TABLE `company_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `companyName` varchar(100) NOT NULL,
  `description` text,
  `address` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(200) DEFAULT NULL,
  `logo` text,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `company_pages_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cemeteries table
CREATE TABLE `cemetries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `userId` int DEFAULT NULL,
  `companyId` int DEFAULT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `cemetries_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cemetries_ibfk_2` FOREIGN KEY (`companyId`) REFERENCES `company_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Obituaries table
CREATE TABLE `obituaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `sirName` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `region` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `gender` enum('Male','Female') DEFAULT 'Male',
  `birthDate` date NOT NULL,
  `deathDate` date NOT NULL,
  `image` text,
  `funeralLocation` varchar(100) DEFAULT NULL,
  `funeralCemetery` int DEFAULT NULL,
  `funeralTimestamp` datetime DEFAULT NULL,
  `events` json DEFAULT NULL,
  `deathReportExists` tinyint(1) NOT NULL DEFAULT '1',
  `deathReport` text,
  `obituary` text NOT NULL,
  `symbol` varchar(100) DEFAULT NULL,
  `verse` varchar(60) DEFAULT NULL,
  `totalCandles` int NOT NULL DEFAULT '0',
  `totalVisits` int NOT NULL DEFAULT '0',
  `currentWeekVisits` int NOT NULL DEFAULT '0',
  `lastWeeklyReset` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `slugKey` varchar(500) NOT NULL,
  `cardImages` json DEFAULT (_utf8mb4'[]'),
  `cardPdfs` json DEFAULT (_utf8mb4'[]'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slugKey` (`slugKey`),
  KEY `userId` (`userId`),
  KEY `funeralCemetery` (`funeralCemetery`),
  CONSTRAINT `obituaries_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `obituaries_ibfk_2` FOREIGN KEY (`funeralCemetery`) REFERENCES `cemetries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Events table
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Photos table
CREATE TABLE `photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fileUrl` varchar(500) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `userId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `photos_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Candles table
CREATE TABLE `candles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expiry` datetime DEFAULT NULL,
  `ipAddress` varchar(100) NOT NULL,
  `userId` int DEFAULT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `candles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `candles_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Visits table
CREATE TABLE `visits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expiry` datetime DEFAULT NULL,
  `ipAddress` varchar(100) NOT NULL,
  `userId` int DEFAULT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Condolences table
CREATE TABLE `condolences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `message` text,
  `relation` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `isCustomMessage` tinyint(1) NOT NULL,
  `userId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `condolences_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `condolences_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dedications table
CREATE TABLE `dedications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `message` text,
  `relation` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `userId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `dedications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `dedications_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sorrow book table
CREATE TABLE `sorrow_book` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `relation` varchar(100) DEFAULT NULL,
  `userId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `sorrow_book_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `sorrow_book_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Memory logs table
CREATE TABLE `memory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text,
  `userId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `memory_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `memory_logs_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Keepers table
CREATE TABLE `keepers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `keepers_ibfk_1` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reports table
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reason` varchar(200) NOT NULL,
  `description` text,
  `reporterEmail` varchar(100) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `obituaryId` int DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `obituaryId` (`obituaryId`),
  KEY `userId` (`userId`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cards table
CREATE TABLE `cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `email` varchar(100) NOT NULL,
  `cardId` int NOT NULL,
  `obituaryId` int NOT NULL,
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `obituaryId` (`obituaryId`),
  CONSTRAINT `cards_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `cards_ibfk_2` FOREIGN KEY (`obituaryId`) REFERENCES `obituaries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Packages table
CREATE TABLE `packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL,
  `features` json DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FAQ table
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `companyId` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `faqs_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Florist slides table
CREATE TABLE `florist_slides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `imageUrl` text NOT NULL,
  `linkUrl` text,
  `companyId` int NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `florist_slides_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Florist shops table
CREATE TABLE `florist_shops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `imageUrl` text,
  `price` decimal(10,2) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `companyId` int NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modifiedTimestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `companyId` (`companyId`),
  CONSTRAINT `florist_shops_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
