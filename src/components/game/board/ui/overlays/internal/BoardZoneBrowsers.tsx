// src/components/game/board/ui/overlays/internal/BoardZoneBrowsers.tsx - Agrupa visores de cementerio y zona destruida del tablero.
"use client";

import { ICard } from "@/core/entities/ICard";
import { GraveyardBrowser } from "../../GraveyardBrowser";

interface IBoardZoneBrowsersProps {
  graveyardView: "player" | "opponent" | null;
  graveyardOwnerName: string;
  graveyardCards: ICard[];
  graveyardSelectableCardRefs: string[];
  destroyedView: "player" | "opponent" | null;
  destroyedOwnerName: string;
  destroyedCards: ICard[];
  onCloseGraveyard: () => void;
  onCloseDestroyed: () => void;
  onPreviewCard: (card: ICard) => void;
}

export function BoardZoneBrowsers({
  graveyardView,
  graveyardOwnerName,
  graveyardCards,
  graveyardSelectableCardRefs,
  destroyedView,
  destroyedOwnerName,
  destroyedCards,
  onCloseGraveyard,
  onCloseDestroyed,
  onPreviewCard,
}: IBoardZoneBrowsersProps) {
  return (
    <>
      <GraveyardBrowser
        isOpen={graveyardView !== null}
        ownerName={graveyardOwnerName}
        title="Cementerio"
        emptyMessage="No hay cartas en este cementerio."
        cards={graveyardCards}
        selectableCardRefs={graveyardSelectableCardRefs}
        onClose={onCloseGraveyard}
        onSelectCard={onPreviewCard}
      />
      <GraveyardBrowser
        isOpen={destroyedView !== null}
        ownerName={destroyedOwnerName}
        title="Zona Destruida"
        emptyMessage="No hay cartas destruidas."
        cards={destroyedCards}
        onClose={onCloseDestroyed}
        onSelectCard={onPreviewCard}
      />
    </>
  );
}

