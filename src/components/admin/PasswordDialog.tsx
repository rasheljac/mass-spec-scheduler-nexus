
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  isSubmitting?: boolean;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  newPassword,
  setNewPassword,
  isSubmitting = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Password"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDialog;
