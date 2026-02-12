
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function RichTextRenderer({ content }: { content: any }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable: false,
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none'
        }
    }
  });

  return (
    <EditorContent editor={editor} />
  );
}
