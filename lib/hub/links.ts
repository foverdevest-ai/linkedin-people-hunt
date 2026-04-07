import { env } from "@/lib/env";

export type HubLink = {
  key: string;
  label: string;
  href: string;
  accentClass: string;
};

export function getHubLinks(): HubLink[] {
  return [
    {
      key: "lead_importer",
      label: "Lead Importer",
      href: env.NEXT_PUBLIC_HUB_LEAD_IMPORT_URL || env.NEXT_PUBLIC_HUB_JOB_IMPORT_URL || "http://localhost:3000/imports",
      accentClass: "border-orange-300 bg-orange-50 text-orange-900"
    },
    {
      key: "people_hunt",
      label: "People Hunt",
      href: env.NEXT_PUBLIC_HUB_PEOPLE_HUNT_URL || "http://localhost:3001/dashboard",
      accentClass: "border-sky-300 bg-sky-50 text-sky-900"
    },
    {
      key: "meta_activation",
      label: "Meta Organic Activation",
      href: env.NEXT_PUBLIC_HUB_META_ACTIVATION_URL || "http://localhost:3002/dashboard",
      accentClass: "border-emerald-300 bg-emerald-50 text-emerald-900"
    }
  ];
}
