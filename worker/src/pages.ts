/**
 * OTL Web System - 頁面模板
 *
 * 簡潔卡片式風格：白底、圓角卡片、置中，現代 SaaS 風格。
 * 所有頁面皆為單一 HTML 字串（inline CSS），不依賴外部資源，
 * 確保在 Cloudflare Workers 內快速回應且不受 CDN 影響。
 */

const BASE_STYLE = `
  :root {
    color-scheme: light;
    --brand: #4338ca;
    --brand-dark: #3730a3;
    --brand-light: #e0e7ff;
    --success: #15803d;
    --success-light: #dcfce7;
    --danger: #b91c1c;
    --danger-light: #fee2e2;
    --warn: #b45309;
    --warn-light: #fef3c7;
    --text: #111827;
    --text-muted: #4b5563;
    --border: #d1d5db;
    --bg: #f3f4f6;
  }
  * { box-sizing: border-box; }
  html, body {
    height: 100%;
  }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #eef0f7;
    background-image: linear-gradient(135deg, #eef0fb 0%, #e0e7ff 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "PingFang TC", "Microsoft JhengHei", sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 20px 25px -5px rgba(17,24,39,0.1), 0 8px 10px -6px rgba(17,24,39,0.06);
    padding: 40px 32px;
    text-align: center;
    animation: fadeIn 0.35s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .icon-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 34px;
  }
  .icon-circle.brand { background: var(--brand-light); color: var(--brand); }
  .icon-circle.success { background: var(--success-light); color: var(--success); }
  .icon-circle.danger { background: var(--danger-light); color: var(--danger); }
  .icon-circle.warn { background: var(--warn-light); color: var(--warn); }
  h1 {
    font-size: 21px;
    font-weight: 800;
    margin: 0 0 10px;
    color: var(--text);
  }
  p.desc {
    font-size: 14px;
    color: var(--text-muted);
    line-height: 1.65;
    margin: 0 0 24px;
    font-weight: 500;
  }
  .url-box {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13px;
    color: var(--text);
    word-break: break-all;
    margin-bottom: 16px;
    text-align: left;
    font-family: "SF Mono", "Courier New", monospace;
    font-weight: 600;
  }
  .url-box .label {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 6px;
    font-weight: 700;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    text-decoration: none;
    box-sizing: border-box;
  }
  .btn-primary {
    background: var(--brand);
    color: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(67,56,202,0.3);
  }
  .btn-primary:hover { background: var(--brand-dark); }
  .btn-primary:disabled {
    background: #a5a6d6;
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn-secondary {
    background: #ffffff;
    color: var(--text);
    border: 1.5px solid var(--border);
    margin-top: 10px;
  }
  .btn-secondary:hover { background: var(--bg); }
  .footer-note {
    margin-top: 20px;
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: none;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btn.loading .spinner { display: inline-block; }
  .btn.loading .btn-label { opacity: 0.85; }
  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    color: var(--text-muted);
    padding: 7px 0;
    border-bottom: 1px dashed var(--border);
    font-weight: 600;
  }
  .meta-row:last-child { border-bottom: none; }
  .meta-row span:last-child {
    color: var(--text);
    font-weight: 700;
  }
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 28px;
    font-size: 13px;
    font-weight: 800;
    color: var(--brand);
    letter-spacing: 0.03em;
  }
  .brand-header .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--brand);
  }
`;

function wrapPage(title: string, bodyContent: string, extraScript = ""): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<style>${BASE_STYLE}</style>
</head>
<body>
${bodyContent}
${extraScript ? `<script>${extraScript}</script>` : ""}
</body>
</html>`;
}

// ============================================================================
// 頁面 1：確認跳轉頁（GET /r/:token）
// ============================================================================

export function renderConfirmPage(params: {
  token: string;
  targetUrl: string;
  createdAt: number;
  expirationTime: number;
  useEndpoint: string; // Worker 上實際執行銷毀+回傳目標網址的 API 路徑
}): string {
  const { token, targetUrl, createdAt, expirationTime, useEndpoint } = params;

  const createdStr = new Date(createdAt).toLocaleString("zh-TW", {
    hour12: false,
  });
  const expiresAt = new Date(createdAt + expirationTime * 1000).toLocaleString(
    "zh-TW",
    { hour12: false }
  );

  const body = `
<div class="card">
  <div class="brand-header"><span class="dot"></span>OTL 一次性連結</div>
  <div class="icon-circle brand">🔗</div>
  <h1>即將前往目的地</h1>
  <p class="desc">此連結僅能使用一次。確認後，此連結將立即失效，並自動跳轉至下方網址。</p>

  <div class="url-box">
    <span class="label">目標網址</span>
    ${escapeHtml(targetUrl)}
  </div>

  <div class="url-box" style="margin-bottom: 28px;">
    <div class="meta-row"><span>建立時間</span><span>${createdStr}</span></div>
    <div class="meta-row"><span>失效時間</span><span>${expiresAt}</span></div>
  </div>

  <button id="confirmBtn" class="btn btn-primary" onclick="confirmAndRedirect()">
    <span class="spinner"></span>
    <span class="btn-label">確認並前往</span>
  </button>
  <button class="btn btn-secondary" onclick="window.close(); history.back();">
    取消
  </button>

  <div class="footer-note">按下「確認並前往」後，此連結將被銷毀且無法再次使用</div>
</div>
`;

  const script = `
    const TOKEN = ${JSON.stringify(token)};
    const USE_ENDPOINT = ${JSON.stringify(useEndpoint)};

    async function confirmAndRedirect() {
      const btn = document.getElementById('confirmBtn');
      btn.disabled = true;
      btn.classList.add('loading');
      btn.querySelector('.btn-label').textContent = '處理中...';

      try {
        const res = await fetch(USE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: TOKEN })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          btn.querySelector('.btn-label').textContent = '即將跳轉...';
          window.location.replace(data.targetUrl);
        } else {
          showError(data.error || '連結已失效或已被使用');
        }
      } catch (e) {
        showError('網路錯誤，請稍後再試');
      }
    }

    function showError(msg) {
      document.querySelector('.card').innerHTML =
        '<div class="icon-circle danger">⚠️</div>' +
        '<h1>無法完成跳轉</h1>' +
        '<p class="desc">' + msg + '</p>' +
        '<button class="btn btn-secondary" onclick="location.reload()">重新整理</button>';
    }
  `;

  return wrapPage("確認跳轉 - OTL", body, script);
}

// ============================================================================
// 頁面 2：錯誤頁（找不到 / 已使用 / 已過期）
// ============================================================================

export function renderErrorPage(params: {
  reason: "not_found" | "used" | "expired" | "invalid";
}): string {
  const map = {
    not_found: {
      icon: "🔍",
      cls: "warn",
      title: "找不到此連結",
      desc: "此一次性連結不存在，或輸入的令牌有誤，請確認連結是否正確。",
    },
    used: {
      icon: "🔒",
      cls: "danger",
      title: "連結已被使用",
      desc: "此一次性連結先前已被使用過，基於安全考量，每個連結僅能使用一次。",
    },
    expired: {
      icon: "⏰",
      cls: "warn",
      title: "連結已過期",
      desc: "此一次性連結的有效期限已過，請聯絡連結提供者重新產生。",
    },
    invalid: {
      icon: "⚠️",
      cls: "danger",
      title: "無效的請求",
      desc: "缺少必要的參數，請確認連結的完整性。",
    },
  };

  const info = map[params.reason];

  const body = `
<div class="card">
  <div class="brand-header"><span class="dot"></span>OTL 一次性連結</div>
  <div class="icon-circle ${info.cls}">${info.icon}</div>
  <h1>${info.title}</h1>
  <p class="desc" style="margin-bottom: 28px;">${info.desc}</p>
  <div class="url-box" style="text-align:center; margin-bottom: 0;">
    <span class="label">為什麼會這樣？</span>
    一次性連結在被開啟並確認後即會失效，這是為了保護連結內容不被重複存取或轉發濫用。
  </div>
  <div class="footer-note">如需協助，請聯繫連結的提供者</div>
</div>
`;

  return wrapPage(info.title + " - OTL", body);
}

// ============================================================================
// 小工具：HTML escape，避免 XSS
// ============================================================================

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
