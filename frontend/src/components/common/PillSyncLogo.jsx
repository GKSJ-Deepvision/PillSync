import logoWhiteUrl from '../../assets/pillsync-logo-white.png';
import logoDarkIconUrl from '../../assets/pillsync-dark-icon.png';

/**
 * PillSync Brand Logo Icon
 * Displays the white dual-capsule emblem inside the signature dark #111827 box.
 */
export function PillSyncIcon({
  className = 'h-full w-full',
  variant = 'white', // 'white' | 'badge'
  alt = 'PillSync Logo',
  ...props
}) {
  const src = variant === 'badge' ? logoDarkIconUrl : logoWhiteUrl;
  return (
    <img
      src={src}
      alt={alt}
      className={`inline-block object-contain select-none pointer-events-none transition-transform ${className}`}
      {...props}
    />
  );
}

/**
 * PillSync Logo with signature dark #111827 container box and text
 */
export function PillSyncLogo({
  className = '',
  iconClassName = 'h-5 w-5',
  boxClassName = '',
  showText = true,
  textClassName = '',
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] border border-slate-800 shadow-md shadow-slate-950/20 transition-all hover:bg-[#1f2937] hover:scale-105 p-2 ${boxClassName}`}
      >
        <PillSyncIcon className={iconClassName} variant="white" />
      </div>
      {showText && (
        <span className={`text-xl font-extrabold tracking-tight text-slate-900 ${textClassName}`}>
          PillSync
        </span>
      )}
    </div>
  );
}
