-- Schema para Cloudflare D1 Database
-- Criado a partir do schema Prisma existente

-- Tabela de Produtos
CREATE TABLE Product (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  shopifyId TEXT,
  published BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Tabela de Usuários Admin
CREATE TABLE User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'ADMIN',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Tabela de Pedidos (aspas duplas porque Order é palavra reservada)
CREATE TABLE "Order" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerId INTEGER,
  total REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',
  shippingAddress TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (customerId) REFERENCES "User"(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE OrderItem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  productId INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES "Order"(id),
  FOREIGN KEY (productId) REFERENCES Product(id)
);

-- Tabela de Sessões
CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Índices para performance
CREATE INDEX idx_product_published ON Product(published);
CREATE INDEX idx_product_created ON Product(createdAt);
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_order_created ON "Order"(createdAt);
CREATE INDEX idx_session_expires ON Session(expiresAt);
CREATE INDEX idx_session_user ON Session(userId);

-- ============================================
-- Edge Workers Analytics Tables
-- ============================================

-- Tabela de transformações (analytics)
CREATE TABLE IF NOT EXISTS transformations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  bot_type TEXT NOT NULL,
  transformation_type TEXT DEFAULT 'proxy',
  timestamp INTEGER NOT NULL,
  response_time INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  original_size INTEGER,
  transformed_size INTEGER,
  error_message TEXT
);

CREATE INDEX idx_transformations_timestamp ON transformations(timestamp);
CREATE INDEX idx_transformations_bot_type ON transformations(bot_type);
CREATE INDEX idx_transformations_type ON transformations(transformation_type);
CREATE INDEX idx_transformations_url ON transformations(url);

-- Tabela de cache metadata
CREATE TABLE IF NOT EXISTS cache_metadata (
  key TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed INTEGER
);

CREATE INDEX idx_cache_expires ON cache_metadata(expires_at);
CREATE INDEX idx_cache_url ON cache_metadata(url);
CREATE INDEX idx_cache_hits ON cache_metadata(hit_count DESC);

-- View de analytics por bot
CREATE VIEW IF NOT EXISTS analytics_by_bot AS
SELECT
  bot_type,
  COUNT(*) as total_requests,
  AVG(response_time) as avg_response_time,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  CAST(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as cache_hit_rate,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM transformations
GROUP BY bot_type
ORDER BY total_requests DESC;

-- View de analytics diários
CREATE VIEW IF NOT EXISTS analytics_daily AS
SELECT
  DATE(timestamp / 1000, 'unixepoch') as date,
  bot_type,
  transformation_type,
  COUNT(*) as total_requests,
  AVG(response_time) as avg_response_time,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  CAST(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as cache_hit_rate
FROM transformations
GROUP BY DATE(timestamp / 1000, 'unixepoch'), bot_type, transformation_type
ORDER BY date DESC;

-- View de páginas mais acessadas
CREATE VIEW IF NOT EXISTS popular_pages AS
SELECT
  url,
  COUNT(*) as views,
  COUNT(DISTINCT bot_type) as unique_bots,
  AVG(response_time) as avg_response_time,
  MAX(timestamp) as last_access
FROM transformations
GROUP BY url
ORDER BY views DESC
LIMIT 100;

-- Inserir usuário admin padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO User (email, password, name, role, createdAt, updatedAt)
VALUES (
  'admin@shopmi.com',
  '$2a$10$Hl1VmAa.nFqzNtQa.LquL.8gF3i9RxcXJGvlvSqVbvZBEcMGNmyye',
  'Admin User',
  'ADMIN',
  datetime('now'),
  datetime('now')
);

-- Inserir alguns produtos exemplo
INSERT INTO Product (name, description, price, published, createdAt, updatedAt)
VALUES 
(
  'Smartphone Xiaomi Redmi Note 12',
  'Smartphone com 128GB de armazenamento, 4GB RAM, câmera tripla 50MP',
  899.99,
  TRUE,
  datetime('now'),
  datetime('now')
),
(
  'Fone Xiaomi Mi True Wireless',
  'Fones de ouvido sem fio com cancelamento de ruído ativo',
  199.99,
  TRUE,
  datetime('now'),
  datetime('now')
),
(
  'Carregador Xiaomi 67W',
  'Carregador rápido USB-C 67W com cabo incluso',
  89.99,
  TRUE,
  datetime('now'),
  datetime('now')
);
