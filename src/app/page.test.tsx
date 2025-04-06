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
   * - Der Release Notes Button ist vorhanden
   * 
   * FEHLERFALL:
   * - Test schlägt fehl, wenn die Seite nicht geladen werden kann
   * - Test schlägt fehl, wenn die Hauptüberschrift fehlt
   * - Test schlägt fehl, wenn der Button fehlt
   * - Test schlägt fehl, wenn das Logo fehlt
   * - Test schlägt fehl, wenn der Release Notes Button fehlt
   */
  it('sollte die Startseite korrekt laden und alle wichtigen Elemente anzeigen', () => {
    // GEGEBEN: Die Startseite wird gerendert
    renderWithProviders(<Home />);

    // WENN: Wir nach den wichtigen Elementen suchen
    const heading = screen.getByRole('heading', { level: 1 });
    const logo = screen.getByAltText('DocBits Logo');
    const createButton = screen.getByRole('link', { name: 'Jetzt Bewirtungsbeleg erstellen' });
    const releaseNotesButton = screen.getByRole('link', { name: 'Release Notes anzeigen' });

    // DANN: Sollten diese Elemente vorhanden und sichtbar sein
    expect(heading).toBeInTheDocument();
    expect(heading).toBeVisible();
    expect(heading).toHaveTextContent('Bewirtungsbelege einfach erstellen');
    
    expect(logo).toBeInTheDocument();
    expect(logo).toBeVisible();
    
    expect(createButton).toBeInTheDocument();
    expect(createButton).toBeVisible();
    expect(createButton).toHaveAttribute('href', '/bewirtungsbeleg');

    expect(releaseNotesButton).toBeInTheDocument();
    expect(releaseNotesButton).toBeVisible();
    expect(releaseNotesButton).toHaveAttribute('href', '/release-notes');
  });

  it('zeigt den Haupttitel und den Button zum Formular an', () => {
    renderWithProviders(<Home />);
    
    // Prüfe ob der Haupttitel vorhanden ist
    expect(screen.getByRole('heading', { 
      name: /bewirtungsbelege einfach erstellen/i 
    })).toBeInTheDocument();
    
    // Prüfe ob der Button zum Formular vorhanden ist
    const formButton = screen.getByRole('link', {
      name: /jetzt bewirtungsbeleg erstellen/i
    });
    expect(formButton).toBeInTheDocument();
    expect(formButton).toHaveAttribute('href', '/bewirtungsbeleg');
  });

  it('zeigt den Release Notes Button mit korrektem Link an', () => {
    renderWithProviders(<Home />);
    
    // Prüfe ob der Release Notes Button vorhanden ist
    const releaseNotesButton = screen.getByRole('link', {
      name: /release notes anzeigen/i
    });
    
    // Prüfe ob der Button korrekt konfiguriert ist
    expect(releaseNotesButton).toBeInTheDocument();
    expect(releaseNotesButton).toBeVisible();
    expect(releaseNotesButton).toHaveAttribute('href', '/release-notes');
  });
}); 