/**
 * Static example content for design previews only.
 * Nothing in this file represents real customers, real campaigns or real
 * product activity. Anything rendered from here must be visibly labelled
 * "Example data" in the UI.
 */

export type VerificationStatus = "Verified" | "Partially verified" | "Unverified" | "Stale" | "Suppressed";

export interface ExampleLead {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  email: string;
  emailStatus: VerificationStatus;
  phone?: string;
  match: number;
  source: string;
  status: "New" | "Reviewing" | "Contacted" | "Not a fit";
};

export const exampleLeads: ExampleLead[] = [
  {
    id: "l1",
    firstName: "Ananya",
    lastName: "Rao",
    role: "Head of Operations",
    company: "Kavya Textiles",
    industry: "Apparel manufacturing",
    companySize: "50–200",
    location: "Coimbatore, IN",
    email: "ananya@kavyatextiles.example",
    emailStatus: "Verified",
    phone: "+91 90000 00001",
    match: 92,
    source: "Company website",
    status: "New",
  },
  {
    id: "l2",
    firstName: "Marcus",
    lastName: "Bell",
    role: "Procurement Lead",
    company: "Northfold Interiors",
    industry: "Interior fit-out",
    companySize: "11–50",
    location: "Manchester, UK",
    email: "m.bell@northfold.example",
    emailStatus: "Verified",
    match: 88,
    source: "Public directory",
    status: "Reviewing",
  },
  {
    id: "l3",
    firstName: "Priya",
    lastName: "Menon",
    role: "Founder",
    company: "Tinbox Studio",
    industry: "Design services",
    companySize: "2–10",
    location: "Bengaluru, IN",
    email: "priya@tinbox.example",
    emailStatus: "Unverified",
    match: 81,
    source: "Company website",
    status: "New",
  },
  {
    id: "l4",
    firstName: "Sofia",
    lastName: "Duarte",
    role: "Supply Chain Manager",
    company: "Verde Foods",
    industry: "Food & beverage",
    companySize: "200–500",
    location: "Lisbon, PT",
    email: "sofia.duarte@verdefoods.example",
    emailStatus: "Verified",
    phone: "+351 900 000 002",
    match: 76,
    source: "Public directory",
    status: "Contacted",
  },
  {
    id: "l5",
    firstName: "Daniel",
    lastName: "Okafor",
    role: "Managing Director",
    company: "Halden Logistics",
    industry: "Freight & logistics",
    companySize: "50–200",
    location: "Lagos, NG",
    email: "daniel@haldenlogistics.example",
    emailStatus: "Verified",
    match: 71,
    source: "Company website",
    status: "New",
  },
  {
    id: "l6",
    firstName: "Hannah",
    lastName: "Weiss",
    role: "Marketing Director",
    company: "Studio Kern",
    industry: "Brand consultancy",
    companySize: "11–50",
    location: "Berlin, DE",
    email: "hannah@studiokern.example",
    emailStatus: "Unverified",
    match: 64,
    source: "Public directory",
    status: "Not a fit",
  },
];

export type ExampleCampaign = {
  id: string;
  name: string;
  profile: string;
  leads: number;
  createdAt: string;
  status: "Completed" | "Running" | "Draft";
  progress: number;
};

export const exampleCampaigns: ExampleCampaign[] = [
  {
    id: "c1",
    name: "Mid-size textile manufacturers",
    profile: "Loomwork Supply",
    leads: 48,
    createdAt: "2 Aug 2026",
    status: "Completed",
    progress: 100,
  },
  {
    id: "c2",
    name: "Interior fit-out procurement leads",
    profile: "Loomwork Supply",
    leads: 31,
    createdAt: "5 Aug 2026",
    status: "Running",
    progress: 63,
  },
  {
    id: "c3",
    name: "Food & beverage packaging buyers",
    profile: "Loomwork Supply",
    leads: 0,
    createdAt: "7 Aug 2026",
    status: "Draft",
    progress: 0,
  },
];

export const exampleProfile = {
  name: "Loomwork Supply",
  industry: "Industrial textiles",
  offering: "Sustainable fabric sourcing for mid-size manufacturers",
  targetRole: "Head of Operations, Procurement Lead",
  targetLocation: "India, UK, EU",
  icp: "Manufacturers with 50–500 staff replacing conventional cotton suppliers",
  companySize: "50–500",
  budget: "$5k–$40k per order",
  website: "loomwork.example",
};

export const campaignSteps = [
  { label: "Understanding your business", state: "done" as const },
  { label: "Building search strategy", state: "done" as const },
  { label: "Discovering companies", state: "active" as const },
  { label: "Verifying contacts", state: "todo" as const },
  { label: "Scoring leads", state: "todo" as const },
];

export const exampleDocuments = [
  { id: "d1", name: "Company overview 2026.pdf", size: "1.2 MB", added: "1 Aug 2026" },
  { id: "d2", name: "Product catalogue.pdf", size: "4.8 MB", added: "3 Aug 2026" },
];
