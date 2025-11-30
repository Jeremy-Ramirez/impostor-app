"use client";

import { useActionState } from "react";
import { createRoomAction } from "@/actions/create-room";
import { Loader2, Users, Gamepad2 } from "lucide-react";

const initialState = {
  error: "",
};

export default function CreateRoomForm() {
  const [state, action, isPending] = useActionState(createRoomAction, initialState);

  return (
    <form action={action} className="w-full max-w-md space-y-6">
      {/* Theme Selection */}
      <div className="space-y-2">
        <label htmlFor="theme" className="block text-sm font-medium text-gray-300">
          Temática
        </label>
        <div className="relative">
          <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            id="theme"
            name="theme"
            className="block w-full rounded-lg border-0 bg-white/5 py-3 pl-10 pr-4 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-impostor-primary sm:text-sm sm:leading-6 [&>option]:bg-gray-900"
            defaultValue="Fútbol"
          >
            <option value="Fútbol">Fútbol</option>
            <option value="Celebridades">Celebridades</option>
            <option value="Comidas">Comidas</option>
            <option value="Lugares">Lugares</option>
          </select>
        </div>
      </div>

      {/* Impostor Count */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Cantidad de Impostores
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((count) => (
            <label
              key={count}
              className="cursor-pointer relative flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-impostor-primary/50 has-[:checked]:border-impostor-primary has-[:checked]:bg-impostor-primary/20 has-[:checked]:text-impostor-primary transition-all"
            >
              <input
                type="radio"
                name="impostorCount"
                value={count}
                className="sr-only"
                defaultChecked={count === 1}
              />
              <span className="text-xl font-bold">{count}</span>
              <Users className="ml-2 h-4 w-4 opacity-50" />
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {state?.error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
          {state.error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-impostor-primary px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-impostor-primary-hover hover:scale-[1.02] hover:shadow-impostor-primary/50 focus:outline-none focus:ring-4 focus:ring-impostor-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creando Sala...
          </>
        ) : (
          "Crear Sala"
        )}
      </button>
    </form>
  );
}
