/* The workspace's member roster, shared by the Members page and anything that
   picks people from it (e.g. alarm notification channels).

   There is no endpoint that lists a workspace's members yet — you can invite
   one, but you cannot read the roster back — so the roster is only ever what
   the Members page has been told locally, and it starts empty.

   It used to be seeded with eight sample colleagues at company.com, which
   filled the members table and every recipient picker with people who cannot
   be reached at all. That seed was written to storage on the first visit, so
   the key carries a version: v4 starts clean rather than inheriting it.

   When a members API exists, this is the one place to swap. */

export type AiotRole = "Full Access" | "Manager" | "Editor" | "Operator" | "Viewer" | "Custom";
export type MemberStatus = "Active" | "Pending" | "Disabled";

export interface Member {
  id: string;
  name: string;
  email: string;
  /** Mobile number, for phone and SMS alerts. No source provides one yet. */
  phone?: string;
  role: AiotRole;
  status: MemberStatus;
  lastLogin?: string; // ISO
  initials?: string;
  avatarTone?: string;
}

export const MEMBERS_STORAGE_KEY = "paapeli.members.list.v4";

/* Invitations the Members page lists and the invite form writes. Each
   had its own string and the two had drifted apart, so an invitation
   was written to one key and looked for under another. It lives here
   now, next to the roster it belongs with. */
export const INVITES_STORAGE_KEY = "paapeli.members.invites.v4";

export const TONES = [
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-sky-500/15 text-sky-600",
  "bg-violet-500/15 text-violet-600",
  "bg-fuchsia-500/15 text-fuchsia-600",
  "bg-orange-500/15 text-orange-600",
  "bg-teal-500/15 text-teal-600",
];

export const mkInitials = (name: string) =>
  name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
