import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface EditableInputProps {
  initialValue: string;
  initialDescription: string;
  onSave: (value: string, description: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const EditableInput = ({
  initialValue,
  initialDescription,
  onSave,
  onCancel,
  isOpen,
}: EditableInputProps) => {
  const [value, setValue] = useState(initialValue);
  const [description, setDescription] = useState(initialDescription);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(value, description);
  };

  return (
    <div
      className={cn(
        "bg-background border rounded-lg shadow-sm",
        !isOpen && "hidden"
      )}
    >
      <div className="p-4 gap-2 flex flex-col">
        <Input
          ref={inputRef}
          value={value}
          placeholder="Add a todo"
          onChange={(e) => setValue(e.target.value)}
          className="resize-none"
        />
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="flex items-center justify-end border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
