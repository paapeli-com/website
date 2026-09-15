/* The workspace's member roster, shared by the Members page and anything that
   picks people from it (e.g. alarm notification channels).

   There is no endpoint that lists a workspace's members yet, so the roster is
   the Members page's own browser-stored list, seeded with sample members until
   it is first saved. When a members API exists, this is the one place to swap. */

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

export const MEMBERS_STORAGE_KEY = "paapeli.members.list.v3";

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

export const MOCK_MEMBERS: Member[] = [
  { id: "m-1", name: "Armin Rajabi", email: "armin.rajabi@company.com", role: "Full Access", status: "Active", lastLogin: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: "m-2", name: "محمدعرفان شمس", email: "erfan.shams@company.com", role: "Manager", status: "Active", lastLogin: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: "m-3", name: "Mehdi Hoseini", email: "mehdi.hoseini@company.com", role: "Operator", status: "Active", lastLogin: new Date(Date.now() - 3 * 86400 * 1000).toISOString() },
  { id: "m-4a", name: "حامد فضایلی", email: "hamed.fazaeli@company.com", role: "Editor", status: "Active", lastLogin: new Date(Date.now() - 5 * 86400 * 1000).toISOString() },
  { id: "m-5", name: "Fatemeh Hosseini", email: "fatemeh.hosseini@company.com", role: "Operator", status: "Disabled", lastLogin: new Date(Date.now() - 7 * 86400 * 1000).toISOString() },
  { id: "m-6", name: "امیرکیان عدل", email: "amirkian.adl@company.com", role: "Manager", status: "Active", lastLogin: new Date(Date.now() - 7 * 86400 * 1000).toISOString() },
  { id: "m-7", name: "Peyman Karimi", email: "peyman.karimi@company.com", role: "Viewer", status: "Disabled", lastLogin: new Date(Date.now() - 14 * 86400 * 1000).toISOString() },
  { id: "m-8", name: "علیرضا طاهری‌نژاد", email: "alireza.taheri@company.com", role: "Operator", status: "Active", lastLogin: new Date(Date.now() - 14 * 86400 * 1000).toISOString() },
].map((m, i) => ({ ...m, initials: mkInitials(m.name), avatarTone: TONES[i % TONES.length] })) as Member[];

/** The roster as the Members page last saved it, or the seed if it never has. */
export const loadMembers = (): Member[] => {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : MOCK_MEMBERS;
  } catch {
    return MOCK_MEMBERS;
  }
};
