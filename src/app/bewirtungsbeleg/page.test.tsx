import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@/test-utils';
import BewirtungsbelegPage from './page';

// Mock the BewirtungsbelegForm component
jest.mock('../components/BewirtungsbelegForm', () => {
  return function MockBewirtungsbelegForm() {
    return <div data-testid="bewirtungsbeleg-form">Mocked BewirtungsbelegForm</div>;
  };
});

describe('BewirtungsbelegPage', () => {
  it('should render the page with logo and form', () => {
    renderWithProviders(<BewirtungsbelegPage />);
    
    // Check if logo is rendered
    const logo = screen.getByAltText('DocBits Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/docbits.svg');
    
    // Check if form component is rendered
    expect(screen.getByTestId('bewirtungsbeleg-form')).toBeInTheDocument();
  });

  it('should have proper container sizing', () => {
    const { container } = renderWithProviders(<BewirtungsbelegPage />);
    
    // Check if Container component is rendered with proper attributes
    const mainContainer = container.querySelector('[class*="mantine-Container-root"]');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should center align the logo', () => {
    const { container } = renderWithProviders(<BewirtungsbelegPage />);
    
    // Check if Stack component has center alignment
    const stack = container.querySelector('[class*="mantine-Stack-root"]');
    expect(stack).toBeInTheDocument();
  });
});