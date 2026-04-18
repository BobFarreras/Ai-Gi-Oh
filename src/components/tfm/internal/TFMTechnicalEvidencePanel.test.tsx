// src/components/tfm/internal/TFMTechnicalEvidencePanel.test.tsx - Verifica render de los pilares técnicos de la presentación TFM.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TFMTechnicalEvidencePanel } from "@/components/tfm/internal/TFMTechnicalEvidencePanel";

describe("TFMTechnicalEvidencePanel", () => {
  it("renderiza arquitectura, Engram, seguridad y calidad", () => {
    render(<TFMTechnicalEvidencePanel />);

    expect(screen.getByText("Arquitectura Clean + Repository Pattern")).toBeInTheDocument();
    expect(screen.getByText("Memoria persistente con Engram")).toBeInTheDocument();
    expect(screen.getByText("Seguridad aplicada en APIs")).toBeInTheDocument();
    expect(screen.getByText("Calidad: TDD, SOLID y quality gates")).toBeInTheDocument();
  });
});
