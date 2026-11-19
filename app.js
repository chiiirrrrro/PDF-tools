const partsContainer = document.getElementById('parts-container');

const partDetails = {
  Score: [],
  Sax: ['A.sax1', 'A.sax2', 'T.sax1', 'T.sax2', 'B.sax', 'S.sax'],
  Tp: ['1', '2', '3', '4', '5'],
  Tb: ['1', '2', '3', '4'],
  rhythm: ['Guitar', 'Pf', 'Bass', 'Drums', 'Percussion'],
  手入力: []
};

function createPartRow(preset = null) {
  const div = document.createElement('div');

  const partSelect = document.createElement('select');
  for (const key in partDetails) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    partSelect.appendChild(opt);
  }
  partSelect.value = preset?.type || 'Sax';
  div.appendChild(partSelect);

  const detailSelect = document.createElement('select');
  detailSelect.style.minWidth = '80px';
  div.appendChild(detailSelect);

  const manualInput = document.createElement('input');
  manualInput.type = 'text';
  manualInput.placeholder = 'パート名';
  manualInput.style.display = 'none';
  if (preset?.type === '手入力' && preset?.detail) {
    manualInput.value = preset.detail;
  }
  div.appendChild(manualInput);

  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.min = '1';
  startInput.placeholder = '開始ページ';
  startInput.style.width = '80px';
  div.appendChild(startInput);
  startInput.addEventListener('input', () => {
    const startVal = parseInt(startInput.value, 10);
    if (!isNaN(startVal) && /^[0-9]+$/.test(startInput.value)) {
      const rows = Array.from(partsContainer.children);
      const idx = rows.indexOf(div);
      if (idx > 0) {
        const prevDiv = rows[idx - 1];
        const prevEndInput = prevDiv.querySelectorAll('input[type=number]')[1];
        prevEndInput.value = startVal - 1;
      }
    }
  });

  const tilde = document.createElement('span');
  tilde.textContent = '〜';
  div.appendChild(tilde);

  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.min = '1';
  endInput.placeholder = '終了ページ';
  endInput.style.width = '80px';
  div.appendChild(endInput);

  const delBtn = document.createElement('button');
  delBtn.textContent = '削除';
  delBtn.type = 'button';
  delBtn.className = 'remove-part';
  delBtn.addEventListener('click', () => div.remove());
  div.appendChild(delBtn);

  function updateDetailOptions() {
    const part = partSelect.value;
    const details = partDetails[part];
    if (part === '手入力') {
      detailSelect.style.display = 'none';
      manualInput.style.display = 'inline-block';
    } else {
      manualInput.style.display = 'none';
      manualInput.style.width = '68px';
      detailSelect.style.display = 'inline-block';
      detailSelect.innerHTML = '';
      details.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        detailSelect.appendChild(opt);
      });
      if (preset?.detail && details.includes(preset.detail)) {
        detailSelect.value = preset.detail;
      }
    }
  }

  partSelect.addEventListener('change', updateDetailOptions);
  updateDetailOptions();

  // パート追加時、直前の行の「終了ページ + 1」を開始ページに自動セット
  const rows = Array.from(partsContainer.children);
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastEndInput = lastRow.querySelectorAll('input[type=number]')[1];
    const lastEndVal = parseInt(lastEndInput.value, 10);
    if (!isNaN(lastEndVal) && lastEndVal >= 1) {
      startInput.value = lastEndVal + 1;
    }
  }

  partsContainer.appendChild(div);
}

// ビッグバンド基本編成を一括追加
function addBigBandPreset() {
  const presets = [
    { type: 'Score', detail: '' },
    { type: 'Sax', detail: 'A.sax1' },
    { type: 'Sax', detail: 'A.sax2' },
    { type: 'Sax', detail: 'T.sax1' },
    { type: 'Sax', detail: 'T.sax2' },
    { type: 'Sax', detail: 'B.sax' },
    { type: 'Tp', detail: '1' },
    { type: 'Tp', detail: '2' },
    { type: 'Tp', detail: '3' },
    { type: 'Tp', detail: '4' },
    { type: 'Tb', detail: '1' },
    { type: 'Tb', detail: '2' },
    { type: 'Tb', detail: '3' },
    { type: 'Tb', detail: '4' },
    { type: 'rhythm', detail: 'Guitar' },
    { type: 'rhythm', detail: 'Pf' },
    { type: 'rhythm', detail: 'Bass' },
    { type: 'rhythm', detail: 'Drums' }
  ];

  if (partsContainer.children.length === 1) {
    const onlyRow = partsContainer.children[0];
    const nums = Array.from(onlyRow.querySelectorAll('input[type=number]'));
    if (!nums[0].value && !nums[1].value) {
      partsContainer.innerHTML = '';
    }
  }

  presets.forEach(p => createPartRow(p));
}

document.getElementById('addPartBtn').addEventListener('click', () => createPartRow());
document.getElementById('addBigBandBtn').addEventListener('click', addBigBandPreset);
createPartRow();

document.getElementById('pdfFile').addEventListener('change', async function () {
  const file = this.files[0];
  const titleField = document.getElementById('title');
  const pageCountElem = document.getElementById('pageCount');

  if (file) {
    if (!titleField.value.trim()) {
      const filename = file.name.replace(/\.pdf$/i, '');
      titleField.value = filename;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      pageCountElem.textContent = `ページ数: ${pageCount}ページ`;
    } catch (e) {
      pageCountElem.textContent = 'ページ数を取得できませんでした。';
      console.error(e);
    }
  } else {
    pageCountElem.textContent = '';
  }
});

function cleanPartName(name) {
  return name.replace(':', '').replace(/^Sax/, '').replace(/^rhythm/, '');
}

async function splitPdfAndZip() {
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const useNumbering = document.getElementById('useNumbering').checked;
  progressBar.style.width = '0%';
  status.textContent = "処理を開始します";

  const title = document.getElementById('title').value.trim();
  const fileInput = document.getElementById('pdfFile');

  if (!title || fileInput.files.length === 0) {
    status.textContent = "曲名とPDFファイルを入力してください";
    return;
  }

  const parts = [];
  for (const div of partsContainer.children) {
    const selects = div.querySelectorAll('select');
    const inputs = div.querySelectorAll('input[type=number]');
    const manual = div.querySelector('input[type=text]');
    const partType = selects[0].value;
    const partName = partType === '手入力' ? manual.value : `${partType}:${selects[1].value}`;
    const start = parseInt(inputs[0].value);
    const end = parseInt(inputs[1].value);
    if (!partName && partType === '手入力') {
      status.textContent = `手入力の欄は埋めてください`;
      return;
    }
    if (!start || !end || start > end) {
      status.textContent = `無効な数値が含まれています`;
      return;
    }
    parts.push({ type: partType, name: partName, start, end });
  }

  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const zip = new JSZip();

  const existingNames = new Set();
  function getUniqueFilename(baseName) {
    if (!existingNames.has(baseName)) {
      existingNames.add(baseName);
      return baseName;
    }
    let index = 1;
    let newName;
    do {
      newName = `${baseName}(${index})`;
      index++;
    } while (existingNames.has(newName));
    existingNames.add(newName);
    return newName;
  }

  let partCounter = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    status.textContent = `処理中… ${part.name} (${i + 1}/${parts.length})`;

    const newPdf = await PDFLib.PDFDocument.create();
    for (let p = part.start - 1; p < part.end; p++) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [p]);
      newPdf.addPage(copiedPage);
      await new Promise(r => setTimeout(r, 10));
    }
    const pdfBytes = await newPdf.save();

    let fileNamePrefix = "";
    if (useNumbering) {
      if (part.type === 'Score') {
        fileNamePrefix = "000 ";
      } else {
        fileNamePrefix = String(partCounter).padStart(3, '0') + '-';
        partCounter++;
      }
    }

    const baseName = `${title}-${fileNamePrefix}${cleanPartName(part.name)}`;
    const uniqueName = getUniqueFilename(baseName);
    const filename = `${uniqueName}.pdf`;

    zip.file(filename, pdfBytes);
    progressBar.style.width = `${Math.floor(((i + 1) / parts.length) * 100)}%`;
  }

  status.textContent = "ZIPファイルを作成中…";
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}_parts.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  status.textContent = "完了！ZIPファイルをダウンロードしました。";
}

document.getElementById('splitBtn').addEventListener('click', splitPdfAndZip);
