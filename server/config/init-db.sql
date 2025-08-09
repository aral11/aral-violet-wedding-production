-- Wedding Website Database Schema
-- Run this script to create the necessary tables

-- Guests table for RSVP data
CREATE TABLE IF NOT EXISTS guests (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    attending BIT NOT NULL DEFAULT 1,
    guests INT NOT NULL DEFAULT 1,
    side NVARCHAR(10) NOT NULL CHECK (side IN ('groom', 'bride')),
    message NVARCHAR(MAX),
    dietary_restrictions NVARCHAR(500),
    needs_accommodation BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Wedding photos table
CREATE TABLE IF NOT EXISTS wedding_photos (
    id NVARCHAR(50) PRIMARY KEY,
    photo_data NVARCHAR(MAX) NOT NULL, -- Base64 encoded photo
    uploaded_by NVARCHAR(100) DEFAULT 'admin',
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Wedding flow/timeline table
CREATE TABLE IF NOT EXISTS wedding_flow (
    id NVARCHAR(50) PRIMARY KEY,
    time NVARCHAR(10) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    duration NVARCHAR(50),
    type NVARCHAR(20) NOT NULL CHECK (type IN ('ceremony', 'reception', 'entertainment', 'meal', 'special')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Wedding invitation table
CREATE TABLE IF NOT EXISTS wedding_invitation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    pdf_data NVARCHAR(MAX) NOT NULL, -- Base64 encoded PDF
    filename NVARCHAR(255),
    uploaded_at DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX IX_guests_attending ON guests(attending);
CREATE INDEX IX_guests_side ON guests(side);
CREATE INDEX IX_guests_created_at ON guests(created_at);
CREATE INDEX IX_wedding_flow_time ON wedding_flow(time);
CREATE INDEX IX_wedding_photos_created_at ON wedding_photos(created_at);
