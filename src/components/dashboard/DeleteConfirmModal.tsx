import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { DeleteConfirmState } from "../../types";
import { MoveableResizableFrame } from "../ui/MoveableResizableFrame";

interface DeleteConfirmModalProps {
  confirmState: DeleteConfirmState | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  confirmState,
  onCancel,
  onConfirm,
}) => {
  if (!confirmState) return null;

  return (
    <MoveableResizableFrame
      isOpen={Boolean(confirmState)}
      onClose={onCancel}
      title="Confirm Delete"
      subtitle="Are you sure you want to delete this item?"
      icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
      initialWidth={440}
      initialHeight={260}
      minWidth={320}
      minHeight={200}
      ariaLabel="Confirm Delete"
    >
      <div className="space-y-5">
        <p className="text-sm text-indigo-200">{confirmState.message}</p>
        <div className="flex justify-end gap-3 pt-3 border-t border-indigo-800/60">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </MoveableResizableFrame>
  );
};

