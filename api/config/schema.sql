-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    is_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    author_id UUID REFERENCES users(id),
    file_type VARCHAR(20) DEFAULT 'free' CHECK (file_type IN ('free', 'paid', 'premium')),
    price DECIMAL(10,2) DEFAULT 0.00,
    version VARCHAR(50),
    file_url TEXT,
    file_size VARCHAR(50),
    thumbnail_url TEXT,
    platform VARCHAR(50) DEFAULT 'Windows',
    is_verified BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(file_id, user_id)
);

-- Downloads table (tracking)
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    downloaded_at TIMESTAMP DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, file_id)
);

-- Orders table (for paid/premium files)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    file_id UUID REFERENCES files(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_published ON files(is_published);
CREATE INDEX IF NOT EXISTS idx_files_views ON files(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_files_downloads ON files(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_file ON downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Seed default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Samsung', 'samsung', 'Samsung firmware and tools'),
    ('Samsung KNOX File', 'samsung-knox-file', 'Samsung KNOX security files'),
    ('Dump File', 'dump-file', 'EMMC dump files for repair'),
    ('Firmware', 'firmware', 'Stock firmware files'),
    ('Firehose Loader', 'firehose-loader', 'Qualcomm firehose loader files'),
    ('Stock Recovery', 'stock-recovery', 'Stock recovery images'),
    ('FRP Bypass', 'frp-bypass', 'FRP bypass tools and files'),
    ('IMEI Repair', 'imei-repair', 'IMEI repair solutions'),
    ('Dead Boot Repair', 'dead-boot-repair', 'Dead boot recovery files'),
    ('MDM Removal', 'mdm-removal', 'MDM removal tools')
ON CONFLICT (slug) DO NOTHING;
