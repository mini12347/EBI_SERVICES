export interface DepartmentRep {
  key: string;
  name: string;
  repName: string;
  repRole: string;
}

export const DEPARTMENTS: DepartmentRep[] = [
  {
    key: "development",
    name: "Software Development",
    repName: "Alex Moreau",
    repRole: "Software Development Manager",
  },
  {
    key: "recruitment",
    name: "IT Sourcing & Recruitment",
    repName: "Sophie Bernard",
    repRole: "Talent Acquisition Manager",
  },
  {
    key: "teleservices",
    name: "Tele-services & Support",
    repName: "Karim Haddad",
    repRole: "Tele-services Operations Manager",
  },
  {
    key: "bpo",
    name: "Business Process Outsourcing (BPO)",
    repName: "Claire Dubois",
    repRole: "BPO Account Manager",
  },
];

export const GENERAL_REP = {
  key: "general",
  name: "General / EBI Team",
  repName: "Jean-Pierre Laurent",
  repRole: "Client Success Manager",
};

export function getDepartment(key: string): DepartmentRep {
  return (
    DEPARTMENTS.find((d) => d.key === key) ||
    (key === "general" ? GENERAL_REP : GENERAL_REP)
  );
}

export function departmentKeyForName(name: string): string | undefined {
  const n = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/(software|solutions it|it & digital|development|erp|digital)/.test(n))
    return "development";
  if (/(tele[- ]?service|call center|bilingual.*support|support.*outbound)/.test(n))
    return "teleservices";
  if (/\bbpo\b|business process/.test(n)) return "bpo";
  if (/(recruit|sourcing|talent|profile integration|integration de profils)/.test(n))
    return "recruitment";
  return undefined;
}
