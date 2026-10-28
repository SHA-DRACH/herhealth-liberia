import { englishStrings } from "@/lib/i18n";
import { LIBERIA_COUNTIES, SERVICE_KEYS } from "@/lib/content/public";
import { saveFacilityAction } from "@/app/admin/actions";
import { btnPrimary, card, input, label } from "./ui";

export interface FacilityValues {
  id?: number;
  name?: string;
  facility_type?: string;
  county?: string;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  opening_hours?: string | null;
  services?: string[];
}

export function FacilityForm({ f = {} }: { f?: FacilityValues }) {
  const names = englishStrings as Record<string, string>;
  return (
    <form action={saveFacilityAction} className={`${card} grid gap-3 md:grid-cols-2`}>
      <h2 className="font-semibold md:col-span-2">{f.id ? "Edit details" : "Add a facility or helpline"}</h2>
      {f.id && (
        <p className="text-sm text-amber-700 md:col-span-2">
          Saving changes withdraws verification; the record must be verified again before it can be published.
        </p>
      )}
      {f.id && <input type="hidden" name="id" value={f.id} />}
      <label className={label}>
        Name
        <input name="name" defaultValue={f.name} required className={input} />
      </label>
      <label className={label}>
        Type
        <select name="facility_type" defaultValue={f.facility_type ?? "FACILITY"} className={input}>
          <option value="FACILITY">Health facility</option>
          <option value="HOTLINE">Helpline / hotline</option>
        </select>
      </label>
      <label className={label}>
        County
        <select name="county" defaultValue={f.county ?? ""} required className={input}>
          <option value="" disabled>
            Choose…
          </option>
          {LIBERIA_COUNTIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className={label}>
        District
        <input name="district" defaultValue={f.district ?? ""} className={input} />
      </label>
      <label className={`${label} md:col-span-2`}>
        Address / directions
        <input name="address" defaultValue={f.address ?? ""} className={input} />
      </label>
      <label className={label}>
        Phone (as verified)
        <input name="phone" defaultValue={f.phone ?? ""} className={input} />
      </label>
      <label className={label}>
        Opening hours
        <input name="opening_hours" defaultValue={f.opening_hours ?? ""} className={input} />
      </label>
      <label className={label}>
        Latitude
        <input name="latitude" type="number" step="any" defaultValue={f.latitude ?? ""} className={input} />
      </label>
      <label className={label}>
        Longitude
        <input name="longitude" type="number" step="any" defaultValue={f.longitude ?? ""} className={input} />
      </label>
      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium text-slate-700">Services offered</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {SERVICE_KEYS.map((k) => (
            <label key={k} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="services" value={k} defaultChecked={f.services?.includes(k)} /> {names[`service.${k}`]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="md:col-span-2">
        <button className={btnPrimary}>Save</button>
      </div>
    </form>
  );
}
