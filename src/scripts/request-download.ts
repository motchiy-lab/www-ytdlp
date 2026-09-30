const requestUrl = "https://webhook.site/8e87f1a4-6bf4-4137-bff8-1dee56b7488a";
const taskUrl = "https://webhook.site/8e87f1a4-6bf4-4137-bff8-1dee56b7488a";
const userIp = "127.0.0.2";
const taskPollIntervalMs = 1000;

const forms = document.querySelectorAll<HTMLFormElement>(".download-form");

interface TaskResponse {
    status?: unknown;
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
            status.textContent = `ダウンロードが完了しました。 (task_id: ${taskId})`;
            return;
        }

        if (["failed", "error", "cancelled", "canceled"].includes(taskStatus)) {
            const detail =
                typeof task.error === "string" ? `: ${task.error}` : "";
            throw new Error(`タスクが${task.status}になりました${detail}`);
        }

        status.textContent = `処理中です... 状態: ${task.status}`;
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
            if (!response.ok) {
                const responseText = await response.text();
                status.textContent =
                    responseText ||
                    `リクエストに失敗しました (HTTP ${response.status})`;
                status.classList.add("request-error");
                return;
            }

            const result = await readJson(response);
            if (
                typeof result !== "object" ||
                result === null ||
                typeof result.task_id !== "string" ||
                result.task_id.length === 0
            ) {
                throw new Error("POSTレスポンスに有効なtask_idがありません。");
            }

            status.textContent = `リクエストを受け付けました。タスクID: ${result.task_id}`;
            await pollTask(result.task_id, status);
        } catch (error) {
            console.error("Download request failed:", error);
            status.textContent =
                error instanceof Error
                    ? error.message
                    : "APIへのリクエストに失敗しました。";
            status.classList.add("request-error");
        } finally {
            buttons.forEach((button) => {
                button.disabled = false;
            });
        }
    });
}
