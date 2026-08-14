import { useState } from "react";
import { X as XIcon } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * Shared tag chip-input used wherever tags are edited (Add Node dialog, the
 * Edit Tags side panel, …). Add a tag with Enter or comma; remove one with its
 * × or Backspace when the field is empty. Controlled via value/onChange.
 */
export const TagInput = ({ value, onChange, placeholder }: TagInputProps) => {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "").trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="min-h-11 rounded-md border border-input bg-background px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring focus-within:border-transparent">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary text-xs px-2 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:bg-primary/20 rounded p-0.5"
            aria-label={`Remove ${tag}`}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) addTag(v.slice(0, -1));
          else setInput(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
          } else if (e.key === "Backspace" && !input && value.length) {
            removeTag(value[value.length - 1]);
          }
        }}
        onBlur={() => input && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
      />
    </div>
  );
};

export default TagInput;
