"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/* --- pojedynczy przycisk paska formatowania --- */
function TBtn({
  active,
  onClick,
  label,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 min-w-[28px] items-center justify-center rounded-[8px] px-1.5 font-mono text-sm leading-none text-ink transition-colors",
        active ? "bg-ink text-paper" : "hover:bg-ink/[0.06]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-hairline px-2 py-1.5">
      <TBtn
        label="Nagłówek 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </TBtn>
      <TBtn
        label="Nagłówek 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </TBtn>
      <span className="mx-1 select-none text-hairline" aria-hidden="true">
        |
      </span>
      <TBtn
        label="Pogrubienie"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="font-bold"
      >
        B
      </TBtn>
      <TBtn
        label="Kursywa"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="italic"
      >
        I
      </TBtn>
      <span className="mx-1 select-none text-hairline" aria-hidden="true">
        |
      </span>
      <TBtn
        label="Lista punktowana"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </TBtn>
      <TBtn
        label="Lista numerowana"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </TBtn>
    </div>
  );
}

/** Edytor notatek oparty na TipTap (rich-text z formatowaniem Markdown).
    Zapisuje HTML. Styl: pasek formatowania + wykropkowane tło, bez ramki. */
export function NoteEditor({
  value,
  onChange,
  placeholder = "Napisz notatkę…",
  ariaLabel,
  className,
}: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap",
        "aria-label": ariaLabel ?? placeholder,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
  });

  // synchronizacja, gdy wartość zmieni się z zewnątrz (np. wczytanie danych)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[var(--r-box)] text-[14px] text-ink",
        "focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]",
        className,
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <div className="dotted relative px-3.5 py-3 [&_.tiptap]:min-h-[84px]">
        {editor && editor.isEmpty && (
          <span className="pointer-events-none absolute left-3.5 top-3 text-ink-faint">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
