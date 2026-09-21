import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { DeleteConfirmState } from "../../types";

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-sm w-full shadow-lg">
        <CardHeader>
          <CardTitle>Confirm Delete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-indigo-300 mb-6">{confirmState.message}</p>
          <div className="flex justify-end gap-3">
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
        </CardContent>
      </Card>
    </div>
  );
};
