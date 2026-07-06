import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authFetch, getUser } from "@/services/authService";
import VoiceTicketInput from "./VoiceTicketInput";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Email",
  "Access",
  "Other",
];

function useLookups() {
  return useQuery({
    queryKey: ["lookups"],
    queryFn: async () => {
      const [catRes, priRes, statRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/lookup/categories`),
        authFetch(`${API_BASE_URL}/lookup/priorities`),
        authFetch(`${API_BASE_URL}/lookup/statuses`),
      ]);
      return {
        categories: await catRes.json(),
        priorities: await priRes.json(),
        statuses: await statRes.json(),
      };
    },
    staleTime: 5 * 60_000,
  });
}

function useManagers() {
  return useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/users/managers`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export default function CreateTicketForm({ onClose, onCreated }) {
  const currentUser = getUser();
  const queryClient = useQueryClient();

  const { data: lookups, isLoading: lookupsLoading } = useLookups();
  const { data: managers = [] } = useManagers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "Hardware",
      priority: "Medium",
      managerId: "",
    },
  });

  const handleAiParsed = (parsed) => {
    setValue("title", parsed.title);
    setValue("description", parsed.description);
    if (parsed.category) setValue("category", parsed.category);
    if (parsed.priority) setValue("priority", parsed.priority);
    if (parsed.managerId) setValue("managerId", String(parsed.managerId));
  };

  const category = watch("category");
  const priority = watch("priority");
  const managerId = watch("managerId");

  const createTicket = useMutation({
    mutationFn: async (formValues) => {
      const categoryId = lookups.categories.find(
        (c) => c.name.toLowerCase() === formValues.category.toLowerCase(),
      )?.id;
      const priorityId = lookups.priorities.find(
        (p) => p.name.toLowerCase() === formValues.priority.toLowerCase(),
      )?.id;
      const statusId = lookups.statuses.find(
        (s) => s.name.toLowerCase() === "open",
      )?.id;

      if (!categoryId || !priorityId || !statusId) {
        throw new Error("Could not resolve category, priority, or status.");
      }

      const res = await authFetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        body: JSON.stringify({
          title: formValues.title,
          description: formValues.description,
          categoryId,
          priorityId,
          statusId,
          submittedById: currentUser?.id,
          assignedToId: formValues.managerId
            ? parseInt(formValues.managerId)
            : null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || "Failed to create ticket.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Ticket created successfully.");
      onCreated();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (values) => createTicket.mutate(values);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>

        <VoiceTicketInput onParsed={handleAiParsed} managers={managers} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...register("title", {
                required: "Title is required.",
                maxLength: {
                  value: 150,
                  message: "Title must be under 150 characters.",
                },
              })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Provide detailed information about the issue"
              {...register("description", {
                required: "Description is required.",
                minLength: {
                  value: 10,
                  message: "Please provide at least 10 characters.",
                },
              })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue("priority", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Ticket Manager{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Select
              value={managerId}
              onValueChange={(v) => setValue("managerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending || lookupsLoading}
            >
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
