import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticatedState, renderWithProviders } from '../../../tests/utils.jsx';
import ocrApi from '../../api/ocr.js';
import { mapToSlots, slotsToMap } from './ItemEditor.jsx';
import ScanReview, { itemsMissingStock, pendingItems } from './ScanReview.jsx';
import ScanUploader, { MAX_BYTES, checkFile } from './ScanUploader.jsx';

vi.mock('../../api/ocr.js', () => ({
  default: {
    scan: vi.fn(),
    parseText: vi.fn(),
    reparse: vi.fn(),
    updateItem: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
    imageUrl: vi.fn(),
  },
}));

const item = (overrides = {}) => ({
  id: 'i1',
  name: 'Metformin',
  strength: '500',
  strength_unit: 'mg',
  form: 'Tablet',
  slots: [
    { slot: 'MORNING', quantity: '1' },
    { slot: 'NIGHT', quantity: '1' },
  ],
  frequency: 'DAILY',
  interval_days: 1,
  as_needed: false,
  duration_days: 30,
  total_quantity: '60',
  instructions: '',
  reference: 'r1',
  reference_label: 'Metformin 500 mg (Tablet)',
  match_level: 'AUTO',
  suggestions: [],
  confidence: 0.9,
  confidence_band: 'HIGH',
  reasons: [],
  raw_line: 'Tab Metformin 500 mg 1-0-1 x 30 days',
  status: 'PENDING',
  ...overrides,
});

const job = (overrides = {}) => ({
  id: 'j1',
  status: 'COMPLETED',
  raw_text: 'Tab Metformin 500 mg 1-0-1 x 30 days',
  has_image: false,
  warnings: [],
  header: {},
  items: [item()],
  ...overrides,
});

const render = (ui) => renderWithProviders(ui, { preloadedState: authenticatedState() });

beforeEach(() => vi.clearAllMocks());

const file = (over = {}) => ({ type: 'image/png', size: 1000, name: 'rx.png', ...over });

describe('checkFile', () => {
  it('accepts a normal image', () => expect(checkFile(file())).toBeNull());

  it('refuses an unsupported type with a plain message', () => {
    expect(checkFile(file({ type: 'application/pdf' }))).toMatch(/JPEG, PNG/);
  });

  it('refuses an oversized file and says how big it was', () => {
    expect(checkFile(file({ size: MAX_BYTES + 5 * 1048576 }))).toMatch(/15\.0 MB/);
  });

  it('asks for a file when there is none', () =>
    expect(checkFile(null)).toMatch(/choose a photo/i));
});

describe('slot conversion', () => {
  it('round-trips, in day order', () => {
    const map = slotsToMap([
      { slot: 'NIGHT', quantity: '2' },
      { slot: 'MORNING', quantity: '1' },
    ]);
    expect(mapToSlots(map).map((s) => s.slot)).toEqual(['MORNING', 'NIGHT']);
  });

  it('drops empty quantities', () => {
    expect(mapToSlots({ MORNING: '' })).toEqual([]);
  });
});

describe('job helpers', () => {
  it('counts only pending items', () => {
    const j = job({ items: [item(), item({ id: 'i2', status: 'REJECTED' })] });
    expect(pendingItems(j)).toHaveLength(1);
  });

  it('finds items that have no unit count', () => {
    const j = job({ items: [item({ total_quantity: null }), item({ id: 'i2' })] });
    expect(itemsMissingStock(j).map((i) => i.id)).toEqual(['i1']);
  });
});

describe('ScanUploader - typed text', () => {
  it('sends pasted text for the chosen patient and hands back the result', async () => {
    ocrApi.parseText.mockResolvedValue(job());
    const onResult = vi.fn();
    render(<ScanUploader patientId="p1" onResult={onResult} />);

    await userEvent.click(screen.getByRole('tab', { name: /type or paste/i }));
    await userEvent.type(screen.getByLabelText(/prescription text/i), 'Tab Metformin 500 mg');
    await userEvent.click(screen.getByRole('button', { name: /find the medicines/i }));

    await waitFor(() =>
      expect(ocrApi.parseText).toHaveBeenCalledWith({
        patient: 'p1',
        text: 'Tab Metformin 500 mg',
        kind: 'PRESCRIPTION',
      })
    );
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ id: 'j1' }));
  });

  it('does not call the server for empty text', async () => {
    render(<ScanUploader patientId="p1" onResult={vi.fn()} />);
    await userEvent.click(screen.getByRole('tab', { name: /type or paste/i }));
    await userEvent.click(screen.getByRole('button', { name: /find the medicines/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/paste or type/i);
    expect(ocrApi.parseText).not.toHaveBeenCalled();
  });

  it('shows the server error when reading fails', async () => {
    ocrApi.parseText.mockRejectedValue({ message: 'Too long.' });
    render(<ScanUploader patientId="p1" onResult={vi.fn()} />);
    await userEvent.click(screen.getByRole('tab', { name: /type or paste/i }));
    await userEvent.type(screen.getByLabelText(/prescription text/i), 'x');
    await userEvent.click(screen.getByRole('button', { name: /find the medicines/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Too long.');
  });
});

describe('ScanUploader - photo', () => {
  it('offers the camera and a file picker', () => {
    render(<ScanUploader patientId="p1" onResult={vi.fn()} />);
    expect(screen.getByRole('button', { name: /take a photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose an image file/i })).toBeInTheDocument();
    const camera = document.querySelector('input[capture]');
    expect(camera).toHaveAttribute('capture', 'environment');
  });

  it('rejects a bad file before uploading it', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    render(<ScanUploader patientId="p1" onResult={vi.fn()} />);

    const input = screen.getByLabelText('Upload an image file');
    const pdf = new File(['x'], 'rx.pdf', { type: 'application/pdf' });
    await userEvent.upload(input, pdf, { applyAccept: false });

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPEG, PNG/);
    expect(ocrApi.scan).not.toHaveBeenCalled();
  });

  it('previews a good file and uploads it on request', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    ocrApi.scan.mockResolvedValue(job());
    const onResult = vi.fn();
    render(<ScanUploader patientId="p1" onResult={onResult} />);

    const png = new File(['x'], 'rx.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Upload an image file'), png);
    expect(await screen.findByAltText(/the prescription you chose/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /read this prescription/i }));
    await waitFor(() => expect(ocrApi.scan).toHaveBeenCalled());
    expect(ocrApi.scan.mock.calls[0][0]).toMatchObject({ patient: 'p1', file: png });
    expect(onResult).toHaveBeenCalled();
  });
});

describe('ScanReview', () => {
  it('lists the medicines and reassures that nothing is added yet', () => {
    render(
      <ScanReview job={job()} onJobChange={vi.fn()} onConfirmed={vi.fn()} onDiscard={vi.fn()} />
    );
    expect(screen.getByText('1 medicine found')).toBeInTheDocument();
    expect(screen.getByText(/nothing is added until/i)).toBeInTheDocument();
    expect(screen.getByText(/matched: metformin 500 mg/i)).toBeInTheDocument();
  });

  it('adds the medicines on confirmation and reports the result', async () => {
    const result = { medicines: [{ id: 'm1', display_name: 'Metformin', schedules: [] }] };
    ocrApi.confirm.mockResolvedValue(result);
    const onConfirmed = vi.fn();
    render(
      <ScanReview job={job()} onJobChange={vi.fn()} onConfirmed={onConfirmed} onDiscard={vi.fn()} />
    );

    await userEvent.click(screen.getByRole('button', { name: /add to my medicines/i }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(result));
  });

  it('will not add anything while an item has no unit count', () => {
    render(
      <ScanReview
        job={job({ items: [item({ total_quantity: null })] })}
        onJobChange={vi.fn()}
        onConfirmed={vi.fn()}
        onDiscard={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /add to my medicines/i })).toBeDisabled();
    expect(screen.getByText(/enter how many units you have for metformin/i)).toBeInTheDocument();
  });

  it('will not add while an edit is unsaved', async () => {
    render(
      <ScanReview job={job()} onJobChange={vi.fn()} onConfirmed={vi.fn()} onDiscard={vi.fn()} />
    );
    const add = screen.getByRole('button', { name: /add to my medicines/i });
    expect(add).toBeEnabled();

    await userEvent.type(screen.getByLabelText('Strength'), '0');
    expect(add).toBeDisabled();
    expect(screen.getByText(/save your changes before adding/i)).toBeInTheDocument();
  });

  it('saves an edit and hands the corrected item back', async () => {
    ocrApi.updateItem.mockResolvedValue(item({ strength: '5000' }));
    const onJobChange = vi.fn();
    render(
      <ScanReview job={job()} onJobChange={onJobChange} onConfirmed={vi.fn()} onDiscard={vi.fn()} />
    );

    await userEvent.type(screen.getByLabelText('Strength'), '0');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(ocrApi.updateItem).toHaveBeenCalled());
    expect(ocrApi.updateItem.mock.calls[0][0]).toBe('i1');
    expect(ocrApi.updateItem.mock.calls[0][1]).toMatchObject({ strength: '5000' });
    expect(onJobChange).toHaveBeenCalled();
  });

  it('does NOT apply a doubtful match - it offers it', async () => {
    ocrApi.updateItem.mockResolvedValue(item());
    const doubtful = item({
      reference: null,
      match_level: 'POSSIBLE',
      confidence_band: 'MEDIUM',
      suggestions: [{ id: 'r9', label: 'Pioglitazone 15 mg (Tablet)' }],
    });
    render(
      <ScanReview
        job={job({ items: [doubtful] })}
        onJobChange={vi.fn()}
        onConfirmed={vi.fn()}
        onDiscard={vi.fn()}
      />
    );

    expect(screen.queryByText(/matched:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not sure which product/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /pioglitazone 15 mg/i }));
    await waitFor(() =>
      expect(ocrApi.updateItem).toHaveBeenCalledWith(
        'i1',
        expect.objectContaining({ reference: 'r9' })
      )
    );
  });

  it('shows why a line is doubtful', () => {
    render(
      <ScanReview
        job={job({
          items: [item({ confidence_band: 'LOW', reasons: ['No dose times were found.'] })],
        })}
        onJobChange={vi.fn()}
        onConfirmed={vi.fn()}
        onDiscard={vi.fn()}
      />
    );
    expect(screen.getByText('No dose times were found.')).toBeInTheDocument();
    expect(screen.getByText('Check carefully')).toBeInTheDocument();
  });

  it('re-reads corrected text', async () => {
    ocrApi.reparse.mockResolvedValue(job({ raw_text: 'fixed' }));
    const onJobChange = vi.fn();
    render(
      <ScanReview job={job()} onJobChange={onJobChange} onConfirmed={vi.fn()} onDiscard={vi.fn()} />
    );

    const reread = screen.getByRole('button', { name: /read this text again/i });
    expect(reread).toBeDisabled(); // nothing changed yet
    await userEvent.clear(screen.getByLabelText('Recognised text'));
    await userEvent.type(screen.getByLabelText('Recognised text'), 'fixed');
    await userEvent.click(reread);

    await waitFor(() => expect(ocrApi.reparse).toHaveBeenCalledWith('j1', 'fixed'));
    expect(onJobChange).toHaveBeenCalled();
  });

  it('explains a failed scan and lets the patient start again', async () => {
    const onDiscard = vi.fn();
    render(
      <ScanReview
        job={job({ status: 'FAILED', error: 'Tesseract is not installed on this server.' })}
        onJobChange={vi.fn()}
        onConfirmed={vi.fn()}
        onDiscard={onDiscard}
      />
    );
    expect(screen.getByText(/tesseract is not installed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /start again/i }));
    expect(onDiscard).toHaveBeenCalled();
  });

  it('surfaces the server complaint if confirming is refused', async () => {
    ocrApi.confirm.mockRejectedValue({
      message: 'Some items need attention.',
      details: { items: { i1: 'How many Metformin do you have?' } },
    });
    render(
      <ScanReview job={job()} onJobChange={vi.fn()} onConfirmed={vi.fn()} onDiscard={vi.fn()} />
    );
    await userEvent.click(screen.getByRole('button', { name: /add to my medicines/i }));

    expect(await screen.findByText(/how many metformin do you have/i)).toBeInTheDocument();
  });
});
