import { fieldClass, labelClass } from "@/components/admin/styles";
import { clientStatuses, clientStatusLabels } from "@/lib/admin/billing";

export type ClientValues = {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  ice?: string | null;
  source?: string | null;
  notes?: string | null;
  status?: string;
  follow_up_at?: string | null;
};

const fields = [
  { name: "name", label: "Nom du contact", required: true },
  { name: "company", label: "Entreprise" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "city", label: "Ville" },
  { name: "ice", label: "ICE (pour la facture)" },
  { name: "source", label: "Source", placeholder: "Site, recommandation, salon…" },
] as const;

export function ClientFields({ values = {}, prefix = "" }: { values?: ClientValues; prefix?: string }) {
  const id = (name: string) => `${prefix}${name}`;
  return (
    <>
      {fields.map((item) => (
        <div key={item.name}>
          <label className={labelClass} htmlFor={id(item.name)}>
            {item.label}
          </label>
          <input
            id={id(item.name)}
            name={item.name}
            type={"type" in item ? item.type : "text"}
            required={"required" in item}
            placeholder={"placeholder" in item ? item.placeholder : undefined}
            defaultValue={values[item.name] ?? ""}
            className={fieldClass}
          />
        </div>
      ))}
      <div>
        <label className={labelClass} htmlFor={id("status")}>
          Étape
        </label>
        <select id={id("status")} name="status" defaultValue={values.status ?? "lead"} className={fieldClass}>
          {clientStatuses.map((status) => (
            <option key={status} value={status}>
              {clientStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor={id("follow_up_at")}>
          Prochaine relance
        </label>
        <input id={id("follow_up_at")} name="follow_up_at" type="date" defaultValue={values.follow_up_at ?? ""} className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={id("address")}>
          Adresse
        </label>
        <input id={id("address")} name="address" defaultValue={values.address ?? ""} className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={id("notes")}>
          Notes
        </label>
        <textarea id={id("notes")} name="notes" rows={4} defaultValue={values.notes ?? ""} className={fieldClass} />
      </div>
    </>
  );
}
