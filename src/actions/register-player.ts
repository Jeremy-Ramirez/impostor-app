"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function registerPlayerAction(roomCode: string, playerName: string) {
  const supabase = await createClient();

  try {
    // 1. Check if room exists
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return { error: "Sala no encontrada." };
    }

    // 2. Check if player already exists
    const { data: existingPlayer } = await supabase
      .from("players")
      .select("*")
      .eq("room_code", roomCode)
      .eq("name", playerName)
      .single();

    let player;

    if (existingPlayer) {
      player = existingPlayer;
    } else {
      // 3. Check if I'm the first player (Host)
      const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("room_code", roomCode);

      const isHost = count === 0;

      // 4. Insert Player
      const { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert({
          room_code: roomCode,
          name: playerName,
          is_host: isHost,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting player:", insertError);
        return { error: "Error al registrar jugador." };
      }
      player = newPlayer;
    }

    // 4. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set(`impostor_player_${roomCode}`, player.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return { success: true, player };
  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}
