export default function DoseRing({ windows = ["morning", "afternoon", "night"] }) {
  return (
    <div
      role="img"
      aria-label="today's dosing windows"
      className="flex gap-2 items-center"
    >
      {windows.map((w) => (
        <span
          key={w}
          className="px-3 py-1 rounded-full border text-xs capitalize"
        >
          {w}
        </span>
      ))}
    </div>
  );
}
