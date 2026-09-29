const requestUrl = "http://localhost:8080/ytdlp/request";
const userIp = "127.0.0.1";

const forms = document.querySelectorAll<HTMLFormElement>(".download-form");

for (const form of forms) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitter = event.submitter;
        if (!(submitter instanceof HTMLButtonElement) || !submitter.value) {
            return;
        }

        const videoUrl = new FormData(form).get("videoUrl");
        const platform = form.dataset.platform;
        const status = form.parentElement?.querySelector<HTMLElement>(
            ".request-status",
        );

        if (typeof videoUrl !== "string" || !platform || !status) {
            throw new Error("Download request form is missing required data.");
        }

        const buttons = form.querySelectorAll<HTMLButtonElement>(
            'button[name="fileFormat"]',
        );
        buttons.forEach((button) => {
            button.disabled = true;
        });
        status.textContent = "リクエストを送信しています...";
        status.classList.remove("request-error");

        try {
            const response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    videoUrl,
                    userIp,
                    fileFormat: submitter.value,
                    platform,
                }),
            });
            const responseText = await response.text();

            if (!response.ok) {
                status.textContent =
                    responseText ||
                    `リクエストに失敗しました (HTTP ${response.status})`;
                status.classList.add("request-error");
                return;
            }

            status.textContent = responseText
                ? `リクエストを受け付けました: ${responseText}`
                : `リクエストを受け付けました (HTTP ${response.status})`;
        } catch (error) {
            console.error("Download request failed:", error);
            status.textContent =
                "APIに接続できませんでした。APIの起動状態とCORS設定を確認してください。";
            status.classList.add("request-error");
        } finally {
            buttons.forEach((button) => {
                button.disabled = false;
            });
        }
    });
}
