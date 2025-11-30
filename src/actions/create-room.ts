"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const createRoomSchema = z.object({
  theme: z.enum(["Fútbol", "Celebridades", "Comidas", "Lugares"]),
  impostorCount: z.coerce.number().min(1).max(3),
});

export async function createRoomAction(prevState: any, formData: FormData) {
  const validatedFields = createRoomSchema.safeParse({
    theme: formData.get("theme"),
    impostorCount: formData.get("impostorCount"),
  });

  if (!validatedFields.success) {
    return {
      error: "Datos inválidos. Verifica los campos.",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { theme, impostorCount } = validatedFields.data;
  const supabase = await createClient();

  // Generate a random 4-letter code
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();

  try {
    // 1. Select a random secret word for the chosen category
    // Using a simple random selection approach
    const { data: words, error: wordsError } = await supabase
      .from("game_words")
      .select("word")
      .eq("category", theme);

    if (wordsError || !words || words.length === 0) {
      console.error("Error fetching words:", wordsError);
      return { error: `No hay palabras disponibles para la categoría: ${theme}` };
    }

    const randomWord = words[Math.floor(Math.random() * words.length)].word;

    // 2. Create the room with the secret word
    const { error } = await supabase.from("rooms").insert({
      code,
      theme,
      impostor_count: impostorCount,
      secret_word: randomWord,
      status: "waiting",
    });

    if (error) {
      console.error("Supabase Error:", error);
      return { error: "Error al crear la sala. Inténtalo de nuevo." };
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    return { error: "Ocurrió un error inesperado." };
  }

  redirect(`/game/${code}`);
}
