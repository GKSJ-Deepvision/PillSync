export default function ProfilePhoto({ src, name, className = "" }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink font-display text-xs font-semibold text-porcelain ${className}`}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}