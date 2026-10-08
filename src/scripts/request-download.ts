const requestUrl = "https://api.motchiy.com/ytdlp/request";
const taskUrl = "https://api.motchiy.com/ytdlp/tasks";

/*
const requestUrl = "http://localhost:8080/ytdlp/request";
const taskUrl = "http://localhost:8080/ytdlp/tasks";
*/

const taskPollIntervalMs = 1000;

const forms = document.querySelectorAll<HTMLFormElement>(".download-form");
const loadingModal = document.querySelector<HTMLDialogElement>("#loadingModal");
const modalStatus = loadingModal?.querySelector<HTMLElement>(".loading-status");

function updateStatus(status: HTMLElement, message: string): void {
    status.textContent = message;
    if (modalStatus) {
        modalStatus.textContent = message;
    }
}

interface TaskResponse {
    status?: unknown;
    message?: unknown;
    error?: unknown;
    download_url?: unknown;
    [key: string]: unknown;
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        throw new Error("APIから有効なJSONレスポンスが返されませんでした。");
    }
}

async function readErrorMessage(response: Response): Promise<string> {
    const responseText = await response.text();
    if (responseText.length === 0) {
        return `リクエストに失敗しました (HTTP ${response.status})`;
    }

    try {
        const result: unknown = JSON.parse(responseText);
        if (
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
        ) {
            return result.error;
        }
    } catch {
        // Non-JSON error responses are displayed as-is.
    }

    return responseText;
}

async function pollTask(taskId: string, status: HTMLElement): Promise<void> {
    const statusUrl = `${taskUrl}/${encodeURIComponent(taskId)}`;

    while (true) {
        await wait(taskPollIntervalMs);
        const response = await fetch(statusUrl);

        if (!response.ok) {
            throw new Error(`タスク状態の取得に失敗しました (HTTP ${response.status})`);
        }

        const result = await readJson(response);
        if (typeof result !== "object" || result === null) {
            throw new Error("タスク状態のレスポンス形式が正しくありません。");
        }

        const task = result as TaskResponse;
        if (typeof task.status !== "string") {
            throw new Error("タスク状態のレスポンスにstatusがありません。");
        }

        const taskStatus = task.status.toLowerCase();
        if (taskStatus === "completed") {
            if (typeof task.download_url !== "string" || task.download_url.length === 0) {
                throw new Error("完了レスポンスに有効なdownload_urlがありません。");
            }

            let downloadUrl: URL;
            try {
                downloadUrl = new URL(task.download_url);
            } catch {
                throw new Error("完了レスポンスのdownload_urlが正しくありません。");
            }
            if (downloadUrl.protocol !== "https:") {
                throw new Error("download_urlにはHTTPSのURLが必要です。");
            }

            const detail =
                typeof task.message === "string" ? ` ${task.message}` : "";
            updateStatus(
                status,
                `ダウンロードが完了しました。${detail} (task_id: ${taskId})`,
            );
            loadingModal?.close();
            window.location.assign(downloadUrl.href);
            return;
        }

        if (["failed", "error", "cancelled", "canceled"].includes(taskStatus)) {
            const detail =
                typeof task.message === "string"
                    ? `: ${task.message}`
                    : typeof task.error === "string"
                      ? `: ${task.error}`
                      : "";
            throw new Error(`タスクが${task.status}になりました${detail}`);
        }

        const detail =
            typeof task.message === "string" ? ` (${task.message})` : "";
        updateStatus(status, `処理中です... 状態: ${task.status}${detail}`);
    }
}

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
        updateStatus(status, "リクエストを送信しています...");
        status.classList.remove("request-error");
        loadingModal?.showModal();

        try {
            const response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    videoUrl,
                    fileFormat: submitter.value,
                    platform,
                }),
            });
            if (!response.ok) {
                updateStatus(status, await readErrorMessage(response));
                status.classList.add("request-error");
                loadingModal?.close();
                return;
            }

            const result = await readJson(response);
            if (
                typeof result !== "object" ||
                result === null ||
                !("task_id" in result) ||
                typeof result.task_id !== "string" ||
                result.task_id.length === 0
            ) {
                throw new Error("POSTレスポンスに有効なtask_idがありません。");
            }

            updateStatus(
                status,
                `リクエストを受け付けました。タスクID: ${result.task_id}`,
            );
            await pollTask(result.task_id, status);
        } catch (error) {
            console.error("Download request failed:", error);
            updateStatus(
                status,
                error instanceof Error
                    ? error.message
                    : "APIへのリクエストに失敗しました。",
            );
            status.classList.add("request-error");
            loadingModal?.close();
        } finally {
            buttons.forEach((button) => {
                button.disabled = false;
            });
        }
    });
}

loadingModal?.querySelector<HTMLButtonElement>(".modal-close")?.addEventListener(
    "click",
    () => loadingModal.close(),
);
