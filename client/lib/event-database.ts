import { supabase } from "./supabase";

// Event Photo Interface
export interface EventPhoto {
  id?: string;
  event_type: 'violet_haldi' | 'aral_roce';
  photo_data: string;
  guest_name: string;
  message?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Event Message Interface
export interface EventMessage {
  id?: string;
  message_key: string;
  title: string;
  subtitle?: string;
  show_countdown: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabase !== null && supabase !== undefined;
};

// Event Database Service
export const eventDatabase = {
  // Event Photos Methods
  photos: {
    async getByEventType(eventType: 'violet_haldi' | 'aral_roce'): Promise<EventPhoto[]> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Event photos require Supabase connection.');
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('event_photos')
          .select('*')
          .eq('event_type', eventType)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error(`Error fetching ${eventType} photos:`, error);
        return [];
      }
    },

    async create(photo: Omit<EventPhoto, 'id' | 'created_at' | 'updated_at'>): Promise<EventPhoto | null> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Event photos require Supabase connection.');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('event_photos')
          .insert([{
            event_type: photo.event_type,
            photo_data: photo.photo_data,
            guest_name: photo.guest_name,
            message: photo.message || null,
            uploaded_by: photo.uploaded_by || 'guest'
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating event photo:', error);
        return null;
      }
    },

    async delete(id: string): Promise<boolean> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Event photos require Supabase connection.');
        return false;
      }

      try {
        const { error } = await supabase
          .from('event_photos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting event photo:', error);
        return false;
      }
    },

    async getAll(): Promise<EventPhoto[]> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Event photos require Supabase connection.');
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('event_photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching all event photos:', error);
        return [];
      }
    }
  },

  // Event Messages Methods
  messages: {
    async get(messageKey: string): Promise<EventMessage | null> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Using default message.');
        return this.getDefaultMessage(messageKey);
      }

      try {
        const { data, error } = await supabase
          .from('event_messages')
          .select('*')
          .eq('message_key', messageKey)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        return data || this.getDefaultMessage(messageKey);
      } catch (error) {
        console.error(`Error fetching message for key ${messageKey}:`, error);
        return this.getDefaultMessage(messageKey);
      }
    },

    async getAll(): Promise<EventMessage[]> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Using default messages.');
        return this.getDefaultMessages();
      }

      try {
        const { data, error } = await supabase
          .from('event_messages')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || this.getDefaultMessages();
      } catch (error) {
        console.error('Error fetching event messages:', error);
        return this.getDefaultMessages();
      }
    },

    async update(messageKey: string, updates: Partial<EventMessage>): Promise<EventMessage | null> {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Cannot update messages.');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('event_messages')
          .update(updates)
          .eq('message_key', messageKey)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error(`Error updating message for key ${messageKey}:`, error);
        return null;
      }
    },

    // Default messages fallback
    getDefaultMessage(messageKey: string): EventMessage {
      const defaultMessages: Record<string, EventMessage> = {
        'default': {
          message_key: 'default',
          title: 'Aral & Violet',
          subtitle: 'Sunday, December 28, 2025 • Udupi, Karnataka, India',
          show_countdown: true
        },
        'haldi_day': {
          message_key: 'haldi_day',
          title: 'Violet\'s Haldi Day',
          subtitle: 'A beautiful pre-wedding tradition filled with joy and blessings 💛',
          show_countdown: false
        },
        'roce_day': {
          message_key: 'roce_day',
          title: 'Aral\'s Roce Day',
          subtitle: 'A cherished Mangalorean tradition celebrating the groom 🌊',
          show_countdown: false
        },
        'wedding_day_before': {
          message_key: 'wedding_day_before',
          title: 'Aral Weds Violet Today',
          subtitle: 'The big day is finally here! 🎉',
          show_countdown: false
        },
        'wedding_day_after': {
          message_key: 'wedding_day_after',
          title: 'We Are Hitched',
          subtitle: 'Just married! Thanks for celebrating with us! 💒',
          show_countdown: false
        },
        'post_wedding': {
          message_key: 'post_wedding',
          title: 'Wedding is done — we\'ll be back soon with something exciting!',
          subtitle: 'Thank you for celebrating with us! 💕',
          show_countdown: false
        }
      };

      return defaultMessages[messageKey] || defaultMessages['default'];
    },

    getDefaultMessages(): EventMessage[] {
      return [
        this.getDefaultMessage('default'),
        this.getDefaultMessage('haldi_day'),
        this.getDefaultMessage('roce_day'),
        this.getDefaultMessage('wedding_day_before'),
        this.getDefaultMessage('wedding_day_after'),
        this.getDefaultMessage('post_wedding')
      ];
    }
  },

  // Utility Methods
  isSupabaseConfigured: isSupabaseConfigured,

  async testConnection(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('event_photos')
        .select('count', { count: 'exact', head: true });

      return !error;
    } catch (error) {
      console.error('Event database connection test failed:', error);
      return false;
    }
  }
};
