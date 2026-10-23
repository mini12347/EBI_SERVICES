import React, { useState } from "react";
import {
  AppWindow,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileClock,
  Hammer,
  Laptop,
  PhoneCall,
  Search,
  ShieldCheck,
  Users2,
} from "lucide-react";

interface ServicesViewProps {
  setActiveTab: (tab: string) => void;
}

type ActiveDept = "development" | "recruitment" | "tele-services";

const departments = [
  {
    id: "development",
    label: "Développement",
    title: "Développement numérique",
    description:
      "Nous concevons, intégrons et faisons évoluer des solutions numériques en fonction de vos besoins et de vos processus métier.",
    icon: <Laptop className="h-4 w-4" />,
    services: [
      {
        icon: <AppWindow className="h-6 w-6 text-blue-900" />,
        title: "Applications web",
        description:
          "Conception et développement d’applications web adaptées aux utilisateurs et aux objectifs de votre organisation.",
      },
      {
        icon: <BriefcaseBusiness className="h-6 w-6 text-blue-900" />,
        title: "Applications métier",
        description:
          "Outils numériques conçus pour accompagner vos activités et vos processus métier.",
      },
      {
        icon: <Hammer className="h-6 w-6 text-blue-900" />,
        title: "Solutions sur mesure",
        description:
          "Développement de solutions adaptées à votre contexte, à vos besoins et à vos priorités.",
      },
      {
        icon: <ClipboardList className="h-6 w-6 text-blue-900" />,
        title: "Intégration",
        description:
          "Intégration de solutions et de systèmes à votre environnement existant.",
      },
      {
        icon: <ShieldCheck className="h-6 w-6 text-blue-900" />,
        title: "Maintenance évolutive et corrective",
        description:
          "Correction des anomalies et évolution de vos applications selon les besoins de votre activité.",
      },
    ],
  },
  {
    id: "recruitment",
    label: "Recrutement",
    title: "Recrutement et accompagnement RH",
    description:
      "Nous vous accompagnons dans la recherche, l’évaluation et la sélection de candidats en fonction des profils recherchés.",
    icon: <Users2 className="h-4 w-4" />,
    services: [
      {
        icon: <Search className="h-6 w-6 text-blue-900" />,
        title: "Recherche et sélection de profils",
        description:
          "Identification de candidats et sélection selon les compétences et critères définis avec vous.",
      },
      {
        icon: <Laptop className="h-6 w-6 text-blue-900" />,
        title: "Recrutement IT",
        description:
          "Recherche de profils informatiques et techniques correspondant à vos besoins.",
      },
      {
        icon: <Users2 className="h-6 w-6 text-blue-900" />,
        title: "Externalisation du recrutement",
        description:
          "Prise en charge externalisée de certaines étapes ou de l’ensemble de votre processus de recrutement.",
      },
      {
        icon: <CheckCircle2 className="h-6 w-6 text-blue-900" />,
        title: "Préqualification des candidats",
        description:
          "Évaluation initiale des candidatures à partir des exigences du poste et de vos critères.",
      },
      {
        icon: <ClipboardList className="h-6 w-6 text-blue-900" />,
        title: "Accompagnement RH",
        description:
          "Appui aux équipes RH pour organiser et suivre leurs besoins de recrutement.",
      },
    ],
  },
  {
    id: "tele-services",
    label: "Téléservices",
    title: "Téléservices et relation client",
    description:
      "Nous prenons en charge des activités de relation client, d’assistance et de traitement administratif selon le périmètre convenu.",
    icon: <PhoneCall className="h-4 w-4" />,
    services: [
      {
        icon: <PhoneCall className="h-6 w-6 text-blue-900" />,
        title: "Centre de relation client",
        description:
          "Gestion des échanges avec vos clients et accompagnement de leur parcours.",
      },
      {
        icon: <ShieldCheck className="h-6 w-6 text-blue-900" />,
        title: "Support client",
        description:
          "Réponse aux questions et assistance de vos clients selon les consignes définies ensemble.",
      },
      {
        icon: <ClipboardList className="h-6 w-6 text-blue-900" />,
        title: "Assistance administrative",
        description:
          "Prise en charge de tâches administratives pour accompagner vos équipes.",
      },
      {
        icon: <PhoneCall className="h-6 w-6 text-blue-900" />,
        title: "Gestion des appels",
        description:
          "Réception, orientation et suivi des appels selon votre organisation.",
      },
      {
        icon: <FileClock className="h-6 w-6 text-blue-900" />,
        title: "Traitement des demandes",
        description:
          "Qualification et traitement des demandes reçues par vos canaux de contact.",
      },
      {
        icon: <BriefcaseBusiness className="h-6 w-6 text-blue-900" />,
        title: "Back-office",
        description:
          "Réalisation de tâches opérationnelles et de traitement administratif en soutien à votre activité.",
      },
    ],
  },
] satisfies {
  id: ActiveDept;
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  services: { icon: React.ReactNode; title: string; description: string }[];
}[];

export default function ServicesView({ setActiveTab }: ServicesViewProps) {
  const [activeDept, setActiveDept] = useState<ActiveDept>("development");
  const department = departments.find((item) => item.id === activeDept)!;

  return (
    <div className="space-y-12 py-8">
      <section className="mx-auto max-w-7xl space-y-3 px-4 pt-8 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Nos services
        </span>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 sm:text-5xl">
          Des expertises au service de vos besoins
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600">
          EBI Services intervient dans trois domaines complémentaires.
          Sélectionnez un domaine pour découvrir les services proposés.
        </p>
      </section>

      <section
        aria-label="Domaines de services"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex justify-center overflow-x-auto border-b border-gray-200">
          <div className="inline-flex min-w-max gap-2 rounded-xl border border-gray-200 bg-gray-100 p-1.5">
            {departments.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={activeDept === item.id}
                onClick={() => setActiveDept(item.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                  activeDept === item.id
                    ? "bg-blue-900 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-7 sm:p-9">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
            {department.label}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold text-blue-950">
            {department.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            {department.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {department.services.map((service) => (
            <article
              key={service.title}
              className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                {service.icon}
              </div>
              <h3 className="font-display text-base font-bold text-slate-950">
                {service.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-display text-xl font-bold text-slate-950">
            Parlons de votre besoin
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            Présentez votre projet à notre équipe pour être orienté vers le bon
            interlocuteur et définir les prochaines étapes.
          </p>
          <button
            onClick={() => setActiveTab("contact")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-950"
          >
            Contacter notre équipe
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
