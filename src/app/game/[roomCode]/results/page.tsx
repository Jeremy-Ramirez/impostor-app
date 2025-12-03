import { createClient } from "@/utils/supabase/server";
import ResultsClient from "@/components/ResultsClient";
import { redirect } from "next/navigation";

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

  // 2. Get Players (to display names and roles)
  const { data: players } = await supabase
    .from("players")
    .select("id, name, is_eliminated, is_impostor")
    .eq("room_code", roomCode);

  if (!players) {
    return <div>Error loading players</div>;
  }

  return (
    <ResultsClient 
      roomCode={roomCode} 
      room={room} 
      players={players} 
    />
  );
}
