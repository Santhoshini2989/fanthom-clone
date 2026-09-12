import type { Team, User } from "./types";

export const USERS: User[] = [
  { id: "u_nancy", name: "Nancy Liang", email: "nancy@brightline.io", pronouns: "she/her", title: "Head of Product", avatarColor: "#6d3df5" },
  { id: "u_marcus", name: "Marcus Bell", email: "marcus@brightline.io", pronouns: "he/him", title: "VP Engineering", avatarColor: "#0ea5e9" },
  { id: "u_priya", name: "Priya Raman", email: "priya@brightline.io", pronouns: "she/her", title: "Product Designer", avatarColor: "#f59e0b" },
  { id: "u_diego", name: "Diego Alvarez", email: "diego@brightline.io", pronouns: "he/him", title: "Engineering Manager", avatarColor: "#10b981" },
  { id: "u_hannah", name: "Hannah Okafor", email: "hannah@brightline.io", pronouns: "she/her", title: "Customer Success Lead", avatarColor: "#ec4899" },
  { id: "u_tom", name: "Tom Whitaker", email: "tom@brightline.io", pronouns: "he/him", title: "Account Executive", avatarColor: "#8b5cf6" },
  { id: "u_lena", name: "Lena Fischer", email: "lena@brightline.io", pronouns: "she/her", title: "Marketing Lead", avatarColor: "#f97316" },
  { id: "u_sam", name: "Sam Kowalski", email: "sam@brightline.io", pronouns: "they/them", title: "Data Analyst", avatarColor: "#14b8a6" },
  { id: "u_aisha", name: "Aisha Abdali", email: "aisha@brightline.io", pronouns: "she/her", title: "Backend Engineer", avatarColor: "#3b82f6" },
  { id: "u_ravi", name: "Ravi Patel", email: "ravi@brightline.io", pronouns: "he/him", title: "Frontend Engineer", avatarColor: "#a855f7" },
  // external
  { id: "u_grace", name: "Grace Holloway", email: "grace.holloway@northwindlogistics.com", pronouns: "she/her", title: "Director of Operations, Northwind Logistics", avatarColor: "#ef4444", isExternal: true },
  { id: "u_ben", name: "Ben Carter", email: "ben.carter@northwindlogistics.com", pronouns: "he/him", title: "IT Manager, Northwind Logistics", avatarColor: "#64748b", isExternal: true },
];

export const CURRENT_USER_ID = "u_nancy";

export const TEAMS: Team[] = [
  { id: "t_product", name: "Product", memberIds: ["u_nancy", "u_priya", "u_sam"] },
  { id: "t_engineering", name: "Engineering", memberIds: ["u_marcus", "u_diego", "u_aisha", "u_ravi"] },
  { id: "t_gtm", name: "Go-to-Market", memberIds: ["u_hannah", "u_tom", "u_lena"] },
];

export const ORG = {
  name: "Brightline",
  domain: "brightline.io",
  plan: "Team" as const,
  referralPoints: 87,
};

export function userById(id: string): User {
  return USERS.find((u) => u.id === id) ?? { id, name: id, email: "", avatarColor: "#525252" };
}
