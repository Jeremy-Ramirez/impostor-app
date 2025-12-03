"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function castVoteAction(roomCode: string, voterId: string, candidateId: string | null) {
  const supabase = await createClient();

  try {
    // 1. Check if player is alive
    const { data: voter, error: voterError } = await supabase
      .from("players")
      .select("is_alive")
      .eq("id", voterId)
      .single();

    if (voterError || !voter || !voter.is_alive) {
      return { error: "No puedes votar." };
    }

    // 2. Cast Vote
    console.log(`[Vote] Casting vote for room ${roomCode} by ${voterId}`);
    const { error: voteError } = await supabase
      .from("votes")
      .insert({
        room_code: roomCode,
        voter_id: voterId,
        candidate_id: candidateId,
      });

    if (voteError) {
      console.error("[Vote] Error inserting vote:", voteError);
      // Handle unique constraint (already voted)
      if (voteError.code === "23505") {
        return { error: "Ya has votado." };
      }
      return { error: "Error al registrar voto." };
    }

    // 3. Check if everyone voted
    // Get count of alive players
    const { count: aliveCount, error: aliveError } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("room_code", roomCode)
      .eq("is_alive", true);

    if (aliveError) console.error("[Vote] Error counting alive players:", aliveError);

    // Get count of votes
    const { count: voteCount, error: voteCountError } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("room_code", roomCode);

    if (voteCountError) console.error("[Vote] Error counting votes:", voteCountError);

    console.log(`[Vote] Progress: ${voteCount}/${aliveCount}`);

    if (aliveCount !== null && voteCount !== null && voteCount >= aliveCount) {
      console.log("[Vote] All votes cast. Resolving...");
      // All votes cast, resolve round
      await resolveVoting(roomCode);
    }

    revalidatePath(`/game/${roomCode}/vote`);
    return { success: true };

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }
}

async function resolveVoting(roomCode: string) {
  const supabase = await createClient();

  // 1. Get all votes
  const { data: votes } = await supabase
    .from("votes")
    .select("candidate_id")
    .eq("room_code", roomCode);

  if (!votes) return;

  // 2. Count votes
  const voteCounts: Record<string, number> = {};
  let skipCount = 0;

  votes.forEach((v) => {
    if (v.candidate_id) {
      voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
    } else {
      skipCount++;
    }
  });

  // 3. Determine result
  let maxVotes = 0;
  let candidatesWithMaxVotes: string[] = [];

  // Check skips first
  if (skipCount > maxVotes) {
    maxVotes = skipCount;
    candidatesWithMaxVotes = ["skip"];
  } else if (skipCount === maxVotes) {
    candidatesWithMaxVotes.push("skip");
  }

  // Check candidates
  for (const [candidateId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      candidatesWithMaxVotes = [candidateId];
    } else if (count === maxVotes) {
      candidatesWithMaxVotes.push(candidateId);
    }
  }

  // 4. Handle Ejection (if single winner and not skip)
  let ejectedPlayerId: string | null = null;
  if (candidatesWithMaxVotes.length === 1 && candidatesWithMaxVotes[0] !== "skip") {
    ejectedPlayerId = candidatesWithMaxVotes[0];
    
    // Mark as dead
    await supabase
      .from("players")
      .update({ is_alive: false })
      .eq("id", ejectedPlayerId);
  }

  // 5. Check Win Conditions
  const { data: players } = await supabase
    .from("players")
    .select("id, is_impostor, is_alive")
    .eq("room_code", roomCode)
    .eq("is_alive", true);

  if (players) {
    const impostors = players.filter(p => p.is_impostor).length;
    const crewmates = players.filter(p => !p.is_impostor).length;

    let winner: "impostors" | "crewmates" | null = null;

    if (impostors === 0) {
      winner = "crewmates";
    } else if (impostors >= crewmates) {
      winner = "impostors";
    }

    if (winner) {
      await supabase
        .from("rooms")
        .update({ status: "game_over", winner })
        .eq("code", roomCode);
    } else {
      // Continue game -> Go to results
      await supabase
        .from("rooms")
        .update({ status: "results" })
        .eq("code", roomCode);
    }
  }
}
