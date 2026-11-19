const pdfInput = document.getElementById('pdfInput');
const fileList = document.getElementById('file-list');
const status = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const outputNameInput = document.getElementById('outputName');

let files = [];

function renderList() {
  fileList.innerHTML = '';
  files.forEach((file, index) => {
    const row = document.createElement('div');
    row.textContent = file.name;

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

pdfInput.addEventListener('change', () => {
  if (pdfInput.files.length > 0) {
    for (const file of pdfInput.files) {
      files.push(file);
    }
    status.textContent = '';
    renderList();
    pdfInput.value = '';
  }
});

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
