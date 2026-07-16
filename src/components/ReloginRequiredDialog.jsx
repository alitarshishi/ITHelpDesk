import { useNavigate } from "react-router-dom";
import { logout } from "@/services/authService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Non-dismissible: shown after a change that revoked the current JWT
// (email or password). The user must log back in to continue.
export default function ReloginRequiredDialog({ open, reason }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Please log in again</AlertDialogTitle>
          <AlertDialogDescription>
            Your {reason} was just changed, so your current session has been
            ended for security. Please sign in again to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogout}>
            Log In Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
