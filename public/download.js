let currentAction = "mp3";

function setAction(action) {
  currentAction = action;
}

function openModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector('form[action="download.php"]');
  if (!form) return;

  // クリックされたボタンのフォーマットを記録
  form.addEventListener("click", (event) => {
    const target = event.target;

    if (target.tagName === "BUTTON" && target.name === "action") {
      currentAction = target.value;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    openModal();

    const urlInput = document.getElementById("youtube_url")
      ? document.getElementById("youtube_url").value
      : form.querySelector('input[name="youtube_url"]').value;

    const formData = new FormData();
    formData.append("youtube_url", urlInput);
    formData.append("action", currentAction);

    try {
      const response = await fetch("download.php", {
        method: "POST",
        body: formData,
      });

      /*
       * ==========================
       * エラー処理
       * ==========================
       *
       * HTTP 200以外ならファイルとして扱わない。
       */
      if (!response.ok) {
        const errorHtml = await response.text();

        // エラーページを現在のページとして表示
        document.open();
        document.write(errorHtml);
        document.close();

        return;
      }

      /*
       * ==========================
       * 成功時のみダウンロード
       * ==========================
       */

      // Content-Dispositionからファイル名を取得
      const disposition = response.headers.get("Content-Disposition");

      let filename = "downloaded." + currentAction;

      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

        if (utf8Match && utf8Match[1]) {
          try {
            filename = decodeURIComponent(utf8Match[1]);
          } catch (e) {
            console.warn("ファイル名のデコードに失敗:", e);
          }
        } else {
          const regularMatch = disposition.match(/filename="?([^";]+)"?/i);

          if (regularMatch && regularMatch[1]) {
            filename = regularMatch[1];
          }
        }
      }

      // 成功レスポンスだけBlob化
      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = downloadUrl;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      a.remove();

      // 少し待ってからURLを解放
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (error) {
      console.error("通信エラー:", error);
      alert("ダウンロード中に通信エラーが発生しました。");
    } finally {
      closeModal();
    }
  });
});
