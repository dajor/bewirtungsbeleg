import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import BewirtungsbelegForm from '../BewirtungsbelegForm';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

// Mock jsPDF
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    getNumberOfPages: jest.fn().mockReturnValue(1),
    setPage: jest.fn(),
    setLineWidth: jest.fn(),
  })),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MantineProvider>
      <ModalsProvider>
        {ui}
      </ModalsProvider>
    </MantineProvider>
  );
};

describe('BewirtungsbelegForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PDF wird erfolgreich generiert', async () => {
    renderWithProviders(<BewirtungsbelegForm />);

    // Formular ausfüllen
    fireEvent.change(screen.getByLabelText(/datum der bewirtung/i), {
      target: { value: '20.03.2024' },
    });
    fireEvent.change(screen.getByLabelText(/name des restaurants/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByLabelText(/anlass der bewirtung/i), {
      target: { value: 'Geschäftsessen' },
    });
    fireEvent.change(screen.getByLabelText(/namen der teilnehmer/i), {
      target: { value: 'Max Mustermann' },
    });
    fireEvent.change(screen.getByLabelText(/gesamtbetrag/i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText(/namen der geschäftspartner/i), {
      target: { value: 'Partner Name' },
    });
    fireEvent.change(screen.getByLabelText(/firma der geschäftspartner/i), {
      target: { value: 'Partner Firma' },
    });

    // Submit-Button finden und klicken
    const submitButton = screen.getByRole('button', { name: 'Bewirtungsbeleg erstellen' });
    fireEvent.click(submitButton);

    // Warten auf den Bestätigungs-Dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Bestätigung')).toBeInTheDocument();
    }, { timeout: 3000 });

    // PDF-Button im Modal finden und klicken
    const dialog = screen.getByRole('dialog');
    const pdfButton = within(dialog).getByRole('button', { name: 'PDF erstellen' });
    fireEvent.click(pdfButton);

    // Erfolgsbenachrichtigung prüfen
    await waitFor(() => {
      expect(screen.getByText(/bewirtungsbeleg wurde erfolgreich als pdf erstellt/i)).toBeInTheDocument();
    });
  });

  it('PDF wird auch ohne optionale Felder generiert', async () => {
    renderWithProviders(<BewirtungsbelegForm />);

    // Formular ausfüllen (nur Pflichtfelder)
    fireEvent.change(screen.getByLabelText(/datum der bewirtung/i), {
      target: { value: '20.03.2024' },
    });
    fireEvent.change(screen.getByLabelText(/name des restaurants/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByLabelText(/anlass der bewirtung/i), {
      target: { value: 'Geschäftsessen' },
    });
    fireEvent.change(screen.getByLabelText(/namen der teilnehmer/i), {
      target: { value: 'Max Mustermann' },
    });
    fireEvent.change(screen.getByLabelText(/gesamtbetrag/i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText(/namen der geschäftspartner/i), {
      target: { value: 'Partner Name' },
    });
    fireEvent.change(screen.getByLabelText(/firma der geschäftspartner/i), {
      target: { value: 'Partner Firma' },
    });

    // Submit-Button finden und klicken
    const submitButton = screen.getByRole('button', { name: 'Bewirtungsbeleg erstellen' });
    fireEvent.click(submitButton);

    // Warten auf den Bestätigungs-Dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Bestätigung')).toBeInTheDocument();
    }, { timeout: 3000 });

    // PDF-Button im Modal finden und klicken
    const dialog = screen.getByRole('dialog');
    const pdfButton = within(dialog).getByRole('button', { name: 'PDF erstellen' });
    fireEvent.click(pdfButton);

    // Erfolgsbenachrichtigung prüfen
    await waitFor(() => {
      expect(screen.getByText(/bewirtungsbeleg wurde erfolgreich als pdf erstellt/i)).toBeInTheDocument();
    });
  });

  it('Fehlerbehandlung bei PDF-Generierung', async () => {
    // Mock jsPDF um einen Fehler zu werfen
    const jsPDFMock = jest.requireMock('jspdf').jsPDF;
    jsPDFMock.mockImplementationOnce(() => {
      throw new Error('PDF Fehler');
    });

    renderWithProviders(<BewirtungsbelegForm />);

    // Formular ausfüllen
    fireEvent.change(screen.getByLabelText(/datum der bewirtung/i), {
      target: { value: '20.03.2024' },
    });
    fireEvent.change(screen.getByLabelText(/name des restaurants/i), {
      target: { value: 'Test Restaurant' },
    });
    fireEvent.change(screen.getByLabelText(/anlass der bewirtung/i), {
      target: { value: 'Geschäftsessen' },
    });
    fireEvent.change(screen.getByLabelText(/namen der teilnehmer/i), {
      target: { value: 'Max Mustermann' },
    });
    fireEvent.change(screen.getByLabelText(/gesamtbetrag/i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText(/namen der geschäftspartner/i), {
      target: { value: 'Partner Name' },
    });
    fireEvent.change(screen.getByLabelText(/firma der geschäftspartner/i), {
      target: { value: 'Partner Firma' },
    });

    // Submit-Button finden und klicken
    const submitButton = screen.getByRole('button', { name: 'Bewirtungsbeleg erstellen' });
    fireEvent.click(submitButton);

    // Warten auf den Bestätigungs-Dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Bestätigung')).toBeInTheDocument();
    }, { timeout: 3000 });

    // PDF-Button im Modal finden und klicken
    const dialog = screen.getByRole('dialog');
    const pdfButton = within(dialog).getByRole('button', { name: 'PDF erstellen' });
    fireEvent.click(pdfButton);

    // Fehlermeldung prüfen
    await waitFor(() => {
      expect(screen.getByText(/fehler beim erstellen des pdfs/i)).toBeInTheDocument();
    });
  });
}); 