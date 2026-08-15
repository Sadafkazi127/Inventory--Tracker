-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: shopmaster
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('fe2c2d74-bc01-4a8c-93de-3c858f92816c','Grocery'),('fa9ce8c0-56b5-4146-8c62-716fd299a6d1','Stationary');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `customers_phone_idx` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('dc5fb3f7-8e07-422f-8c81-acf167b93ad2','Neha Panchal','9867843218','neha@gmail.com','2026-08-11 15:20:17');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_logs` (
  `id` varchar(36) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `type` enum('in','out','adjustment') NOT NULL,
  `quantity` int NOT NULL,
  `previous_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `inventory_logs_product_idx` (`product_id`),
  KEY `inventory_logs_created_at_idx` (`created_at`),
  CONSTRAINT `inventory_logs_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES ('032c2567-ef8c-437b-9bda-899a24ccd9eb','1f5f3836-3ca3-47cc-8f27-607d9cac95c0','Sugar','out',3,78,75,'Sale: INV-00002','2026-08-12 09:10:18'),('1c07ba7f-78e3-44e7-ba2f-c9c5a1e6e7a6','31a2fda9-ff57-4ab9-86ea-a4aff54105b2','Salt','out',3,50,47,'Sale: INV-00002','2026-08-12 09:10:18'),('2bb1d5b7-38af-43bd-b0c2-f0884a2ad9a9','bff45a4a-d4cf-40e7-aa12-0c9de8b64e69','Pencil','out',3,50,47,'Sale: INV-00002','2026-08-12 09:10:18'),('fecaacd4-7de3-410e-9f8e-fd5858e01959','1f5f3836-3ca3-47cc-8f27-607d9cac95c0','Sugar','out',2,80,78,'Sale: INV-00001','2026-08-12 09:00:18');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_counter`
--

DROP TABLE IF EXISTS `invoice_counter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_counter` (
  `id` varchar(8) NOT NULL DEFAULT '1',
  `value` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_counter`
--

LOCK TABLES `invoice_counter` WRITE;
/*!40000 ALTER TABLE `invoice_counter` DISABLE KEYS */;
INSERT INTO `invoice_counter` VALUES ('1',2);
/*!40000 ALTER TABLE `invoice_counter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `purchase_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `selling_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(30) NOT NULL DEFAULT 'pcs',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `products_barcode_idx` (`barcode`),
  KEY `products_category_idx` (`category_id`),
  CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('1f5f3836-3ca3-47cc-8f27-607d9cac95c0','Sugar',NULL,'Grocery',NULL,55.00,65.00,75,'kg','2026-08-11 15:18:49','2026-08-12 09:10:18'),('31a2fda9-ff57-4ab9-86ea-a4aff54105b2','Salt',NULL,'Grocery',NULL,30.00,20.00,47,'pcs','2026-08-11 15:19:45','2026-08-12 09:10:18'),('bff45a4a-d4cf-40e7-aa12-0c9de8b64e69','Pencil',NULL,'Stationary',NULL,10.00,20.00,47,'pcs','2026-08-11 15:22:24','2026-08-12 09:10:18');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` varchar(36) NOT NULL,
  `sale_id` varchar(36) NOT NULL,
  `product_id` varchar(36) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_items_product_id_products_id_fk` (`product_id`),
  KEY `sale_items_sale_idx` (`sale_id`),
  CONSTRAINT `sale_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES ('73fa4457-3063-4591-858c-a9ffeda5910f','e012796e-26a5-4360-9c1d-0743ab5e4a93','31a2fda9-ff57-4ab9-86ea-a4aff54105b2','Salt','pcs',3,20.00,60.00),('7e584867-b1fb-465e-a005-ec8c55ef2e31','c5adc502-1199-4e11-835d-9af9d85c771e','1f5f3836-3ca3-47cc-8f27-607d9cac95c0','Sugar','kg',2,65.00,130.00),('8e52ddbf-4b59-47ec-b80a-2ae3c2d95b54','e012796e-26a5-4360-9c1d-0743ab5e4a93','1f5f3836-3ca3-47cc-8f27-607d9cac95c0','Sugar','kg',3,65.00,195.00),('a854a8f8-809d-41b6-84de-eccf2a44c54b','e012796e-26a5-4360-9c1d-0743ab5e4a93','bff45a4a-d4cf-40e7-aa12-0c9de8b64e69','Pencil','pcs',3,20.00,60.00);
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` varchar(36) NOT NULL,
  `invoice_number` varchar(30) NOT NULL,
  `customer_id` varchar(36) DEFAULT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_type` enum('percent','amount') NOT NULL DEFAULT 'amount',
  `gst` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','upi','card') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `status` enum('pending','completed') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sales_invoice_number_unique` (`invoice_number`),
  KEY `sales_created_at_idx` (`created_at`),
  KEY `sales_customer_idx` (`customer_id`),
  CONSTRAINT `sales_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES ('c5adc502-1199-4e11-835d-9af9d85c771e','INV-00001','dc5fb3f7-8e07-422f-8c81-acf167b93ad2','Neha Panchal',130.00,0.00,'percent',23.40,18.00,153.40,'cash','2026-08-12 09:00:18','pending'),('e012796e-26a5-4360-9c1d-0743ab5e4a93','INV-00002',NULL,NULL,315.00,10.00,'amount',54.90,18.00,359.90,'cash','2026-08-12 09:10:18','pending');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_settings`
--

DROP TABLE IF EXISTS `shop_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_settings` (
  `id` varchar(8) NOT NULL DEFAULT '1',
  `name` varchar(150) NOT NULL DEFAULT 'My Shop',
  `address` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(30) NOT NULL DEFAULT '',
  `email` varchar(150) NOT NULL DEFAULT '',
  `gst_number` varchar(30) NOT NULL DEFAULT '',
  `currency` varchar(5) NOT NULL DEFAULT 'Γé╣',
  `gst_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `gst_percent` decimal(5,2) NOT NULL DEFAULT '18.00',
  `low_stock_threshold` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_settings`
--

LOCK TABLES `shop_settings` WRITE;
/*!40000 ALTER TABLE `shop_settings` DISABLE KEYS */;
INSERT INTO `shop_settings` VALUES ('1','My Shop','','','','','Γé╣',1,18.00,10);
/*!40000 ALTER TABLE `shop_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','cashier') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('c3636a87-8be8-4a9f-8543-5cebf884c17d','--','$2a$10$O/kU1xPN.tu0s2hANqWlEO5S0Revf.8mDhiqt/9ICf/UE2vtzhnx6','admin','2026-08-11 15:10:22'),('cf3aa7df-1511-460b-bfff-b28d31632240','admin','$2a$10$ZsLJ8C5yOR4mnlpV0K1m7ehh94JsGPvJB82qbRuRMq2geuNl6KY8q','admin','2026-08-11 13:17:14');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-15 20:02:00
