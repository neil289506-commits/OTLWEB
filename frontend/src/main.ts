/**
 * OTL Web System - 前端主邏輯
 */

import { OtlApiClient, OtlApiError } from "./api";
import { CONFIG } from "./config";

const api = new OtlApiClient(CONFIG.WORKER_BASE_URL);

// ============================================================================
// DOM 參照
// ============================================================================

const form = document.getElementById("create-form") as HTMLFormElement;
const urlInput = document.getElementById("target-url") as HTMLInputElement;
const expirationSelect = document.getElementById(
  "expiration"
) as HTMLSelectElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const submitBtnLabel = submitBtn.querySelector(
  ".btn-label"
) as HTMLSpanElement;

const errorBox = document.getElementById("error-box") as HTMLDivElement;
const resultBox = document.getElementById("result-box") as HTMLDivElement;
const resultLinkInput = document.getElementById(
  "result-link"
) as HTMLInputElement;
const copyBtn = document.getElementById("copy-btn") as HTMLButtonElement;
const encryptedTokenPreview = document.getElementById(
  "encrypted-token-preview"
) as HTMLElement;
const resultExpiryLabel = document.getElementById(
  "result-expiry-label"
) as HTMLElement;
const createAnotherBtn = document.getElementById(
  "create-another-btn"
) as HTMLButtonElement;
const statusDot = document.getElementById("status-dot") as HTMLSpanElement;
const statusText = document.getElementById("status-text") as HTMLSpanElement;

// ============================================================================
// 初始化：填充有效期限選項 + 檢查後端連線狀態
// ============================================================================

function populateExpirationOptions() {
  expirationSelect.innerHTML = "";
  for (const preset of CONFIG.EXPIRATION_PRESETS) {
    const option = document.createElement("option");
    option.value = String(preset.seconds);
    option.textContent = preset.label;
    if (preset.seconds === CONFIG.DEFAULT_EXPIRATION_SECONDS) {
      option.selected = true;
    }
    expirationSelect.appendChild(option);
  }
}

async function checkBackendStatus() {
  const isHealthy = await api.checkHealth();
  if (isHealthy) {
    statusDot.classList.add("online");
    statusDot.classList.remove("offline");
    statusText.textContent = "後端服務運作中";
  } else {
    statusDot.classList.add("offline");
    statusDot.classList.remove("online");
    statusText.textContent = "無法連線到後端服務";
  }
}

// ============================================================================
// 表單提交
// ============================================================================

function setLoading(loading: boolean) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle("loading", loading);
  submitBtnLabel.textContent = loading ? "產生中..." : "產生一次性連結";
}

function showError(message: string) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  resultBox.style.display = "none";
}

function hideError() {
  errorBox.style.display = "none";
}

function formatExpirationLabel(seconds: number): string {
  const preset = CONFIG.EXPIRATION_PRESETS.find((p) => p.seconds === seconds);
  if (preset) return preset.label;
  return `${Math.round(seconds / 60)} 分鐘`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const targetUrl = urlInput.value.trim();
  const expirationSeconds = Number(expirationSelect.value);

  if (!targetUrl) {
    showError("請輸入目標網址");
    return;
  }

  try {
    new URL(targetUrl);
  } catch {
    showError("請輸入有效的網址（需包含 https:// 或 http://）");
    return;
  }

  setLoading(true);

  try {
    const result = await api.createToken(targetUrl, expirationSeconds);

    resultLinkInput.value = result.redirectUrl;
    encryptedTokenPreview.textContent = truncateMiddle(
      result.encryptedTokenBase64,
      60
    );
    resultExpiryLabel.textContent = formatExpirationLabel(
      result.expirationSeconds
    );

    resultBox.style.display = "block";
    form.style.display = "none";

    resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    if (err instanceof OtlApiError) {
      showError(`建立失敗：${err.message}`);
    } else {
      showError("網路錯誤，請稍後再試");
    }
  } finally {
    setLoading(false);
  }
});

// ============================================================================
// 複製連結
// ============================================================================

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultLinkInput.value);
    const original = copyBtn.textContent;
    copyBtn.textContent = "已複製 ✓";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = original;
      copyBtn.classList.remove("copied");
    }, 1800);
  } catch {
    // Fallback：選取文字讓使用者手動複製
    resultLinkInput.select();
    resultLinkInput.setSelectionRange(0, 99999);
  }
});

// ============================================================================
// 建立另一個連結
// ============================================================================

createAnotherBtn.addEventListener("click", () => {
  resultBox.style.display = "none";
  form.style.display = "flex";
  urlInput.value = "";
  urlInput.focus();
});

// ============================================================================
// 小工具
// ============================================================================

function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return str.slice(0, half) + "..." + str.slice(str.length - half);
}

// ============================================================================
// 啟動
// ============================================================================

populateExpirationOptions();
checkBackendStatus();
