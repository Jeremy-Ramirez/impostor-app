import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VotingClient from "@/components/VotingClient";

export default async function VotePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const playerId = cookieStore.get(`impostor_player_${roomCode}`)?.value;

  if (!playerId) {
    redirect(`/game/${roomCode}`);
  }

  // 1. Verify Room Status
  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("code", roomCode)
    .single();

  if (!room || room.status !== "voting") {
    redirect(`/game/${roomCode}/play`);
  }

  // 2. Get Players
  const { data: players } = await supabase
    .from("players")
    .select("id, name, is_eliminated, voted_for_id")
    .eq("room_code", roomCode);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-black text-white">
      <header className="absolute top-0 w-full flex justify-between items-center p-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <h1 className="text-xl font-black tracking-widest text-gray-400">
          SALA: <span className="text-white">{roomCode}</span>
        </h1>
        <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/50 animate-pulse">
          Votación en curso
        </div>
      </header>

      <VotingClient 
        roomCode={roomCode} 
        players={players || []} 
        myPlayerId={playerId} 
      />

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
