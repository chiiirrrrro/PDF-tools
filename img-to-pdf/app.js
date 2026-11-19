const imagesContainer = document.getElementById('images-container');
const fileCountElem = document.getElementById('fileCount');
const titleField = document.getElementById('title');

// 追加されたファイルオブジェクトを管理する配列
let selectedFiles = [];

// ファイルリストの描画更新
function renderFileList() {
  imagesContainer.innerHTML = '';

  if (selectedFiles.length === 0) {
    imagesContainer.innerHTML = '<p class="empty-msg">上の「ファイルを選択」から画像を追加してください。</p>';
    fileCountElem.textContent = '';
    return;
  }

  fileCountElem.textContent = `選択中: ${selectedFiles.length}枚`;

  selectedFiles.forEach((item, index) => {
    const div = document.createElement('div');

    // 左側：ページ番号・サムネイル・ファイル名
    const infoDiv = document.createElement('div');
    infoDiv.className = 'file-info';

    const pageBadge = document.createElement('strong');
    pageBadge.textContent = `${index + 1}.`;
    pageBadge.style.minWidth = '24px';
    infoDiv.appendChild(pageBadge);

    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = item.previewUrl;
    infoDiv.appendChild(thumb);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = item.file.name;
    infoDiv.appendChild(nameSpan);

    div.appendChild(infoDiv);

    // 右側：順番入れ替え・削除ボタン
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'row-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.className = 'neutral-btn small-btn';
    upBtn.disabled = index === 0;
    upBtn.style.opacity = index === 0 ? '0.4' : '1';
    upBtn.addEventListener('click', () => {
      [selectedFiles[index - 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index - 1]];
      renderFileList();
    });
    actionsDiv.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.className = 'neutral-btn small-btn';
    downBtn.disabled = index === selectedFiles.length - 1;
    downBtn.style.opacity = index === selectedFiles.length - 1 ? '0.4' : '1';
    downBtn.addEventListener('click', () => {
      [selectedFiles[index + 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index + 1]];
      renderFileList();
    });
    actionsDiv.appendChild(downBtn);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '削除';
    delBtn.className = 'danger-btn small-btn';
    delBtn.addEventListener('click', () => {
      URL.revokeObjectURL(item.previewUrl);
      selectedFiles.splice(index, 1);
      renderFileList();
    });
    actionsDiv.appendChild(delBtn);

    div.appendChild(actionsDiv);
    imagesContainer.appendChild(div);
  });
}

// ファイル選択時の処理（追加選択にも対応）
document.getElementById('imageFiles').addEventListener('change', function () {
  const files = Array.from(this.files);
  if (files.length === 0) return;

  if (!titleField.value.trim()) {
    const baseName = files[0].name.replace(/\.[^/.]+$/, '');
    titleField.value = baseName;
  }

  files.forEach(file => {
    selectedFiles.push({
      file: file,
      previewUrl: URL.createObjectURL(file)
    });
  });

  this.value = '';
  renderFileList();
});

// すべてクリアボタン
document.getElementById('clearBtn').addEventListener('click', () => {
  selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
  selectedFiles = [];
  renderFileList();
});

// WebPなどの画像をCanvas経由でPNGのArrayBufferに変換する補助関数
function convertImageToPngBuffer(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error('画像変換に失敗しました'));
        resolve(await blob.arrayBuffer());
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = url;
  });
}

// PDF変換＆ダウンロード処理
async function convertImagesToPdf() {
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const fitA4 = document.getElementById('fitA4').checked;

  progressBar.style.width = '0%';
  status.textContent = "処理を開始します";

  const title = titleField.value.trim();

  if (!title || selectedFiles.length === 0) {
    status.textContent = "出力ファイル名と画像ファイルを入力してください";
    return;
  }

  try {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i].file;
      status.textContent = `処理中… ${file.name} (${i + 1}/${selectedFiles.length})`;

      let embeddedImage;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const arrayBuffer = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      } else if (file.type === 'image/png') {
        const arrayBuffer = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        const pngBuffer = await convertImageToPngBuffer(file);
        embeddedImage = await pdfDoc.embedPng(pngBuffer);
      }

      const imgDims = embeddedImage.scale(1);

      if (fitA4) {
        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const scale = Math.min(A4_WIDTH / imgDims.width, A4_HEIGHT / imgDims.height);
        const drawWidth = imgDims.width * scale;
        const drawHeight = imgDims.height * scale;
        const x = (A4_WIDTH - drawWidth) / 2;
        const y = (A4_HEIGHT - drawHeight) / 2;

        page.drawImage(embeddedImage, {
          x: x,
          y: y,
          width: drawWidth,
          height: drawHeight,
        });
      } else {
        const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imgDims.width,
          height: imgDims.height,
        });
      }

      progressBar.style.width = `${Math.floor(((i + 1) / selectedFiles.length) * 100)}%`;
      await new Promise(r => setTimeout(r, 10));
    }

    status.textContent = "PDFファイルを作成中…";
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    status.textContent = "完了！PDFファイルをダウンロードしました。";
  } catch (e) {
    console.error(e);
    status.textContent = `エラーが発生しました: ${e.message}`;
  }
}

document.getElementById('convertBtn').addEventListener('click', convertImagesToPdf);
