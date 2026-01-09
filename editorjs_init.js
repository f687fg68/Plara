// ESM setup for Editor.js using Vite
import EditorJS from '@editorjs/editorjs';
import Paragraph from '@editorjs/paragraph';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import InlineCode from '@editorjs/inline-code';
import CodeTool from '@editorjs/code';
import Table from '@editorjs/table';
import Marker from '@editorjs/marker';
import Embed from '@editorjs/embed';
import SimpleImage from '@editorjs/simple-image';

function initEditorJS_ESM() {
  const holder = document.getElementById('editorjs');
  const saveBtn = document.getElementById('ejSaveBtn');
  if (!holder) return;

  const tools = {
    paragraph: {
      class: Paragraph,
      inlineToolbar: true,
      config: { placeholder: 'Start typing…' }
    },
    header: { class: Header, inlineToolbar: ['link'], config: { placeholder: 'Enter a header' } },
    list: { class: List, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
    quote: { class: Quote, inlineToolbar: true },
    delimiter: Delimiter,
    inlineCode: InlineCode,
    code: CodeTool,
    table: Table,
    marker: Marker,
    embed: { class: Embed, inlineToolbar: true, config: { services: { youtube: true, vimeo: true, codepen: true } } },
    image: { class: SimpleImage }
  };

  const editor = new EditorJS({
    holder: 'editorjs',
    autofocus: false,
    placeholder: 'Write something with Editor.js…',
    tools,
    inlineToolbar: ['link','marker','bold','italic'],
    defaultBlock: 'paragraph',
    onReady: () => {
      // eslint-disable-next-line no-console
      console.log('Editor.js (ESM) ready');
    },
    onChange: () => {}
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      try {
        const data = await editor.save();
        // eslint-disable-next-line no-console
        console.log('Editor.js output:', data);
        const out = document.getElementById('ejOutput');
        if (out) out.textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Editor.js save failed', e);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditorJS_ESM);
} else {
  initEditorJS_ESM();
}
