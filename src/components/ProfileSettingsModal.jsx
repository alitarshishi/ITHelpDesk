import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { authFetch, getUser } from "@/services/authService";
import { updateStoredUser } from "@/services/authService";
import ReloginRequiredDialog from "@/components/ReloginRequiredDialog";
import {
  useMyProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useRemoveAvatar,
} from "@/hooks/useProfile";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function ProfileSettingsModal({ onClose }) {
  const { data: profile, isLoading } = useMyProfile();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!profile?.hasAvatar) {
      setAvatarUrl(null);
      return;
    }
    let objectUrl;
    (async () => {
      const res = await authFetch(`${API_BASE_URL}/profile/avatar`);
      if (!res.ok) return;
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      setAvatarUrl(objectUrl);
    })();
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [profile?.hasAvatar]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        {profile && (
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileTab profile={profile} />
            </TabsContent>

            <TabsContent value="password">
              <PasswordTab />
            </TabsContent>

            <TabsContent value="photo">
              <PhotoTab
                profile={profile}
                avatarUrl={avatarUrl}
                fileInputRef={fileInputRef}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Profile info tab ──
function ProfileTab({ profile }) {
  const updateProfile = useUpdateProfile();
  const [showRelogin, setShowRelogin] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { userName: profile.userName, email: profile.email },
  });

  const onSubmit = (values) => {
    const emailChanged = values.email !== profile.email;

    updateProfile.mutate(values, {
      onSuccess: () => {
        if (emailChanged) {
          // email is part of the login credential — force a clean session
          setShowRelogin(true);
        } else {
          // username-only change — reflect it everywhere immediately, no reload
          updateStoredUser({ userName: values.userName });
          toast.success("Profile updated.");
        }
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="userName">Username</Label>
          <Input
            id="userName"
            {...register("userName", {
              required: "Username is required.",
              minLength: {
                value: 3,
                message: "Must be at least 3 characters.",
              },
            })}
          />
          {errors.userName && (
            <p className="text-sm text-destructive">
              {errors.userName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address.",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
      <ReloginRequiredDialog open={showRelogin} reason="email address" />
    </>
  );
}

// ── Password tab ──
function PasswordTab() {
  const [showRelogin, setShowRelogin] = useState(false);
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = (values) => {
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password changed.");
          reset();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            {...register("currentPassword", { required: "Required." })}
          />
          {errors.currentPassword && (
            <p className="text-sm text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword", {
              required: "Required.",
              minLength: {
                value: 8,
                message: "Must be at least 8 characters.",
              },
            })}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your password.",
              validate: (v) => v === newPassword || "Passwords do not match.",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </form>
      <ReloginRequiredDialog open={showRelogin} reason="password" />
    </>
  );
}

// ── Photo tab ──
function PhotoTab({ profile, avatarUrl, fileInputRef }) {
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const currentUser = getUser();

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success("Photo updated."),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleRemove = () => {
    removeAvatar.mutate(undefined, {
      onSuccess: () => toast.success("Photo removed."),
      onError: () => toast.error("Failed to remove photo."),
    });
  };

  const busy = uploadAvatar.isPending || removeAvatar.isPending;

  return (
    <div className="flex flex-col items-center gap-4 pt-6 pb-2">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl} alt={profile.userName} />
        <AvatarFallback className="text-2xl">
          {(currentUser?.userName || profile.userName || "?")[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {uploadAvatar.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="mr-1.5 h-3.5 w-3.5" />
          )}
          {uploadAvatar.isPending ? "Uploading..." : "Upload Photo"}
        </Button>
        {profile.hasAvatar && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={handleRemove}
            disabled={busy}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        PNG, JPEG, GIF, or WEBP. Max 3 MB.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}
