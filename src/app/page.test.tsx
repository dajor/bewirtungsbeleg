import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '../test-utils';
import Home from './page';

describe('Startseite (Home Page)', () => {
  /**
   * ERFOLGSFALL:
   * - Die Seite wird ohne Fehler geladen
   * - Die Hauptüberschrift ist sichtbar
   * - Der "Jetzt Bewirtungsbeleg erstellen" Button ist vorhanden
   * - Das DocBits Logo ist sichtbar
   * 
   * FEHLERFALL:
   * - Test schlägt fehl, wenn die Seite nicht geladen werden kann
   * - Test schlägt fehl, wenn die Hauptüberschrift fehlt
   * - Test schlägt fehl, wenn der Button fehlt
   * - Test schlägt fehl, wenn das Logo fehlt
   */
  it('sollte die Startseite korrekt laden und alle wichtigen Elemente anzeigen', () => {
    // GEGEBEN: Die Startseite wird gerendert
    renderWithProviders(<Home />);

    // WENN: Wir nach den wichtigen Elementen suchen
    const heading = screen.getByRole('heading', { level: 1 });
    const logo = screen.getByAltText('DocBits Logo');
    const createButton = screen.getByRole('link', { name: 'Jetzt Bewirtungsbeleg erstellen' });

    // DANN: Sollten diese Elemente vorhanden und sichtbar sein
    expect(heading).toBeInTheDocument();
    expect(heading).toBeVisible();
    expect(heading).toHaveTextContent('Bewirtungsbelege einfach erstellen');
    
    expect(logo).toBeInTheDocument();
    expect(logo).toBeVisible();
    
    expect(createButton).toBeInTheDocument();
    expect(createButton).toBeVisible();
    expect(createButton).toHaveAttribute('href', '/bewirtungsbeleg');
  });
}); 