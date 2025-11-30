"use client";

import { useActionState, useEffect, useState } from "react";
import { joinRoomAction } from "@/actions/join-room";
import { Loader2, ArrowRight } from "lucide-react";

const initialState = {
  error: "",
};

export default function JoinRoomForm() {
  const [state, action, isPending] = useActionState(joinRoomAction, initialState);
  const [code, setCode] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force uppercase and limit length if needed (though Zod handles validation)
    const val = e.target.value.toUpperCase().trim();
    if (val.length <= 6) {
      setCode(val);
    }
  };

  return (
    <form action={action} className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 text-center">
          CÓDIGO DE SALA
        </label>
        <div className="relative">
          <input
            type="text"
            id="roomCode"
            name="roomCode"
            value={code}
            onChange={handleInputChange}
            placeholder="XJ9T"
            className="block w-full rounded-2xl border-2 border-white/10 bg-white/5 py-6 text-center text-4xl font-black tracking-[0.5em] text-white placeholder:text-white/10 focus:border-impostor-accent focus:bg-white/10 focus:outline-none focus:ring-0 transition-all uppercase"
            autoComplete="off"
            required
          />
        </div>
      </div>

      {/* Error Message */}
      {state?.error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 text-center animate-in fade-in slide-in-from-top-2">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || code.length < 4}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-impostor-secondary px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-impostor-secondary-hover hover:scale-[1.02] hover:shadow-impostor-secondary/50 focus:outline-none focus:ring-4 focus:ring-impostor-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Buscando sala...
          </>
        ) : (
          <>
            Unirse a la Partida
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </form>
  );
}
