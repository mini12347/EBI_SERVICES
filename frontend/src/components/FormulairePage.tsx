import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiCreateLead } from "../api/leads";

export function FormulairePage({ setPage }: { setPage?: (p: string) => void }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", need: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est requis";
    if (!form.email.trim()) {
      e.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Email invalide";
    }
    if (!form.phone.trim()) {
      e.phone = "Le téléphone est requis";
    } else if (!/^[+\d\s\-()]{6,20}$/.test(form.phone)) {
      e.phone = "Numéro de téléphone invalide";
    }
    if (!form.need.trim()) {
      e.need = "Veuillez décrire votre besoin";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      await apiCreateLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        projectDescription: form.need,
        source: "contact_form",
      });
      setDone(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur réseau lors de l'envoi.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">Formulaire soumis avec succès</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          Merci <strong>{form.name}</strong> ! Votre demande a bien été reçue.
          Notre équipe reviendra vers vous.
        </p>
        <button
          onClick={() => setPage?.("dashboard")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-bold text-foreground mb-1 tracking-tight">Formulaire de contact</h2>
        <p className="text-sm text-muted-foreground mb-6">Veuillez remplir vos informations ci-dessous.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Nom complet</label>
            <input
              className="w-full h-10 px-3 bg-input-background rounded-lg text-sm border border-border focus:outline-none focus:border-purple-400/40 transition-colors"
              placeholder="Jean Dupuis"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              className="w-full h-10 px-3 bg-input-background rounded-lg text-sm border border-border focus:outline-none focus:border-purple-400/40 transition-colors"
              placeholder="jean@entreprise.fr"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Téléphone</label>
            <input
              type="tel"
              className="w-full h-10 px-3 bg-input-background rounded-lg text-sm border border-border focus:outline-none focus:border-purple-400/40 transition-colors"
              placeholder="+33 6 12 34 56 78"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Votre besoin</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-input-background rounded-lg text-sm border border-border focus:outline-none focus:border-purple-400/40 transition-colors resize-none"
              placeholder="Décrivez votre projet ou besoin..."
              value={form.need}
              onChange={e => setForm(prev => ({ ...prev, need: e.target.value }))}
            />
            {errors.need && <p className="text-xs text-red-500 mt-1">{errors.need}</p>}
          </div>
        </div>

        {submitError && (
          <p className="text-xs text-red-500 mt-4 text-center">{submitError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Envoi en cours..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
