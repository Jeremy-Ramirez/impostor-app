import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RoleCard from "@/components/RoleCard";
import GameSession from "@/components/GameSession";

export default async function PlayPage({
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

  // 1. Get Player Role
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) {
    redirect(`/game/${roomCode}`);
  }

  // 2. Get Room Data (Securely)
  const { data: room } = await supabase
    .from("rooms")
    .select("theme, secret_word, status, current_turn_index, round_state")
    .eq("code", roomCode)
    .single();

  if (!room || room.status !== "playing") {
    redirect(`/game/${roomCode}`);
  }

  // 3. Secure Data Filtering
  const isImpostor = player.is_impostor;
  const secretWord = isImpostor ? null : room.secret_word;

  // 4. Get All Players for the list
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, name, is_host, created_at")
    .eq("room_code", roomCode);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-black text-white">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
        <h1 className="text-xl font-black tracking-widest text-gray-400">
          SALA: <span className="text-white">{roomCode}</span>
        </h1>
        <div className="px-3 py-1 rounded-full bg-impostor-primary/20 text-impostor-primary text-xs font-bold uppercase tracking-wider border border-impostor-primary/50">
          En Juego
        </div>
      </header>

      {/* Role Reveal (Center) */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md my-8">
        <RoleCard
          isImpostor={isImpostor}
          secretWord={secretWord}
          category={room.theme}
        />
      </div>

      {/* Game Session (Bottom) */}
      <div className="w-full max-w-2xl">
        <GameSession 
          roomCode={roomCode}
          initialPlayers={allPlayers || []}
          myPlayerId={playerId}
          initialTurnIndex={room.current_turn_index || 0}
          initialRoundState={room.round_state || "TURN_LOOP"}
        />
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-20 ${isImpostor ? 'bg-red-600' : 'bg-blue-600'}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-20 ${isImpostor ? 'bg-orange-600' : 'bg-cyan-600'}`} />
      </div>
    </main>
  );
}
