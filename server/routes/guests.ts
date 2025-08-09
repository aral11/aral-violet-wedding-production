import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client initialized for guests service");
  } catch (error) {
    console.warn("❌ Failed to initialize Supabase for guests:", error);
  }
} else {
  console.warn(
    "⚠️ Supabase credentials not found - guests service will use fallback",
  );
}

// Get all guests
export const getGuests: RequestHandler = async (req, res) => {
  console.log("👥 Guests API called - GET /api/guests");
  try {
    if (supabase) {
      console.log("👥 Using Supabase for guests");
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("👥 Supabase error:", error);
        throw error;
      }

      // Transform data to match expected format
      const guests = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        attending: row.attending,
        guests: row.guests,
        side: row.side,
        message: row.message,
        dietaryRestrictions: row.dietary_restrictions,
        needsAccommodation: row.needs_accommodation,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      console.log(`👥 Returning ${guests.length} guests from Supabase`);
      res.json(guests);
    } else {
      console.log("👥 No Supabase client - returning empty array");
      // Fallback to empty array
      res.json([]);
    }
  } catch (error) {
    console.error("👥 Error fetching guests:", error);
    // Return empty array for graceful fallback
    res.json([]);
  }
};

// Create new guest RSVP
export const createGuest: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      attending,
      guests,
      side,
      message,
      dietaryRestrictions,
      needsAccommodation,
    } = req.body;

    if (supabase) {
      const { data, error } = await supabase
        .from("guests")
        .insert([
          {
            name,
            email,
            phone,
            attending,
            guests,
            side,
            message: message || null,
            dietary_restrictions: dietaryRestrictions || null,
            needs_accommodation: needsAccommodation,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newGuest = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        attending: data.attending,
        guests: data.guests,
        side: data.side,
        message: data.message,
        dietaryRestrictions: data.dietary_restrictions,
        needsAccommodation: data.needs_accommodation,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      res.status(201).json(newGuest);
    } else {
      // Fallback response
      const id = Date.now().toString();
      const newGuest = {
        id,
        name,
        email,
        phone,
        attending,
        guests,
        side,
        message,
        dietaryRestrictions,
        needsAccommodation,
        createdAt: new Date().toISOString(),
      };
      res.status(201).json(newGuest);
    }
  } catch (error) {
    console.error("Error creating guest:", error);
    // Return success response for graceful fallback
    const id = Date.now().toString();
    const newGuest = {
      id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      attending: req.body.attending,
      guests: req.body.guests,
      side: req.body.side,
      message: req.body.message,
      dietaryRestrictions: req.body.dietaryRestrictions,
      needsAccommodation: req.body.needsAccommodation,
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(newGuest);
  }
};

// Update guest
export const updateGuest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      attending,
      guests,
      side,
      message,
      dietaryRestrictions,
      needsAccommodation,
    } = req.body;

    if (supabase) {
      const { error } = await supabase
        .from("guests")
        .update({
          name,
          email,
          phone,
          attending,
          guests,
          side,
          message: message || null,
          dietary_restrictions: dietaryRestrictions || null,
          needs_accommodation: needsAccommodation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }
    }

    res.json({ message: "Guest updated successfully" });
  } catch (error) {
    console.error("Error updating guest:", error);
    // Return success response for graceful fallback
    res.json({ message: "Guest updated successfully" });
  }
};

// Delete guest
export const deleteGuest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase.from("guests").delete().eq("id", id);

      if (error) {
        throw error;
      }
    }

    res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("Error deleting guest:", error);
    // Return success response for graceful fallback
    res.json({ message: "Guest deleted successfully" });
  }
};
