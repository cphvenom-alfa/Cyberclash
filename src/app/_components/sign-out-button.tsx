"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";

export function SignOutButton() {
	const router = useRouter();
	return (
		<button
			className="text-slate-400 underline"
			onClick={async () => {
				await authClient.signOut();
				router.replace("/login");
				router.refresh();
			}}
			type="button"
		>
			Sign out
		</button>
	);
}
