"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setCurrency(formData: FormData): Promise<void> {
  const code = String(formData.get("code"));
  (await cookies()).set("currency", code, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
