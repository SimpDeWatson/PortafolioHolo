/* =========================================
   files.js — Archivos por semana
   - Subida/eliminación: solo usuario logueado → GitHub (carpeta pages/SemanaN/)
   - Visualización: todos (lista desde GitHub + respaldo IndexedDB)
   ========================================= */

const GH_OWNER = 'SimpDeWatson';
const GH_REPO = 'PortafolioHolo';
const GH_BRANCH = 'main';
const GH_TOKEN_KEY = 'holofolio_gh_token';

/* ============================================================
   TOKEN DE GITHUB (opcional)
   Pega aquí tu Personal Access Token para no ver el botón/prompt.
   Ejemplo: const GH_TOKEN_EMBEDDED = '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';
   ⚠️ No subas este archivo a un repo PÚBLICO con el token puesto.
   Usa un token fine-grained solo para PortafolioHolo (Contents: write).
   ============================================================ */
const GH_TOKEN_EMBEDDED = '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';

const FILES_DB_NAME = 'holofolio_files_db';
const FILES_STORE = 'weekFiles';
const FILES_DB_VER = 1;
const MAX_BYTES = 100 * 1024 * 1024;

function filesIsUser() {
  return localStorage.getItem('portfolio_auth') === 'user';
}

function getGhToken() {
  const embedded = (typeof GH_TOKEN_EMBEDDED === 'string' && GH_TOKEN_EMBEDDED.trim()) || '';
  if (embedded) return embedded;
  return (localStorage.getItem(GH_TOKEN_KEY) || '').trim();
}

function setGhToken(token) {
  if (token) localStorage.setItem(GH_TOKEN_KEY, token.trim());
  else localStorage.removeItem(GH_TOKEN_KEY);
}

function getWeekKeyFromPage() {
  const el = document.getElementById('week-files-root');
  if (el && el.dataset.week) return el.dataset.week;
  const m = location.pathname.match(/semana(\d+)/i);
  return m ? `semana${m[1]}` : 'semana0';
}

function weekFolderName(weekKey) {
  // semana1 → Semana1
  const m = String(weekKey).match(/(\d+)/);
  return m ? `Semana${m[1]}` : 'Semana0';
}

function ghPathFor(weekKey, fileName) {
  return `pages/${weekFolderName(weekKey)}/${fileName}`;
}

function rawUrl(path) {
  return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/* ---------- IndexedDB (respaldo local) ---------- */
function openFilesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FILES_DB_NAME, FILES_DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FILES_STORE)) db.createObjectStore(FILES_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getLocalFiles(weekKey) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readonly');
    const req = tx.objectStore(FILES_STORE).get(weekKey);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function setLocalFiles(weekKey, list) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const req = tx.objectStore(FILES_STORE).put(list, weekKey);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function fileToRecord(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: reader.result,
        addedAt: new Date().toISOString(),
        source: 'local'
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/* ---------- GitHub API ---------- */
async function ghFetch(path, options = {}) {
  const token = getGhToken();
  if (!token) throw new Error('NO_TOKEN');
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {})
  };
  const res = await fetch(`https://api.github.com${path}`, { ...options, headers });
  return res;
}

async function listGithubWeekFiles(weekKey) {
  const folder = `pages/${weekFolderName(weekKey)}`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${folder}?ref=${GH_BRANCH}`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item.type === 'file' && item.name.toLowerCase() !== 'readme.txt')
      .map(item => ({
        id: `gh_${item.sha}`,
        name: item.name,
        type: guessType(item.name),
        size: item.size || 0,
        sha: item.sha,
        path: item.path,
        url: item.download_url || rawUrl(item.path),
        source: 'github'
      }));
  } catch (e) {
    console.warn('GitHub list failed', e);
    return [];
  }
}

function guessType(name) {
  const n = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n)) return 'image/' + n.split('.').pop().replace('jpg', 'jpeg');
  if (/\.pdf$/.test(n)) return 'application/pdf';
  return 'application/octet-stream';
}

async function uploadToGithub(weekKey, fileName, arrayBuffer, message) {
  const path = ghPathFor(weekKey, fileName);
  const content = arrayBufferToBase64(arrayBuffer);
  // check if exists to get sha
  let sha;
  const getRes = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`);
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }
  const body = {
    message: message || `Add ${fileName} to ${weekFolderName(weekKey)}`,
    content,
    branch: GH_BRANCH
  };
  if (sha) body.sha = sha;
  const res = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub upload failed (${res.status})`);
  }
  return res.json();
}

async function deleteFromGithub(path, sha, message) {
  const res = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `Delete ${path}`,
      sha,
      branch: GH_BRANCH
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub delete failed (${res.status})`);
  }
}

/* ---------- UI helpers ---------- */
function isImageType(type, name) {
  if (type && type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '');
}
function isPdfType(type, name) {
  if (type === 'application/pdf') return true;
  return /\.pdf$/i.test(name || '');
}
function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createObjectUrl(record) {
  const blob = new Blob([record.data], { type: record.type || 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

function showStatus(msg, isError) {
  const el = document.getElementById('files-status');
  if (!el) return;
  el.textContent = msg || '';
  el.style.color = isError ? '#ff8a8a' : '#2dd4bf';
  el.style.display = msg ? 'block' : 'none';
}

/* ---------- Actions ---------- */
async function handleFilesSelected(fileList) {
  if (!filesIsUser()) {
    alert('Solo los usuarios con sesión pueden subir archivos.');
    return;
  }
  if (!getGhToken()) {
    alert('Falta el token de GitHub.\n\nAbre js/files.js y pega tu token en GH_TOKEN_EMBEDDED, o usa el botón 🔑 Token GitHub.');
    if (!(typeof GH_TOKEN_EMBEDDED === 'string' && GH_TOKEN_EMBEDDED.trim())) {
      promptGithubToken();
    }
    return;
  }

  const files = Array.from(fileList || []);
  if (!files.length) return;

  const weekKey = getWeekKeyFromPage();
  showStatus('Subiendo a GitHub…');

  try {
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        alert(`"${f.name}" pesa más de 100 MB y se omitió.`);
        continue;
      }
      const buf = await f.arrayBuffer();
      await uploadToGithub(weekKey, f.name, buf, `Subir ${f.name} en ${weekFolderName(weekKey)}`);
      // respaldo local
      const rec = await fileToRecord(f);
      const local = await getLocalFiles(weekKey);
      local.push(rec);
      await setLocalFiles(weekKey, local);
    }
    showStatus('✅ Archivo(s) subidos a GitHub');
    setTimeout(() => showStatus(''), 2500);
    await renderWeekFiles();
  } catch (e) {
    console.error(e);
    if (String(e.message) === 'NO_TOKEN') {
      alert('Falta el token de GitHub.');
      promptGithubToken();
    } else {
      alert('Error al subir a GitHub: ' + e.message);
    }
    showStatus('Error al subir', true);
  }
}

async function deleteWeekFile(record) {
  if (!filesIsUser()) return;
  if (!confirm(`¿Eliminar "${record.name}"?`)) return;

  const weekKey = getWeekKeyFromPage();

  try {
    if (record.source === 'github' || record.sha) {
      if (!getGhToken()) {
        alert('Configura tu token de GitHub para eliminar del repositorio.');
        promptGithubToken();
        return;
      }
      showStatus('Eliminando de GitHub…');
      const path = record.path || ghPathFor(weekKey, record.name);
      let sha = record.sha;
      if (!sha) {
        const getRes = await ghFetch(`/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`);
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      }
      if (!sha) throw new Error('No se encontró el archivo en GitHub');
      await deleteFromGithub(path, sha, `Eliminar ${record.name} de ${weekFolderName(weekKey)}`);
      showStatus('✅ Eliminado de GitHub');
    }

    // quitar de local también
    let local = await getLocalFiles(weekKey);
    local = local.filter(f => f.name !== record.name && f.id !== record.id);
    await setLocalFiles(weekKey, local);

    setTimeout(() => showStatus(''), 2000);
    await renderWeekFiles();
  } catch (e) {
    console.error(e);
    alert('Error al eliminar: ' + e.message);
    showStatus('Error al eliminar', true);
  }
}

function promptGithubToken() {
  const current = getGhToken();
  const token = prompt(
    'Pega tu GitHub Personal Access Token (permiso "repo" o "contents:write").\n\nSe guarda solo en este navegador.\nDeja vacío para borrarlo.',
    current || ''
  );
  if (token === null) return;
  setGhToken(token);
  updateTokenButton();
  if (token) {
    showStatus('Token guardado');
    setTimeout(() => showStatus(''), 2000);
    renderWeekFiles();
  } else {
    showStatus('Token eliminado');
    setTimeout(() => showStatus(''), 2000);
  }
}

function updateTokenButton() {
  const btn = document.getElementById('btn-gh-token');
  if (!btn) return;
  const embedded = (typeof GH_TOKEN_EMBEDDED === 'string' && GH_TOKEN_EMBEDDED.trim()) || '';
  if (embedded) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = '';
  const has = !!getGhToken();
  btn.textContent = has ? '🔑 Token OK' : '🔑 Token GitHub';
  btn.classList.toggle('token-ok', has);
}

/* ---------- Render ---------- */
async function renderWeekFiles() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

  const weekKey = getWeekKeyFromPage();
  const isUser = filesIsUser();

  const emptyHint = root.querySelector('.files-empty-hint');
  const gallery = root.querySelector('.files-gallery');
  const uploadPanel = root.querySelector('.files-upload-panel');

  if (uploadPanel) uploadPanel.style.display = isUser ? 'block' : 'none';
  updateTokenButton();

  if (!gallery) return;
  gallery.innerHTML = '';

  // Prefer GitHub list (visible for everyone); merge local-only extras
  const ghFiles = await listGithubWeekFiles(weekKey);
  const localFiles = await getLocalFiles(weekKey);

  const byName = new Map();
  ghFiles.forEach(f => byName.set(f.name.toLowerCase(), f));
  // local files not yet on github (optional show)
  localFiles.forEach(f => {
    const k = f.name.toLowerCase();
    if (!byName.has(k)) byName.set(k, { ...f, source: 'local' });
  });

  const list = Array.from(byName.values());

  if (!list.length) {
    if (emptyHint) emptyHint.style.display = 'block';
    return;
  }
  if (emptyHint) emptyHint.style.display = 'none';

  list.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'file-card';

    const header = document.createElement('div');
    header.className = 'file-card-header';
    const badge = rec.source === 'github' ? '🌐' : '💾';
    header.innerHTML = `<span class="file-name">${badge} ${escapeHtml(rec.name)}</span>
      <span class="file-size">${formatSize(rec.size || 0)}</span>`;

    if (isUser) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'file-delete-btn';
      del.title = 'Eliminar archivo';
      del.textContent = '🗑️';
      del.onclick = () => deleteWeekFile(rec);
      header.appendChild(del);
    }

    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'file-card-body';

    let url = rec.url;
    if (!url && rec.data) url = createObjectUrl(rec);

    if (isImageType(rec.type, rec.name) && url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = rec.name;
      img.className = 'file-preview-img';
      body.appendChild(img);
    } else if (isPdfType(rec.type, rec.name) && url) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.className = 'file-preview-pdf';
      frame.title = rec.name;
      body.appendChild(frame);
    } else if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'file-download-link';
      link.textContent = '⬇️ Abrir / Descargar';
      body.appendChild(link);
    }

    card.appendChild(body);
    gallery.appendChild(card);
  });
}

function initWeekFilesUI() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

  // Ensure token button + status exist inside upload panel
  const panel = root.querySelector('.files-upload-panel');
  if (panel && !document.getElementById('btn-gh-token')) {
    const tools = document.createElement('div');
    tools.className = 'files-tools';
    tools.innerHTML = `
      <button type="button" id="btn-gh-token" class="btn-gh-token" onclick="promptGithubToken()">🔑 Token GitHub</button>
      <p id="files-status" class="files-status" style="display:none;"></p>
    `;
    panel.appendChild(tools);
  }

  const input = root.querySelector('#week-file-input');
  const drop = root.querySelector('.files-dropzone');

  if (input) {
    input.addEventListener('change', (e) => {
      handleFilesSelected(e.target.files);
      input.value = '';
    });
  }

  if (drop) {
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('dragover');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('dragover');
      if (!filesIsUser()) {
        alert('Solo los usuarios con sesión pueden subir archivos.');
        return;
      }
      handleFilesSelected(e.dataTransfer.files);
    });
  }

  updateTokenButton();
  renderWeekFiles();
}

document.addEventListener('DOMContentLoaded', initWeekFilesUI);
