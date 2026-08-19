/* Shared labeled-input chassis — same visual contract everywhere it appears
 * (originally ProfileSetup's local Field): u-eyebrow label above a sharp,
 * hairline-bordered input. `error` is a deliberate, scoped exception to
 * brick meaning "verified" — it's the one other state worth a color. */
export default function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  required,
  hint,
  error,
  type = "text",
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
        {label}
        {optional && <span className="ml-1.5 normal-case tracking-normal text-graphite/84">optional</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`border bg-paper px-3 py-2.5 u-fact text-sm text-graphite transition-colors placeholder:text-graphite/84 focus:border-graphite/60 ${
          error ? "border-brick/60" : "border-graphite/20"
        }`}
        style={{ borderRadius: "2px" }}
      />
      {error ? (
        <p className="u-fact text-[0.66rem] text-brick" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="u-fact text-[0.66rem] text-graphite/84">{hint}</p>
      )}
    </div>
  );
}
