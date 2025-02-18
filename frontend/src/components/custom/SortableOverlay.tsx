import { DragOverlay } from "@dnd-kit/core";
import type { PropsWithChildren } from "react";

type Props = {};

export function SortableOverlay({ children }: PropsWithChildren<Props>) {
  return (
    <DragOverlay
      dropAnimation={{
        duration: 150,
        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        sideEffects: ({ active, dragOverlay }) => {
          return () => {
            if (active.node) {
              active.node.style.opacity = "0.4";
              active.node.style.transition = "opacity 250ms ease";
            }

            if (dragOverlay.node) {
              dragOverlay.node.style.opacity = "1";
              dragOverlay.node.style.transition = [
                "transform 250ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                "opacity 250ms ease",
              ].join(", ");
            }
          };
        },
      }}
    >
      <div className="bg-white rounded-lg shadow-lg cursor-grabbing">
        {children}
      </div>
    </DragOverlay>
  );
}
