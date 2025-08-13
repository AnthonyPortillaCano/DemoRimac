-- MySQL schema for Softtek Rimac API

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(100) NOT NULL,
  type ENUM('fused','custom') NOT NULL,
  timestamp BIGINT NOT NULL,
  data JSON NOT NULL,
  ttl BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_type_timestamp (type, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 