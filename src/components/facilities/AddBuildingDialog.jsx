import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AddBuildingDialog({ open, onOpenChange, onSaved }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${baseUrl}/facilities/buildings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create building");

      const result = await response.json();

      toast.success("Building created successfully");
      reset();
      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create building");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Building</DialogTitle>
          <DialogDescription>Create a new building structure in the campus.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Building Name</label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Science Block"
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input
                {...register("code", { required: "Code is required" })}
                placeholder="e.g. SCB"
              />
              {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Floors</label>
              <Input
                type="number"
                {...register("floors", { required: true, min: 1 })}
                placeholder="4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Campus Location</label>
            <Input {...register("campus_location")} placeholder="e.g. North Campus" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Building
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
