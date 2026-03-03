import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import { ICard } from '@/core/entities/ICard';

describe('Componente UI: Card', () => {
  const mockCard: ICard = {
    id: 'test-card-1',
    name: 'Gemini 1.5 Pro',
    description: 'Modelo de Google',
    type: 'ENTITY',
    faction: 'BIG_TECH',
    cost: 7,
    attack: 2500,
    defense: 2000,
    archetype: "LLM",
  };

  it('debería renderizar la información de la carta correctamente', () => {
    // Arrange & Act
    render(<Card card={mockCard} />);

    // Assert
    expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
    expect(screen.getByText('Modelo de Google')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // Coste
    expect(screen.getByText('2500')).toBeInTheDocument(); // Ataque
    expect(screen.getByText('2000')).toBeInTheDocument(); // Defensa
    expect(screen.getByText('ENTITY · LLM')).toBeInTheDocument(); // Tipo + arquetipo
  });

  it('debería ejecutar la función onClick al ser clickeada pasando la carta como argumento', () => {
    // Arrange
    const handleClick = vi.fn(); // Mock function de Vitest
    render(<Card card={mockCard} onClick={handleClick} />);

    // Act
    const cardElement = screen.getByText('Gemini 1.5 Pro').closest('div');
    if (cardElement) {
      fireEvent.click(cardElement);
    }

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockCard);
  });
});
