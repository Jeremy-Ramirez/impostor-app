"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function startGameAction(roomCode: string) {
  const supabase = await createClient();

  try {
    // 1. Get room details (impostor count)
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("impostor_count")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return { error: "Sala no encontrada." };
    }

    // 2. Get all players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .eq("room_code", roomCode);

    if (playersError || !players || players.length < 3) {
      return { error: "Se necesitan al menos 3 jugadores para comenzar." };
    }

    // 3. Assign Impostors
    const impostorCount = room.impostor_count;
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    const impostors = shuffledPlayers.slice(0, impostorCount);
    const impostorIds = impostors.map((p) => p.id);

    // 4. Update players in DB
    // Reset all first (just in case)
    await supabase
      .from("players")
      .update({ is_impostor: false })
      .eq("room_code", roomCode);

    // Set impostors
    const { error: updateError } = await supabase
      .from("players")
      .update({ is_impostor: true })
      .in("id", impostorIds);

    if (updateError) {
      console.error("Error setting impostors:", updateError);
      return { error: "Error al asignar roles." };
    }

    // 5. Update room status to PLAYING
    const { error: statusError } = await supabase
      .from("rooms")
      .update({ status: "playing" })
      .eq("code", roomCode);

    if (statusError) {
      console.error("Error starting game:", statusError);
      return { error: "Error al iniciar la partida." };
    }

    revalidatePath(`/game/${roomCode}`);
    return { success: true };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}
