/* =========================================
   files.js — Archivos por semana (IndexedDB)
   Subida: solo usuario logueado
   Visualización: todos (usuario e invitado)
   ========================================= */

const FILES_DB_NAME = 'holofolio_files_db';
const FILES_STORE = 'weekFiles';
const FILES_DB_VER = 1;

function filesIsUser() {
  return localStorage.getItem('portfolio_auth') === 'user';
}

function openFilesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FILES_DB_NAME, FILES_DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getWeekFiles(weekKey) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readonly');
    const store = tx.objectStore(FILES_STORE);
    const req = store.get(weekKey);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function setWeekFiles(weekKey, list) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readwrite');
    const store = tx.objectStore(FILES_STORE);
    const req = store.put(list, weekKey);
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
        data: reader.result, // ArrayBuffer
        addedAt: new Date().toISOString()
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function isImageType(type, name) {
  if (type && type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '');
}

function isPdfType(type, name) {
  if (type === 'application/pdf') return true;
  return /\.pdf$/i.test(name || '');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getWeekKeyFromPage() {
  const el = document.getElementById('week-files-root');
  if (el && el.dataset.week) return el.dataset.week;
  // fallback from path
  const m = location.pathname.match(/semana(\d+)/i);
  return m ? `semana${m[1]}` : 'semana0';
}

async function handleFilesSelected(fileList) {
  if (!filesIsUser()) {
    alert('Solo los usuarios con sesión pueden subir archivos.');
    return;
  }
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const weekKey = getWeekKeyFromPage();
  const existing = await getWeekFiles(weekKey);

  for (const f of files) {
    // límite razonable ~100 MB por archivo
    if (f.size > 100 * 1024 * 1024) {
      alert(`"${f.name}" pesa más de 100 MB y se omitió.`);
      continue;
    }
    const rec = await fileToRecord(f);
    existing.push(rec);
  }

  await setWeekFiles(weekKey, existing);
  await renderWeekFiles();
}

async function deleteWeekFile(fileId) {
  if (!filesIsUser()) return;
  const weekKey = getWeekKeyFromPage();
  let list = await getWeekFiles(weekKey);
  list = list.filter(f => f.id !== fileId);
  await setWeekFiles(weekKey, list);
  await renderWeekFiles();
}

function createObjectUrl(record) {
  const blob = new Blob([record.data], { type: record.type || 'application/octet-stream' });
  return URL.createObjectURL(blob);
}

async function renderWeekFiles() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

  const weekKey = getWeekKeyFromPage();
  const list = await getWeekFiles(weekKey);
  const isUser = filesIsUser();

  const emptyHint = root.querySelector('.files-empty-hint');
  const gallery = root.querySelector('.files-gallery');
  const uploadPanel = root.querySelector('.files-upload-panel');

  if (uploadPanel) {
    uploadPanel.style.display = isUser ? 'block' : 'none';
  }

  if (!gallery) return;
  gallery.innerHTML = '';

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
    header.innerHTML = `<span class="file-name">${escapeHtml(rec.name)}</span>
      <span class="file-size">${formatSize(rec.size || 0)}</span>`;

    if (isUser) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'file-delete-btn';
      del.title = 'Eliminar archivo';
      del.textContent = '🗑️';
      del.onclick = () => {
        if (confirm(`¿Eliminar "${rec.name}"?`)) deleteWeekFile(rec.id);
      };
      header.appendChild(del);
    }

    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'file-card-body';

    const url = createObjectUrl(rec);

    if (isImageType(rec.type, rec.name)) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = rec.name;
      img.className = 'file-preview-img';
      body.appendChild(img);
    } else if (isPdfType(rec.type, rec.name)) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.className = 'file-preview-pdf';
      frame.title = rec.name;
      body.appendChild(frame);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = rec.name;
      link.className = 'file-download-link';
      link.textContent = '⬇️ Descargar archivo';
      body.appendChild(link);
    }

    card.appendChild(body);
    gallery.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initWeekFilesUI() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

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

  renderWeekFiles();
}

document.addEventListener('DOMContentLoaded', initWeekFilesUI);
