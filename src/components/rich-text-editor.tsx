'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  CheckSquare,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input rounded-md p-1 flex flex-wrap gap-1 sticky top-0 bg-background z-10">
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="font-bold text-xs">H2</span>
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="font-bold text-xs">H3</span>
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('taskList')}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
    </div>
  );
};


interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    isEditable?: boolean;
}

export default function RichTextEditor({ value, onChange, isEditable = true }: RichTextEditorProps) {
  const isInternalChange = useRef(false);
  
  let initialContent: any = '';
  try {
    if (value && typeof value === 'string' && value.startsWith('{')) {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && parsed.type === 'doc') {
        initialContent = parsed;
      }
    } else {
        initialContent = value || '';
    }
  } catch (error) {
    initialContent = value || '';
  }
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      onChange(JSON.stringify(editor.getJSON()));
      setTimeout(() => {
        isInternalChange.current = false;
      }, 0);
    },
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg min-h-[250px] max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        }
    }
  });

  // Reactive update when 'value' prop changes externally (e.g., from AI generation)
  useEffect(() => {
    if (!editor || value === undefined || isInternalChange.current) return;

    const currentJSON = JSON.stringify(editor.getJSON());
    
    if (value !== currentJSON) {
      try {
        if (value && value.startsWith('{')) {
          const parsed = JSON.parse(value);
          editor.commands.setContent(parsed, false); // false to not trigger onUpdate
        } else {
          editor.commands.setContent(value || '', false);
        }
      } catch (e) {
        editor.commands.setContent(value || '', false);
      }
    }
  }, [value, editor]);

  return (
    <div className="space-y-2">
      {isEditable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
