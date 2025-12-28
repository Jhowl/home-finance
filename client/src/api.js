function resolveBase() {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.origin && window.location.origin !== "null") {
      return "";
    }
  }
  return "http://localhost:3000";
}

async function request(url, options = {}) {
  const base = resolveBase();
  const target = `${base}${url}`;
  const res = await fetch(target, options);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export function getJson(url) {
  return request(url);
}

export function postJson(url, payload) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function patchJson(url, payload) {
  return request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteJson(url) {
  return request(url, { method: "DELETE" });
}
