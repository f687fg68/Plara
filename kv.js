(function(){
  const $ = (id)=>document.getElementById(id);
  const logEl = $('kvLog');
  const log = (...args)=>{
    const line = document.createElement('div');
    line.textContent = args.map(a => typeof a==='string' ? a : JSON.stringify(a,null,2)).join(' ');
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  };
  const clearLog=()=>{ logEl.innerHTML=''; };
  const ensurePuter = ()=>{
    if (!(window.puter && puter.kv)) {
      log('Error: Puter.js KV is not available. Check https://js.puter.com/v2/.');
      throw new Error('Puter KV not available');
    }
  };

  // Tabs
  Array.from(document.querySelectorAll('.kv-tab')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.kv-tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.kv-section').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      const sec = document.getElementById('sec-'+btn.dataset.section);
      if (sec) sec.classList.add('active');
    });
  });
  $('btnClearLog').addEventListener('click', clearLog);

  $('btnShowLimits').addEventListener('click', ()=>{
    try { ensurePuter();
      const maxK = puter.kv.MAX_KEY_SIZE;
      const maxV = puter.kv.MAX_VALUE_SIZE;
      log('MAX_KEY_SIZE:', maxK, 'MAX_VALUE_SIZE:', maxV);
    } catch(e){ log('limits ERROR:', e.message||e); }
  });

  // Set
  $('run-set').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('set-key').value || 'name';
      let valueInput = $('set-value').value || 'Puter Smith';
      const expAt = $('set-expireAt').value ? Number($('set-expireAt').value) : undefined;
      // Parse JSON if looks like object/array/number/boolean
      try {
        if (/^\s*[{\[]/.test(valueInput) || /^(true|false|null|[-]?\d+(\.\d+)?)$/.test(valueInput)) {
          valueInput = JSON.parse(valueInput);
        }
      } catch {}
      const ok = await puter.kv.set(key, valueInput, expAt);
      log('set OK:', ok);
    } catch(e){ log('set ERROR:', e.message||e); }
  });

  // Get
  $('run-get').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('get-key').value || 'name';
      const val = await puter.kv.get(key);
      log('get OK:', {key, value: val});
    } catch(e){ log('get ERROR:', e.message||e); }
  });

  // Incr
  $('run-incr').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('incr-key').value || 'counter';
      const amountRaw = $('incr-amount').value;
      const path = $('incr-path').value.trim();
      let result;
      if (path) {
        const obj = {}; obj[path] = amountRaw ? Number(amountRaw) : 1;
        result = await puter.kv.incr(key, obj);
      } else {
        const amt = amountRaw ? Number(amountRaw) : undefined;
        result = await puter.kv.incr(key, amt);
      }
      log('incr OK:', result);
    } catch(e){ log('incr ERROR:', e.message||e); }
  });

  // Decr
  $('run-decr').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('decr-key').value || 'counter';
      const amountRaw = $('decr-amount').value;
      const path = $('decr-path').value.trim();
      let result;
      if (path) {
        const obj = {}; obj[path] = amountRaw ? Number(amountRaw) : 1;
        result = await puter.kv.decr(key, obj);
      } else {
        const amt = amountRaw ? Number(amountRaw) : undefined;
        result = await puter.kv.decr(key, amt);
      }
      log('decr OK:', result);
    } catch(e){ log('decr ERROR:', e.message||e); }
  });

  // Del
  $('run-del').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('del-key').value || 'name';
      const ok = await puter.kv.del(key);
      log('del OK:', ok);
    } catch(e){ log('del ERROR:', e.message||e); }
  });

  // List
  $('run-list').addEventListener('click', async ()=>{
    try { ensurePuter();
      const pattern = $('list-pattern').value || undefined;
      const retVals = $('list-returnValues').checked;
      const res = pattern === undefined
        ? await puter.kv.list(retVals)
        : await puter.kv.list(pattern, retVals);
      log('list OK:', res);
    } catch(e){ log('list ERROR:', e.message||e); }
  });

  // Flush
  $('run-flush').addEventListener('click', async ()=>{
    try { ensurePuter();
      const ok = await puter.kv.flush();
      log('flush OK:', ok);
    } catch(e){ log('flush ERROR:', e.message||e); }
  });

  // Expire
  $('run-expire').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('expire-key').value || 'name';
      const ttl = Number($('expire-ttl').value || 5);
      const ok = await puter.kv.expire(key, ttl);
      log('expire OK:', ok);
    } catch(e){ log('expire ERROR:', e.message||e); }
  });

  // ExpireAt
  $('run-expireAt').addEventListener('click', async ()=>{
    try { ensurePuter();
      const key = $('expireAt-key').value || 'name';
      const ts = Number($('expireAt-ts').value || (Date.now()/1000 + 10));
      const ok = await puter.kv.expireAt(key, ts);
      log('expireAt OK:', ok);
    } catch(e){ log('expireAt ERROR:', e.message||e); }
  });
})();