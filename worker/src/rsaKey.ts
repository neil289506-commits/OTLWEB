/**
 * OTL Web System - 內建 RSA 公鑰
 *
 * 這是預設公鑰（對應原 Qt 版 RSA/public.pem）。
 * 若要更換金鑰，建議透過 `wrangler secret put RSA_PUBLIC_KEY_PEM`
 * 設定環境變數覆蓋，而不是直接修改這個檔案。
 *
 * 私鑰請勿放在任何前端或 Worker 程式碼中！
 * 私鑰僅用於「有需要解密」的情境（本系統目前不需要，因為 KV 存的是明文 token）。
 */

export const DEFAULT_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAysHnllQqX014wDJNK4VY
P3N/nYFJC5UhefNCLhF1CdkSDBGO8lJ2VcQsifKg5+gpHTPVWgl9vhGGE6oWLqCs
lMalkXEr/j2kCdWftMwWEu77iD6Jtq+d3xx3VuFVmTovw3RqIRd2ITzy2mTf76ty
52H5SeHm4PBvjqSSJRmpklumHi+1/Czp/dU6w+DF7rWDsoXByHg1oI9Tivc2VwDI
X8qc1i01Bk9P/MLxlmekEqCIiK1flcdtD5L6ifk2xmIND5VdaIkZQahEGLaBqOkI
luEP1SsmvZDpaNhjX4HXIdCwWICRwtvzpgRKIqgggF5v9DrIEqDjN9thBSdgWSnw
t6ocXBnpTKGIM6IN8ik1aSSQW2Ki0lm1+MkLUWXyF/FVZM1dmtct1vy2+mQroTVI
k9DZpu9XoAPrgcRujpvpHDm6GUYldWsJRcXvOXINgXYirO8CB2+LdxPGrC5+LK1c
n5A+oidtf+Zm5iLB+YKiCiyXVZVxfEyqcZRMScgpmzuec5lPFCJpN9CnnXqBuTOF
GXx3YmOPD/M26sVgTzsA0sLplPpZK7j095Y7aHJIgYAh2ANCj2Xuy4qd9XR6R1ns
F/qQYsRcgeb/+eslkP/2WHteX1kEOyo5ZifNL3jwLRLHI9l5dpQaWDwIe2Ke8rAv
7ZKXOTjADRcB0aPuF/fMH+kCAwEAAQ==
-----END PUBLIC KEY-----`;
