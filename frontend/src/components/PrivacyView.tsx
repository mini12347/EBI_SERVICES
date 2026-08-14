import React from "react";

export default function PrivacyView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-left space-y-6">
      <h1 className="font-display text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <span className="text-xs text-gray-400 block">Last updated: July 9, 2026</span>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-xs text-gray-600 space-y-4 leading-relaxed">
        <p>
          At EBI Services, we prioritize secure data containment. This Privacy Policy details how we compile,
          encrypt, and secure operational lead details, quotation documents, chat transcripts, and schedules
          across our SaaS platform.
        </p>

        <h3 className="font-bold text-slate-900">1. Data Scoping and Storage</h3>
        <p>
          Any technical requirements documents or base64 files uploaded inside our Client Portal secure vault
          are encrypted at rest using industry-grade frameworks. We do not Sell or distribute corporate logs.
        </p>

        <h3 className="font-bold text-slate-900">2. Cookies and Sandbox Environments</h3>
        <p>
          Since our application renders inside highly-secured sandboxed browser iframe layouts, we employ
          non-tracking cookie state markers (storing active sessions purely inside localized client-side
          browser localStorage buckets) to ensure compliance with General Data Protection Regulation (GDPR)
          protocols.
        </p>

        <p>
          For support regarding data purging or compliance audits, contact compliance@ebiservices.com.
        </p>
      </div>
    </div>
  );
}
