const pdfInput = document.getElementById('pdfInput');
const fileList = document.getElementById('file-list');
const fileCount = document.getElementById('fileCount');
const status = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const outputNameInput = document.getElementById('outputName');

let files = [];

function renderList() {
  if (!fileList) return;
  fileList.innerHTML = '';

  if (fileCount) {
    fileCount.textContent = files.length > 0 ? `追加済み：${files.length}件` : '';
  }

  if (files.length === 0) {
    fileList.innerHTML = '<p class="empty-msg">上の「ファイルを選択」からPDFを追加してください。</p>';
    return;
  }

  files.forEach((file, index) => {

  files.forEach((file, index) => {
    const row = document.createElement('div');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = file.name;
    row.appendChild(nameSpan);

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.className = 'neutral-btn small-btn';
    upBtn.onclick = () => {
      if (index > 0) {
        [files[index - 1], files[index]] = [files[index], files[index - 1]];
        renderList();
      }
    };

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.className = 'neutral-btn small-btn';
    downBtn.onclick = () => {
      if (index < files.length - 1) {
        [files[index + 1], files[index]] = [files[index], files[index + 1]];
        renderList();
      }
    };

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '削除';
    removeBtn.className = 'danger-btn small-btn';
    removeBtn.onclick = () => {
      files.splice(index, 1);
      renderList();
    };

    row.appendChild(upBtn);
    row.appendChild(downBtn);
    row.appendChild(removeBtn);
    fileList.appendChild(row);
  });
}

if (pdfInput) {
  pdfInput.addEventListener('change', () => {
    if (pdfInput.files && pdfInput.files.length > 0) {
      for (const file of pdfInput.files) {
        files.push(file);
      }
      renderList();
      pdfInput.value = '';
    }
  });
}

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    files = [];
    renderList();
    if (status) {
      status.textContent = '';
    }
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  });
}
  
document.getElementById('mergeBtn').addEventListener('click', async () => {
  if (files.length < 2) {
    status.textContent = 'PDFを2つ以上追加してください';
    return;
  }

  status.textContent = 'PDFを結合中…';
  progressBar.style.width = '0%';

  const mergedPdf = await PDFLib.PDFDocument.create();
  let processed = 0;

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => mergedPdf.addPage(p));

    processed++;
    progressBar.style.width = `${Math.floor((processed / files.length) * 100)}%`;
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const base =
    outputNameInput.value.trim()
      || files[0].name.replace(/\.pdf$/i, '');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${base}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
  status.textContent = '完了！PDFをダウンロードしました。';
});
