"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function passTurnAction(roomCode: string) {
  const supabase = await createClient();

  try {
    // 1. Get room details
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, current_turn_index, round_state")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return { error: "Sala no encontrada." };
    }

    // 2. Get players count (to check if round finished)
    // We need the exact count of players to know when the round ends
    const { count, error: countError } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_code", roomCode);

    if (countError || count === null) {
      return { error: "Error al obtener jugadores." };
    }

    const nextTurnIndex = (room.current_turn_index || 0) + 1;
    let updates: any = { current_turn_index: nextTurnIndex };

    // 3. Check if round finished
    if (nextTurnIndex >= count) {
      updates.round_state = "ROUND_FINISHED";
    }

    // 4. Update room
    const { error: updateError } = await supabase
      .from("rooms")
      .update(updates)
      .eq("code", roomCode);

    if (updateError) {
      console.error("Error updating turn:", updateError);
      return { error: "Error al pasar turno." };
    }

    revalidatePath(`/game/${roomCode}/play`);
    return { success: true };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}

export async function decideNextStepAction(roomCode: string, decision: "NEW_ROUND" | "VOTE") {
  const supabase = await createClient();

  try {
    // 1. Verify room state
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("round_state")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return { error: "Sala no encontrada." };
    }

    if (room.round_state !== "ROUND_FINISHED") {
      return { error: "No se puede decidir en este estado." };
    }

    let updates: any = {};

    if (decision === "NEW_ROUND") {
      updates = {
        current_turn_index: 0,
        round_state: "TURN_LOOP"
      };
    } else if (decision === "VOTE") {
      updates = {
        status: "voting" // Assuming 'voting' is the status for voting phase
      };
    }

    const { error: updateError } = await supabase
      .from("rooms")
      .update(updates)
      .eq("code", roomCode);

    if (updateError) {
      console.error("Error updating decision:", updateError);
      return { error: "Error al actualizar estado." };
    }

    revalidatePath(`/game/${roomCode}/play`);
    return { success: true };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}
