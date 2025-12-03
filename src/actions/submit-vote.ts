"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitVoteAction(roomCode: string, voterId: string, candidateId: string | null) {
  const supabase = await createClient();

  try {
    // 1. Register Vote
    console.log(`[Vote] Submitting vote: Room=${roomCode}, Voter=${voterId}, Candidate=${candidateId}`);
    
    const { error: voteError } = await supabase
      .from("players")
      .update({ voted_for_id: candidateId })
      .eq("id", voterId)
      .eq("room_code", roomCode)
      .eq("is_eliminated", false);

    if (voteError) {
      console.error("[Vote] Error registering vote:", voteError);
      return { error: "Error al registrar voto." };
    }

    // 2. Check if ALL alive players have voted
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, voted_for_id, is_eliminated, is_impostor")
      .eq("room_code", roomCode)
      .eq("is_eliminated", false);

    if (playersError || !players) {
      console.error("[Vote] Error fetching players:", playersError);
      return { error: "Error al verificar votos." };
    }

    const totalAlive = players.length;
    const votesCast = players.filter(p => p.voted_for_id !== null).length;
    
    console.log(`[Vote] Progress: ${votesCast}/${totalAlive}`);

    if (votesCast < totalAlive) {
      revalidatePath(`/game/${roomCode}/vote`);
      return { success: true, message: "Voto registrado" };
    }

    // 3. All voted -> Calculate Results (Escrutinio)
    console.log("[Vote] All votes cast. Calculating results...");
    await calculateResults(roomCode, players);
    
    revalidatePath(`/game/${roomCode}/vote`);
    return { success: true, message: "Votación finalizada" };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}

async function calculateResults(roomCode: string, players: any[]) {
  const supabase = await createClient();

  // 1. Count Votes
  const voteCounts: Record<string, number> = {};
  players.forEach(p => {
    if (p.voted_for_id) {
      voteCounts[p.voted_for_id] = (voteCounts[p.voted_for_id] || 0) + 1;
    }
  });

  const totalVotes = players.length;
  const threshold = Math.floor(totalVotes / 2) + 1;
  
  let eliminatedPlayerId: string | null = null;

  // 2. Majority Rule
  for (const [candidateId, count] of Object.entries(voteCounts)) {
    if (count >= threshold) {
      eliminatedPlayerId = candidateId;
      break; // Only one can have > 50%
    }
  }

  // 3. Apply Elimination
  if (eliminatedPlayerId) {
    await supabase
      .from("players")
      .update({ is_eliminated: true })
      .eq("id", eliminatedPlayerId);
      
    // Update local list for win check
    const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
    if (eliminatedPlayer) eliminatedPlayer.is_eliminated = true;
  }

  // 4. Check Win Conditions
  // Re-fetch or calculate from current state
  // We need to know if the eliminated player was the impostor
  
  let winner: "VILLAGERS" | "IMPOSTORS" | null = null;
  
  if (eliminatedPlayerId) {
    const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
    if (eliminatedPlayer?.is_impostor) {
      winner = "VILLAGERS";
    }
  }

  if (!winner) {
    // Check Impostor Win Condition (Impostors >= Villagers)
    // We need to count ALIVE players
    // Note: players array has the state BEFORE elimination update in DB, but we updated the object locally above if eliminated.
    // Wait, we need to be careful. 'players' array contains only those who were alive at start of voting.
    // If one was eliminated, they are now dead.
    
    const alivePlayers = players.filter(p => p.id !== eliminatedPlayerId);
    const impostorsAlive = alivePlayers.filter(p => p.is_impostor).length;
    const villagersAlive = alivePlayers.filter(p => !p.is_impostor).length;

    if (impostorsAlive >= villagersAlive) {
      winner = "IMPOSTORS";
    }
  }

  // 5. Update Room Status
  // 5. Update Room Status
  const updateData: any = {
    last_eliminated_id: eliminatedPlayerId // Save who was eliminated (or null)
  };

  if (winner) {
    updateData.status = "GAME_OVER";
    updateData.winner = winner;
  } else {
    // Game Continues
    updateData.status = "playing";
    updateData.current_turn_index = 0;
    updateData.round_state = "TURN_LOOP";

    // Reset votes
    await supabase
      .from("players")
      .update({ voted_for_id: null })
      .eq("room_code", roomCode);
  }

  await supabase
    .from("rooms")
    .update(updateData)
    .eq("code", roomCode);
}
