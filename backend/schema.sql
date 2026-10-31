CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('admin','user') NOT NULL
);

CREATE TABLE IF NOT EXISTS tools (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  image VARCHAR(255) NULL,
  category ENUM('Kamera','Lensa','Stabilizer','Lighting','Lainnya') NOT NULL,
  item_condition ENUM('Baik','Cukup','Kurang') NOT NULL,
  stock_total INT NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tool_id VARCHAR(30) NOT NULL,
  user_id INT NOT NULL,
  purpose VARCHAR(500) NOT NULL,
  status ENUM('Pending','Ditolak','Belum Dikembalikan','Sudah Dikembalikan') NOT NULL DEFAULT 'Pending',
  return_proof VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  returned_at DATETIME NULL,
  FOREIGN KEY (tool_id) REFERENCES tools(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_loans_status (status)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(50) NOT NULL,
  role ENUM('admin','user') NOT NULL,
  activity VARCHAR(255) NOT NULL,
  affected VARCHAR(255) NULL
);
