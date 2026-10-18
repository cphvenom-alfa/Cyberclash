import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function Home() {
	redirect((await getSession()) ? "/dashboard" : "/login");
}
