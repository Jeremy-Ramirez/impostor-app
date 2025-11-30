import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import GameClient from "@/components/GameClient";

export default async function GameRoom({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const supabase = await createClient();

  // 1. Verify room exists and get details
  const { data: room } = await supabase
    .from("rooms")
    .select("id, theme, impostor_count, secret_word, status")
    .eq("code", roomCode)
    .single();

  if (!room) {
    notFound();
  }

  // 2. Get initial players
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("room_code", roomCode);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <GameClient
        roomCode={roomCode}
        initialPlayers={players || []}
        initialRoomStatus={room.status}
        secretWord={room.secret_word}
        category={room.theme}
      />
      
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-impostor-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-impostor-secondary/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
