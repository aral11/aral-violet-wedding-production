import { getDbConnection, sql } from '../config/database';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  attending: boolean;
  guests: number;
  side: 'groom' | 'bride';
  message?: string;
  dietary_restrictions?: string;
  needs_accommodation: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface WeddingPhoto {
  id: string;
  photo_data: string;
  uploaded_by: string;
  created_at: Date;
}

export interface WeddingFlowItem {
  id: string;
  time: string;
  title: string;
  description: string;
  duration?: string;
  type: 'ceremony' | 'reception' | 'entertainment' | 'meal' | 'special';
  created_at: Date;
  updated_at?: Date;
}

export interface WeddingInvitation {
  id: number;
  pdf_data: string;
  filename?: string;
  uploaded_at: Date;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const pool = await getDbConnection();
    
    // Create guests table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='guests' AND xtype='U')
      CREATE TABLE guests (
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
      )
    `);

    // Create wedding_photos table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wedding_photos' AND xtype='U')
      CREATE TABLE wedding_photos (
        id NVARCHAR(50) PRIMARY KEY,
        photo_data NVARCHAR(MAX) NOT NULL,
        uploaded_by NVARCHAR(100) DEFAULT 'admin',
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create wedding_flow table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wedding_flow' AND xtype='U')
      CREATE TABLE wedding_flow (
        id NVARCHAR(50) PRIMARY KEY,
        time NVARCHAR(10) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        duration NVARCHAR(50),
        type NVARCHAR(20) NOT NULL CHECK (type IN ('ceremony', 'reception', 'entertainment', 'meal', 'special')),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create wedding_invitation table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wedding_invitation' AND xtype='U')
      CREATE TABLE wedding_invitation (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pdf_data NVARCHAR(MAX) NOT NULL,
        filename NVARCHAR(255),
        uploaded_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Insert default wedding flow if table is empty
    const flowResult = await pool.request().query(`SELECT COUNT(*) as count FROM wedding_flow`);
    if (flowResult.recordset[0].count === 0) {
      const defaultFlow = [
        { id: '1', time: '19:00', title: 'Welcome & Cocktails', description: 'Guests arrive and enjoy welcome drinks and appetizers', duration: '30 min', type: 'reception' },
        { id: '2', time: '19:30', title: 'Grand Entrance', description: 'Introduction of the newly married couple', duration: '10 min', type: 'ceremony' },
        { id: '3', time: '20:00', title: 'Dinner Service', description: 'Multi-cuisine buffet dinner', duration: '60 min', type: 'meal' },
        { id: '4', time: '21:00', title: 'Cultural Performances', description: 'Traditional dance and music performances', duration: '45 min', type: 'entertainment' },
        { id: '5', time: '22:00', title: 'Cake Cutting', description: 'Wedding cake cutting ceremony', duration: '15 min', type: 'special' },
        { id: '6', time: '22:30', title: 'Dancing & Celebration', description: 'Open dance floor for all guests', duration: '60 min', type: 'entertainment' },
        { id: '7', time: '23:30', title: 'Send-off', description: 'Farewell and thank you to all guests', duration: '', type: 'ceremony' }
      ];

      for (const item of defaultFlow) {
        await pool.request()
          .input('id', sql.NVarChar, item.id)
          .input('time', sql.NVarChar, item.time)
          .input('title', sql.NVarChar, item.title)
          .input('description', sql.NVarChar, item.description)
          .input('duration', sql.NVarChar, item.duration)
          .input('type', sql.NVarChar, item.type)
          .query(`
            INSERT INTO wedding_flow (id, time, title, description, duration, type)
            VALUES (@id, @time, @title, @description, @duration, @type)
          `);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
