"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const joinRoomSchema = z.object({
  roomCode: z.string().trim().min(4, "El código debe tener al menos 4 caracteres").toUpperCase(),
});

export async function joinRoomAction(prevState: any, formData: FormData) {
  const validatedFields = joinRoomSchema.safeParse({
    roomCode: formData.get("roomCode"),
  });

  if (!validatedFields.success) {
    return {
      error: "Código inválido.",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { roomCode } = validatedFields.data;
  const supabase = await createClient();

  try {
    // Check if room exists
    const { data: room, error } = await supabase
      .from("rooms")
      .select("code")
      .eq("code", roomCode)
      .single();

    if (error || !room) {
      return { error: "Sala no encontrada. Verifica el código." };
    }

  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }

  // Redirect if successful
  redirect(`/game/${roomCode}`);
}
