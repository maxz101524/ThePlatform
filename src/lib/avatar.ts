const AVATAR_COLORS = [
  "hsl(0, 70%, 50%)",    // red
  "hsl(25, 80%, 50%)",   // orange
  "hsl(45, 85%, 45%)",   // amber
  "hsl(145, 60%, 40%)",  // green
  "hsl(190, 70%, 45%)",  // teal
  "hsl(210, 70%, 50%)",  // blue
  "hsl(260, 60%, 55%)",  // purple
  "hsl(330, 65%, 50%)",  // pink
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarColor(username: string): string {
  return AVATAR_COLORS[hashString(username) % AVATAR_COLORS.length];
}

export function getAvatarInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}
