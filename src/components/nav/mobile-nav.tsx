import { getUser } from "@/lib/auth";
import { MobileNavInner } from "./mobile-nav-inner";

export async function MobileNav() {
  const user = await getUser();

  const profileHref = user?.profile
    ? `/u/${user.profile.username}`
    : "/login";

  return <MobileNavInner profileHref={profileHref} />;
}
