"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function restartGameAction(roomCode: string) {
  const supabase = await createClient();

  try {
    // 1. Get room details (theme, impostor_count)
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("theme, impostor_count")
      .eq("code", roomCode)
      .single();

    if (roomError || !room) {
      return { error: "Sala no encontrada." };
    }

    // 2. Select a NEW random secret word
    const { data: words, error: wordsError } = await supabase
      .from("game_words")
      .select("word")
      .eq("category", room.theme);

    if (wordsError || !words || words.length === 0) {
      return { error: "No hay palabras disponibles." };
    }

    const randomWord = words[Math.floor(Math.random() * words.length)].word;

    // 3. Get all players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .eq("room_code", roomCode);

    if (playersError || !players || players.length < 3) {
      return { error: "Se necesitan al menos 3 jugadores para reiniciar." };
    }

    // 4. Assign NEW Impostors
    const impostorCount = room.impostor_count;
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    const impostors = shuffledPlayers.slice(0, impostorCount);
    const impostorIds = impostors.map((p) => p.id);

    // 5. Reset Players (Clear votes, elimination status, and roles)
    // First, reset everyone to default
    await supabase
      .from("players")
      .update({ 
        is_impostor: false,
        is_eliminated: false,
        voted_for_id: null
      })
      .eq("room_code", roomCode);

    // Then set new impostors
    const { error: impostorError } = await supabase
      .from("players")
      .update({ is_impostor: true })
      .in("id", impostorIds);

    if (impostorError) {
      console.error("Error setting impostors:", impostorError);
      return { error: "Error al asignar roles." };
    }

    // 6. Reset Room State
    const { error: roomUpdateError } = await supabase
      .from("rooms")
      .update({
        secret_word: randomWord,
        status: "playing",
        round_state: "TURN_LOOP",
        current_turn_index: 0,
        winner: null,
        last_eliminated_id: null
      })
      .eq("code", roomCode);

    if (roomUpdateError) {
      console.error("Error resetting room:", roomUpdateError);
      return { error: "Error al reiniciar la sala." };
    }

    revalidatePath(`/game/${roomCode}`);
    return { success: true };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}
