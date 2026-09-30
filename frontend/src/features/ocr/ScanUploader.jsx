import { useCallback, useEffect, useRef, useState } from 'react';

import ocrApi from '../../api/ocr.js';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import { useMutation } from '../../hooks/useApi.js';

/** Matches the server's default; the server is the real check, this saves a round trip. */
export const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

export function checkFile(file) {
  if (!file) return 'Choose a photo first.';
  if (!ACCEPTED.includes(file.type)) return 'Use a JPEG, PNG, WEBP or TIFF image.';
  if (file.size > MAX_BYTES) {
    return `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_BYTES / 1048576} MB.`;
  }
  return null;
}

/**
 * Get a prescription into the app: photograph it, upload a file, or paste text.
 *
 * Typing is a first-class path, not a fallback: a patient whose photo will not
 * read, or who has a prescription as a PDF or message, can paste the text and
 * go through exactly the same review.
 */
export default function ScanUploader({ patientId, kind = 'PRESCRIPTION', onResult }) {
  const [mode, setMode] = useState('photo');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState(null);
  const [preview, setPreview] = useState(null);
  const previewRef = useRef(null);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const scan = useMutation(useCallback((args) => ocrApi.scan(args), []));
  const parse = useMutation(useCallback((args) => ocrApi.parseText(args), []));

  // Release the preview's memory when the component goes away. The URL is made in
  // the change handler below, not here, so no state is set from an effect.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  function choose(event) {
    const chosen = event.target.files?.[0] ?? null;
    const problem = chosen ? checkFile(chosen) : null;
    setLocalError(problem);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const usable = chosen && !problem ? chosen : null;
    previewRef.current = usable ? URL.createObjectURL(usable) : null;
    setFile(usable);
    setPreview(previewRef.current);
    event.target.value = '';
  }

  async function submitPhoto() {
    const problem = checkFile(file);
    if (problem) return setLocalError(problem);
    const result = await scan.submit({ patient: patientId, file, kind });
    if (result.ok) onResult(result.data);
  }

  async function submitText(event) {
    event.preventDefault();
    if (!text.trim()) return setLocalError('Paste or type the prescription first.');
    setLocalError(null);
    const result = await parse.submit({ patient: patientId, text, kind });
    if (result.ok) onResult(result.data);
  }

  const error = localError || scan.error?.message || parse.error?.message;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="How to add" className="flex gap-1 border-b border-slate-200">
        {[
          ['photo', 'Photo'],
          ['text', 'Type or paste'],
        ].map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setLocalError(null);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              mode === value
                ? 'border-brand-600 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {mode === 'photo' ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Lay the prescription flat in good light and fill the frame. Avoid shadows and glare.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* `capture` opens the rear camera on a phone; on a desktop it is a normal file picker. */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={choose}
              className="sr-only"
              aria-label="Take a photo"
              tabIndex={-1}
            />
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={choose}
              className="sr-only"
              aria-label="Upload an image file"
              tabIndex={-1}
            />
            <Button variant="secondary" onClick={() => cameraRef.current?.click()}>
              Take a photo
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Choose an image file
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <img
                src={preview}
                alt="The prescription you chose"
                className="max-h-72 rounded-lg border border-slate-200"
              />
              <Button onClick={submitPhoto} loading={scan.submitting}>
                {scan.submitting ? 'Reading the prescription…' : 'Read this prescription'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submitText} className="space-y-3">
          <label htmlFor="scan-text" className="block text-sm font-medium text-slate-700">
            Prescription text
          </label>
          <textarea
            id="scan-text"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              'Tab Metformin 500 mg 1-0-1 x 30 days\nTab Amlodipine 5 mg 0-0-1 x 30 days'
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm
              focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <Button type="submit" loading={parse.submitting}>
            Find the medicines
          </Button>
        </form>
      )}
    </div>
  );
}
