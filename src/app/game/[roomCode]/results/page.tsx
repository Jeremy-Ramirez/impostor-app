import { createClient } from "@/utils/supabase/server";
import ResultsClient from "@/components/ResultsClient";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ResultsPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const supabase = await createClient();

  // 1. Get Room Data
  const { data: room } = await supabase
    .from("rooms")
    .select("status, winner, last_eliminated_id")
    .eq("code", roomCode)
    .single();

  if (!room) {
    redirect("/");
  }

  if (room.status === "playing") {
    redirect(`/game/${roomCode}/play`);
  }

  // 2. Get Players (to display names and roles)
  const { data: players } = await supabase
    .from("players")
    .select("id, name, is_eliminated, is_impostor, is_host")
    .eq("room_code", roomCode);

  if (!players) {
    return <div>Error loading players</div>;
  }

  // 3. Get Current Player ID
  const cookieStore = await cookies();
  const playerId = cookieStore.get(`impostor_player_${roomCode}`)?.value;

  return (
    <ResultsClient 
      roomCode={roomCode} 
      room={room} 
      players={players}
      myPlayerId={playerId || ""}
    />
  );
}
