"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const AUTH_USER_KEY = ["auth-user"] as const;

/**
 * Single cached source for the current user on the client.
 * Previously the header, sidebar, dashboard and settings pages each fired their
 * own `supabase.auth.getUser()` network call on mount. This shares one result.
 */
export function useAuthUser() {
  return useQuery({
    queryKey: AUTH_USER_KEY,
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useUserDisplayName() {
  const { data: user } = useAuthUser();
  const name =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";
  return { name, email: user?.email ?? "" };
}
