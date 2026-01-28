CREATE DATABASE IF NOT EXISTS cropverse;
USE cropverse;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer','buyer','admin') NOT NULL,
  district VARCHAR(120) NULL,
  profile_image VARCHAR(255) NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EMAIL OTP / CONFIRMATION
CREATE TABLE IF NOT EXISTS email_otps (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose ENUM('signup_verify') NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(email),
  INDEX(expires_at)
);

-- CROPS
CREATE TABLE IF NOT EXISTS crops (
  crop_id INT AUTO_INCREMENT PRIMARY KEY,
  crop_name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(120) NULL
);

-- LISTINGS
CREATE TABLE IF NOT EXISTS crop_listings (
  listing_id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  status ENUM('Available','Sold') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
  INDEX(crop_id),
  INDEX(status)
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  buyer_id INT NOT NULL,
  quantity_bought_kg DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES crop_listings(listing_id),
  FOREIGN KEY (buyer_id) REFERENCES users(user_id),
  INDEX(transaction_date)
);

-- PRICE TRENDS (monthly)
CREATE TABLE IF NOT EXISTS price_trends (
  crop_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  avg_price DECIMAL(10,2) NOT NULL,
  sample_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (crop_id, year, month),
  FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
);

-- DISEASE REPORTS
CREATE TABLE IF NOT EXISTS disease_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_id INT NOT NULL,
  severity INT NOT NULL,
  notes VARCHAR(500) NULL,
  report_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  FOREIGN KEY (crop_id) REFERENCES crops(crop_id),
  INDEX(severity),
  INDEX(report_date)
);

-- ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  alert_type VARCHAR(120) NOT NULL,
  message VARCHAR(400) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(user_id),
  INDEX(created_at)
);

-- ---------------------------
-- TRIGGER: Severe disease => alert
-- ---------------------------
DELIMITER $$
CREATE TRIGGER trg_disease_alert
AFTER INSERT ON disease_reports
FOR EACH ROW
BEGIN
  IF NEW.severity >= 8 THEN
    INSERT INTO alerts(farmer_id, alert_type, message, created_at)
    VALUES (NEW.farmer_id, 'Disease Warning', 'Severe disease reported for your crop area. Take action quickly!', NOW());
  END IF;
END$$
DELIMITER ;

-- ---------------------------
-- TRIGGER: Update monthly price trend after transaction
-- avg_price stored as incremental average using sample_count
-- ---------------------------
DELIMITER $$
CREATE TRIGGER trg_update_price_trend
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
  DECLARE v_crop_id INT;
  DECLARE v_year INT;
  DECLARE v_month INT;
  DECLARE v_unit_price DECIMAL(10,2);

  SELECT crop_id INTO v_crop_id FROM crop_listings WHERE listing_id = NEW.listing_id;
  SET v_year = YEAR(NEW.transaction_date);
  SET v_month = MONTH(NEW.transaction_date);
  SET v_unit_price = NEW.total_price / NEW.quantity_bought_kg;

  INSERT INTO price_trends(crop_id, year, month, avg_price, sample_count)
  VALUES (v_crop_id, v_year, v_month, v_unit_price, 1)
  ON DUPLICATE KEY UPDATE
    avg_price = (avg_price * sample_count + v_unit_price) / (sample_count + 1),
    sample_count = sample_count + 1;
END$$
DELIMITER ;

-- ---------------------------
-- Stored Procedure: Yield Insight (simple demo)
-- (You can extend with soil_weather later)
-- ---------------------------
DELIMITER $$
CREATE PROCEDURE sp_yield_insight(IN p_farmer_id INT, IN p_crop_id INT)
BEGIN
  -- Simple heuristic demo using last 3 yields (if you add yield_history table)
  SELECT 'Expected yield: Medium / Slightly Below Average (demo)' AS insight;
END$$
DELIMITER ;

-- ---------------------------
-- CHAT (polling)
-- ---------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
  thread_id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT NOT NULL,
  farmer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_thread (buyer_id, farmer_id),
  FOREIGN KEY (buyer_id) REFERENCES users(user_id),
  FOREIGN KEY (farmer_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NULL,
  message_type ENUM('text','image') NOT NULL DEFAULT 'text',
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(thread_id),
  FOREIGN KEY (sender_id) REFERENCES users(user_id),
  INDEX(thread_id),
  INDEX(created_at)
);

-- SEED CROPS
INSERT IGNORE INTO crops (crop_name, category) VALUES
('Rice','Grain'),
('Wheat','Grain'),
('Potato','Vegetable'),
('Onion','Vegetable'),
('Tomato','Vegetable'),
('Jute','Fiber');
