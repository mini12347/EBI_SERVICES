import React from "react";
import {
  Briefcase,
  HeartHandshake,
  Layers3,
  ShieldCheck,
  Target,
} from "lucide-react";

const values = [
  {
    icon: <Target className="h-5 w-5 text-blue-900" />,
    title: "Des solutions adaptées",
    description:
      "Nous prenons le temps de comprendre votre besoin pour vous orienter vers une prestation et un accompagnement appropriés.",
  },
  {
    icon: <HeartHandshake className="h-5 w-5 text-blue-900" />,
    title: "Un accompagnement de proximité",
    description:
      "Notre équipe échange avec vous pour préciser votre demande et assurer le suivi des prochaines étapes.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-blue-900" />,
    title: "Un suivi centralisé",
    description:
      "L’espace client est conçu pour consulter vos demandes et devis, échanger des documents et communiquer avec EBI Services.",
  },
];

export default function AboutView() {
  return (
    <div className="space-y-16 py-8">
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            À propos d’EBI Services
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Un partenaire pour vos projets et vos opérations
          </h1>
          <p className="text-base leading-relaxed text-gray-600">
            EBI Services accompagne les entreprises dans trois domaines :
            développement numérique, recrutement et téléservices. Notre équipe
            échange avec vous pour comprendre votre besoin et définir les
            prochaines étapes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Notre approche
          </h2>
          <p className="text-sm text-gray-500">
            Un échange clair, de la compréhension du besoin à son suivi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((value) => (
            <article
              key={value.title}
              className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                {value.icon}
              </div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Nos domaines d’intervention
            </span>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Trois expertises complémentaires
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              Du développement d’applications à la recherche de profils, en
              passant par la relation client et le back-office, nous vous
              aidons à identifier le service adapté à votre situation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1">
            {[
              "Développement",
              "Recrutement",
              "Téléservices",
            ].map((department) => (
              <div
                key={department}
                className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-950"
              >
                <Layers3 className="h-5 w-5 shrink-0 text-blue-800" />
                <span>{department}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-gray-600 md:col-span-2">
            <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-blue-900" />
            <p>
              Vous pouvez présenter votre besoin depuis le formulaire de
              contact ou échanger avec notre assistant pour être orienté.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
