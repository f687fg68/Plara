(function(){
  const $ = (id)=>document.getElementById(id);
  const logEl = $('fsLog');
  const log = (...args)=>{
    const line = document.createElement('div');
    line.textContent = args.map(a=>
      typeof a==='string'? a : JSON.stringify(a,null,2)
    ).join(' ');
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  };
  const clearLog=()=>{ logEl.innerHTML=''; };
  const randName = ()=> (window.puter?.randName ? puter.randName() : ('file_'+Date.now()+Math.random().toString(16).slice(2)));

  // Tabs
  Array.from(document.querySelectorAll('.fs-tab')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.fs-tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.fs-section').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      const sec = document.getElementById('sec-'+btn.dataset.section);
      if (sec) sec.classList.add('active');
    });
  });
  $('btnClearLog').addEventListener('click', clearLog);

  function ensurePuter(){
    if (!(window.puter && puter.fs)) {
      log('Error: Puter.js is not available. Make sure https://js.puter.com/v2/ is allowed.');
      throw new Error('Puter not available');
    }
  }

  // Write
  $('run-write').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('w-path').value || 'hello.txt';
      const data = $('w-data').value || 'Hello, world!';
      const options = {
        overwrite: $('w-overwrite').checked,
        dedupeName: $('w-dedupe').checked,
        createMissingParents: $('w-create').checked
      };
      const item = await puter.fs.write(path, data, options);
      log('write OK:', item);
    } catch(e){ log('write ERROR:', e.message||e); }
  });
  $('run-write-random').addEventListener('click', async ()=>{
    try { ensurePuter();
      const filename = randName()+'.txt';
      const item = await puter.fs.write(filename, 'Random '+Date.now());
      log('write random OK:', item);
    } catch(e){ log('write random ERROR:', e.message||e); }
  });

  // Read
  $('run-read').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('r-path').value || 'hello.txt';
      const blob = await puter.fs.read(path);
      const text = await blob.text();
      log('read OK:', {path, text});
    } catch(e){ log('read ERROR:', e.message||e); }
  });

  // Mkdir
  $('run-mkdir').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('mk-path').value || randName();
      const options = {
        overwrite: $('mk-overwrite').checked,
        dedupeName: $('mk-dedupe').checked,
        createMissingParents: $('mk-create').checked
      };
      const dir = await puter.fs.mkdir(path, options);
      log('mkdir OK:', dir);
    } catch(e){ log('mkdir ERROR:', e.message||e); }
  });

  // Readdir
  $('run-readdir').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('rd-path').value || './';
      const items = await puter.fs.readdir(path);
      log('readdir OK:', items.map(i=>({name:i.name,path:i.path,size:i.size})));
    } catch(e){ log('readdir ERROR:', e.message||e); }
  });

  // Rename
  $('run-rename').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('rn-path').value || 'hello.txt';
      const newName = $('rn-new').value || 'hello-world.txt';
      const res = await puter.fs.rename(path, newName);
      log('rename OK:', res);
    } catch(e){ log('rename ERROR:', e.message||e); }
  });

  // Copy
  $('run-copy').addEventListener('click', async ()=>{
    try { ensurePuter();
      const src = $('cp-src').value || 'hello.txt';
      const dst = $('cp-dst').value || (randName());
      const options = {
        overwrite: $('cp-overwrite').checked,
        dedupeName: $('cp-dedupe').checked,
        newName: $('cp-newname').value || undefined
      };
      const res = await puter.fs.copy(src, dst, options);
      log('copy OK:', res);
    } catch(e){ log('copy ERROR:', e.message||e); }
  });

  // Move
  $('run-move').addEventListener('click', async ()=>{
    try { ensurePuter();
      const src = $('mv-src').value || 'hello.txt';
      const dst = $('mv-dst').value || (randName()+'/'+src);
      const options = {
        overwrite: $('mv-overwrite').checked,
        createMissingParents: $('mv-create').checked
      };
      await puter.fs.move(src, dst, options);
      log('move OK:', {src,dst});
    } catch(e){ log('move ERROR:', e.message||e); }
  });

  // Stat
  $('run-stat').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('st-path').value || 'hello.txt';
      const info = await puter.fs.stat(path);
      log('stat OK:', info);
    } catch(e){ log('stat ERROR:', e.message||e); }
  });

  // Delete
  $('run-delete').addEventListener('click', async ()=>{
    try { ensurePuter();
      const raw = $('dl-paths').value || 'hello.txt';
      const paths = raw.includes(',') ? raw.split(',').map(s=>s.trim()) : raw;
      const options = {
        recursive: $('dl-recursive').checked,
        descendantsOnly: $('dl-descendants').checked
      };
      await puter.fs.delete(paths, options);
      log('delete OK:', {paths});
    } catch(e){ log('delete ERROR:', e.message||e); }
  });

  // GetReadURL
  $('run-getreadurl').addEventListener('click', async ()=>{
    try { ensurePuter();
      const path = $('gr-path').value || 'hello.txt';
      const exp = $('gr-exp').value ? Number($('gr-exp').value) : undefined;
      const url = await puter.fs.getReadURL(path, exp);
      log('getReadURL OK:', url);
      // Provide a clickable link preview
      const a = document.createElement('a'); a.href=url; a.target='_blank'; a.textContent='Open '+path;
      logEl.appendChild(a); logEl.appendChild(document.createElement('br'));
    } catch(e){ log('getReadURL ERROR:', e.message||e); }
  });

  // Upload
  $('run-upload').addEventListener('click', async ()=>{
    try { ensurePuter();
      const input = $('up-input');
      if (!input.files || input.files.length===0) { log('Select files first.'); return; }
      const dir = $('up-dir').value || undefined;
      const options = {
        overwrite: $('up-overwrite').checked,
        dedupeName: $('up-dedupe').checked,
        createMissingParents: $('up-create').checked
      };
      const res = await puter.fs.upload(input.files, dir, options);
      log('upload OK:', res);
    } catch(e){ log('upload ERROR:', e.message||e); }
  });
})();