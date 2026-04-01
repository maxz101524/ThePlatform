import { getUser } from "@/lib/auth";
import { TopNavInner } from "./top-nav-inner";

export async function TopNav() {
  const user = await getUser();

  const navUser = user?.profile
    ? { username: user.profile.username, displayName: user.profile.display_name }
    : null;

  return <TopNavInner user={navUser} />;
}
