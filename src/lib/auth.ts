import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (e) {
    return null;
  }
}
