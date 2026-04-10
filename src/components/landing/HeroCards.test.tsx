// src/components/landing/HeroCards.test.tsx - Verifica render de las cartas destacadas del hero de landing.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroCards } from './HeroCards';

describe('HeroCards Component', () => {
  it('ha de renderitzar les cartes del lore correctament', () => {
    render(<HeroCards />);
    
    expect(screen.getByText("Gemini")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Kernel Panic")).toBeInTheDocument();
  });
});
