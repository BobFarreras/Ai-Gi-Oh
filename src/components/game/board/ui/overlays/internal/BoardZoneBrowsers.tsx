// src/components/game/board/ui/overlays/internal/BoardZoneBrowsers.tsx - Agrupa visores de cementerio y zona destruida del tablero.
"use client";

import { ICard } from "@/core/entities/ICard";
import { GraveyardBrowser } from "../../GraveyardBrowser";

interface IBoardZoneBrowsersProps {
  graveyardView: "player" | "opponent" | null;
  graveyardOwnerName: string;
  graveyardCards: ICard[];
  graveyardSelectableCardRefs: string[];
  fusionDeckView: "player" | "opponent" | null;
  fusionDeckOwnerName: string;
  fusionDeckCards: ICard[];
  destroyedView: "player" | "opponent" | null;
  destroyedOwnerName: string;
  destroyedCards: ICard[];
  onCloseGraveyard: () => void;
  onCloseFusionDeck: () => void;
  onCloseDestroyed: () => void;
  onPreviewCard: (card: ICard) => void;
}

export function BoardZoneBrowsers({
  graveyardView,
  graveyardOwnerName,
  graveyardCards,
  graveyardSelectableCardRefs,
  fusionDeckView,
  fusionDeckOwnerName,
  fusionDeckCards,
  destroyedView,
  destroyedOwnerName,
  destroyedCards,
  onCloseGraveyard,
  onCloseFusionDeck,
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
        isOpen={fusionDeckView !== null}
        ownerName={fusionDeckOwnerName}
        title="Deck de Fusión"
        emptyMessage="No hay cartas en este deck de fusión."
        cards={fusionDeckCards}
        onClose={onCloseFusionDeck}
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

