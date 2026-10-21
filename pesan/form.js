/* =========================================================
   Portoku.pro  -  Form pemesanan (pesan/form.js)
   Ubah pengaturan di blok CONFIG saja.
   ========================================================= */
const CONFIG = {
  // Tempel URL Web App Apps Script (yang berakhiran /exec) di sini:
  API_URL: "PASTE_URL_WEB_APP_APPS_SCRIPT_DI_SINI",
  WA_NUMBER: "62895321868008",
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_FILES: 5,
  MAX_SOCIALS: 8,
  IMAGE_MAX_SIDE: 2200,        // sisi terpanjang foto setelah dikecilkan (px)
  IMAGE_COMPRESS_ABOVE: 1.2 * 1024 * 1024
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const PLATFORMS = ["Instagram", "LinkedIn", "Behance", "Dribbble", "GitHub", "TikTok",
  "YouTube", "X (Twitter)", "Facebook", "Website / Portofolio", "Lainnya"];

let currentStep = 0;
let createdSubmissionId = null;
let uploadedCount = 0;                 // untuk melanjutkan jika koneksi putus di tengah jalan
const clientToken = (crypto.randomUUID ? crypto.randomUUID() : fallbackUuid());

const palette = [
  ["Putih", "#FFFFFF"], ["Off-white", "#F8FAFC"], ["Abu muda", "#E5E7EB"], ["Abu", "#9CA3AF"],
  ["Hitam", "#111827"], ["Navy", "#1E293B"], ["Merah", "#EF4444"], ["Maroon", "#7F1D1D"],
  ["Oranye", "#F97316"], ["Kuning", "#FACC15"], ["Olive", "#737C36"], ["Hijau", "#16A34A"],
  ["Forest", "#166534"], ["Mint", "#A7F3D0"], ["Teal", "#0F766E"], ["Cyan", "#06B6D4"],
  ["Biru", "#3B82F6"], ["Royal blue", "#1D4ED8"], ["Sky blue", "#7DD3FC"], ["Ungu", "#8B5CF6"],
  ["Lavender", "#DDD6FE"], ["Pink", "#EC4899"], ["Rose", "#FDA4AF"], ["Cokelat", "#92400E"],
  ["Beige", "#D6C2A1"], ["Gold", "#C9A227"]
];

/* ---------- util ---------- */
function fallbackUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function el(id) { return document.getElementById(id); }
function val(id) { return el(id).value.trim(); }
function checkedRadio(name) {
  const item = document.querySelector('input[name="' + name + '"]:checked');
  return item ? item.value : "";
}
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
function showStatus(message, type) {
  const box = el("status");
  box.className = "status show " + type;
  box.textContent = message;
}
function clearStatus() { el("status").className = "status"; el("status").textContent = ""; }

/* ---------- palet warna & preview ---------- */
function buildPalettes() {
  document.querySelectorAll("[data-color-group]").forEach(group => {
    const id = group.dataset.colorGroup;
    group.innerHTML = palette.map(([name, hex]) =>
      '<button type="button" class="swatch" data-hex="' + hex + '" aria-label="' + name + " " + hex + '">' +
      '<span class="swatch-color" style="background:' + hex + '"></span>' + escapeHtml(name) + "</button>"
    ).join("");
    group.addEventListener("click", event => {
      const button = event.target.closest("button[data-hex]");
      if (!button) return;
      el(id).value = button.dataset.hex;
      updateColorUI(id);
    });
  });
  ["backgroundColor", "secondaryColor", "accentColor"].forEach(id => {
    el(id).addEventListener("input", () => updateColorUI(id));
    updateColorUI(id);
  });
}
function updateColorUI(id) {
  const color = el(id).value.toUpperCase();
  el(id + "Hex").textContent = color;
  const group = document.querySelector('[data-color-group="' + id + '"]');
  if (group) group.querySelectorAll(".swatch").forEach(button => {
    const selected = button.dataset.hex === color;
    button.classList.toggle("selected", selected);
    button.querySelector(".swatch-color").textContent = selected ? "✓" : "";
  });
  updatePreview();
}
function readableText(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 155 ? "#17231B" : "#FFFFFF";
}
function updatePreview() {
  const bg = el("backgroundColor").value, secondary = el("secondaryColor").value, accent = el("accentColor").value;
  el("themePreview").style.background = bg;
  el("previewNav").style.background = secondary;
  el("previewNav").style.color = readableText(secondary);
  el("previewContact").style.background = accent;
  el("previewContact").style.color = readableText(accent);
  el("previewBody").style.color = secondary;
  el("previewTitle").style.color = secondary;
  el("previewText").style.color = secondary;
  el("previewButton").style.background = accent;
  el("previewButton").style.color = readableText(accent);
}

/* ---------- media sosial (banyak link) ---------- */
function addSocialRow(platform, url) {
  const list = el("socialList");
  if (list.children.length >= CONFIG.MAX_SOCIALS) return;
  const row = document.createElement("div");
  row.className = "social-row";
  row.innerHTML =
    '<select class="s-platform" aria-label="Nama media sosial">' +
      PLATFORMS.map(p => "<option" + (p === platform ? " selected" : "") + ">" + escapeHtml(p) + "</option>").join("") +
    "</select>" +
    '<input class="s-url" type="text" inputmode="url" autocapitalize="none" spellcheck="false" maxlength="300" placeholder="https://instagram.com/namakamu" aria-label="Link media sosial">' +
    '<button type="button" class="icon-btn" aria-label="Hapus link">✕</button>' +
    '<input class="s-custom" type="text" maxlength="40" placeholder="Nama media sosial / situs" aria-label="Nama media sosial lainnya" style="display:none">';
  if (url) row.querySelector(".s-url").value = url;
  const select = row.querySelector(".s-platform"), custom = row.querySelector(".s-custom");
  select.addEventListener("change", () => {
    custom.style.display = select.value === "Lainnya" ? "block" : "none";
    if (select.value === "Lainnya") custom.focus();
  });
  row.querySelector(".icon-btn").addEventListener("click", () => { row.remove(); syncSocialButton(); });
  list.appendChild(row);
  syncSocialButton();
}
function syncSocialButton() {
  const full = el("socialList").children.length >= CONFIG.MAX_SOCIALS;
  el("addSocial").disabled = full;
  el("addSocial").textContent = full ? "Maksimal " + CONFIG.MAX_SOCIALS + " link" : "+ Tambah link";
}
function normalizeUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  let parsed;
  try { parsed = new URL(u); } catch (e) { return null; }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes(".")) return null;
  return u;
}
/** Mengembalikan {items:[{platform,url}], error:string|null}. Baris kosong diabaikan. */
function readSocials() {
  const items = [];
  for (const row of el("socialList").children) {
    const rawUrl = row.querySelector(".s-url").value;
    if (!rawUrl.trim()) continue;
    const url = normalizeUrl(rawUrl);
    if (!url) return { items: [], error: 'Link "' + rawUrl.trim() + '" belum benar. Contoh: https://instagram.com/namakamu' };
    let platform = row.querySelector(".s-platform").value;
    if (platform === "Lainnya") platform = row.querySelector(".s-custom").value.trim() || "Tautan";
    items.push({ platform: platform, url: url });
  }
  return { items: items, error: null };
}

/* ---------- langkah & validasi ---------- */
function updateProgress() {
  document.querySelectorAll(".progress-item").forEach((item, i) => {
    item.classList.toggle("active", i === currentStep);
    item.classList.toggle("done", i < currentStep);
  });
  document.querySelectorAll(".step").forEach((section, i) => section.classList.toggle("active", i === currentStep));
  el("backBtn").style.display = currentStep === 0 ? "none" : "inline-block";
  el("nextBtn").style.display = currentStep === 4 ? "none" : "inline-block";
  el("submitBtn").style.display = currentStep === 4 ? "inline-block" : "none";
  if (currentStep === 4) renderSummary();
  clearStatus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function validateStep() {
  const section = document.querySelector('.step[data-step="' + currentStep + '"]');
  for (const field of section.querySelectorAll("[required]")) {
    if (!field.checkValidity()) { field.reportValidity(); return false; }
  }
  if (currentStep === 0) {
    const slug = val("slug").toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) {
      showStatus("Subdomain harus 1–40 karakter, menggunakan huruf, angka, atau tanda hubung; tanda hubung tidak boleh di awal/akhir.", "error");
      return false;
    }
    el("slug").value = slug;
    const digits = val("phone").replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      showStatus("Nomor WhatsApp harus berisi 9–15 digit.", "error");
      return false;
    }
  }
  if (currentStep === 1) {
    const s = readSocials();
    if (s.error) { showStatus(s.error, "error"); return false; }
  }
  return true;
}

function renderSummary() {
  const socials = readSocials().items;
  const rows = [
    ["Nama", val("name")],
    ["Subdomain", val("slug") + ".portoku.pro"],
    ["Profesi", val("profession")],
    ["Email", val("email")],
    ["Nomor WhatsApp", val("phone")],
    ["Deskripsi", val("bio")],
    ["Pengalaman", val("experience") || "—"],
    ["Keahlian", val("skills") || "—"],
    ["Media sosial", socials.length ? socials.map(s => s.platform + "\n" + s.url).join("\n\n") : "—"],
    ["Paket", checkedRadio("packageName")],
    ["Gaya desain", checkedRadio("designStyle") || "Rekomendasi Portoku"],
    ["Background", el("backgroundColor").value.toUpperCase()],
    ["Warna pendamping", el("secondaryColor").value.toUpperCase()],
    ["Warna aksen", el("accentColor").value.toUpperCase()],
    ["Catatan desain", val("designNotes") || "—"],
    ["Foto profil", el("profilePhoto").files[0] ? el("profilePhoto").files[0].name : "Tidak ada"],
    ["Berkas pendukung", el("referenceFiles").files.length ? Array.from(el("referenceFiles").files).map(f => f.name).join(", ") : "Tidak ada"]
  ];
  el("summary").innerHTML = rows.map(r =>
    '<div class="summary-row"><span>' + escapeHtml(r[0]) + "</span><strong>" + escapeHtml(r[1]) + "</strong></div>").join("");
}

function getFormData() {
  return {
    website: val("website"),
    name: val("name"),
    slug: val("slug").toLowerCase(),
    profession: val("profession"),
    email: val("email"),
    phone: val("phone"),
    bio: val("bio"),
    experience: val("experience"),
    skills: val("skills"),
    socials: readSocials().items,
    packageName: checkedRadio("packageName"),
    designStyle: checkedRadio("designStyle") || "Rekomendasi Portoku",
    backgroundColor: el("backgroundColor").value.toUpperCase(),
    secondaryColor: el("secondaryColor").value.toUpperCase(),
    accentColor: el("accentColor").value.toUpperCase(),
    designNotes: val("designNotes"),
    consent: el("consent").checked
  };
}

/* ---------- berkas ---------- */
function selectedFiles() {
  const files = [];
  const photo = el("profilePhoto").files[0];
  if (photo) files.push({ file: photo, category: "Foto profil" });
  Array.from(el("referenceFiles").files).forEach(f => files.push({ file: f, category: "Berkas pendukung" }));
  return files;
}
function isImage(file) { return /^image\/(jpeg|png|webp)$/.test(file.type); }
function validateFiles(files) {
  if (files.length > CONFIG.MAX_FILES) throw new Error("Maksimal " + CONFIG.MAX_FILES + " file termasuk foto profil.");
  for (const item of files) {
    const f = item.file;
    if (!ALLOWED.includes(f.type)) throw new Error('Format "' + f.name + '" tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.');
    if (!isImage(f) && f.size > CONFIG.MAX_BYTES) throw new Error('File "' + f.name + '" lebih dari 5 MB.');
  }
}
function renderFileList(inputId, listId) {
  const files = Array.from(el(inputId).files);
  const box = el(listId);
  if (!files.length) { box.textContent = "Belum ada file dipilih"; return; }
  box.innerHTML = "<ul>" + files.map(f =>
    "<li><span>" + escapeHtml(f.name) + '</span><span class="size">' + formatSize(f.size) + "</span></li>").join("") + "</ul>";
}
function checkFilesNow() {
  try { validateFiles(selectedFiles()); clearStatus(); }
  catch (e) { showStatus(e.message, "error"); }
}

/** Kecilkan foto besar (HP bisa 5–10 MB) supaya upload cepat dan lolos batas 5 MB. */
async function prepareFile(file) {
  if (!isImage(file) || file.size <= CONFIG.IMAGE_COMPRESS_ABOVE) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, CONFIG.IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.86));
    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  } catch (e) { /* kalau gagal, pakai file asli */ }
  return file;
}
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const r = String(reader.result || ""); resolve(r.substring(r.indexOf(",") + 1)); };
    reader.onerror = () => reject(new Error("Gagal membaca file " + file.name));
    reader.readAsDataURL(file);
  });
}

/* ---------- komunikasi ke Apps Script ---------- */
function apiConfigured() { return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(CONFIG.API_URL); }

async function api(action, payload) {
  if (!apiConfigured()) throw new Error("Alamat server form belum diatur. Hubungi admin Portoku.");
  let res;
  try {
    // text/plain = "simple request": tidak memicu preflight CORS yang tidak didukung Apps Script
    res = await fetch(CONFIG.API_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action: action }, payload))
    });
  } catch (e) {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internetmu lalu coba lagi.");
  }
  let json;
  try { json = await res.json(); } catch (e) { throw new Error("Respons server tidak dikenali. Coba lagi sebentar lagi."); }
  if (!json || json.ok !== true) throw new Error((json && json.error) || "Terjadi kesalahan di server.");
  return json.data;
}

/* ---------- kirim ---------- */
function setBusy(busy) {
  el("submitBtn").disabled = busy;
  el("backBtn").disabled = busy;
  el("nextBtn").disabled = busy;
}

async function submitAll(event) {
  event.preventDefault();
  clearStatus();
  if (!el("consent").checked) { showStatus("Centang persetujuan terlebih dahulu.", "error"); return; }
  let files;
  try { files = selectedFiles(); validateFiles(files); }
  catch (error) { showStatus(error.message, "error"); return; }

  setBusy(true);
  try {
    if (!createdSubmissionId) {
      showStatus("Mengirim data dasar…", "info");
      const draft = await api("create", { token: clientToken, data: getFormData() });
      createdSubmissionId = draft.submissionId;
    }

    for (let i = uploadedCount; i < files.length; i++) {
      const item = files[i];
      showStatus("Menyiapkan berkas " + (i + 1) + " dari " + files.length + ": " + item.file.name, "info");
      const ready = await prepareFile(item.file);
      if (ready.size > CONFIG.MAX_BYTES) throw new Error('File "' + item.file.name + '" masih lebih dari 5 MB setelah dikecilkan.');
      showStatus("Mengunggah berkas " + (i + 1) + " dari " + files.length + ": " + ready.name, "info");
      const base64 = await readFileAsBase64(ready);
      await api("upload", {
        submissionId: createdSubmissionId,
        file: { name: ready.name, mimeType: ready.type, base64: base64, category: item.category }
      });
      uploadedCount = i + 1;
    }

    showStatus("Menyelesaikan pesanan…", "info");
    await api("finalize", { submissionId: createdSubmissionId });
    showSuccess();
  } catch (error) {
    showStatus("Pengiriman belum selesai: " + error.message +
      (createdSubmissionId ? " Datamu sudah tersimpan sebagian. Tekan “Kirim” lagi untuk melanjutkan, tidak perlu mengisi ulang." : ""), "error");
    setBusy(false);
  }
}

function showSuccess() {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  el("actions").style.display = "none";
  el("progress").style.display = "none";
  clearStatus();
  const name = val("name"), slug = val("slug");
  document.querySelector(".hero h1").textContent = "Pesananmu sudah kami terima.";
  el("successTitle").textContent = "Terima kasih, " + name + "!";
  el("successText").textContent = "Data portofoliomu berhasil dikirim. Tim Portoku akan meninjau data dan ketersediaan subdomain " +
    slug + ".portoku.pro sebelum menghubungimu lewat WhatsApp.";
  const msg = "Halo Portoku.pro, saya " + name + ". Saya baru mengisi form pesanan portofolio (subdomain: " + slug +
    ".portoku.pro, paket: " + checkedRadio("packageName") + ").";
  el("successWa").href = "https://wa.me/" + CONFIG.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  el("success").classList.add("show");
  el("success").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- init ---------- */
el("nextBtn").addEventListener("click", () => { if (validateStep() && currentStep < 4) { currentStep++; updateProgress(); } });
el("backBtn").addEventListener("click", () => { if (currentStep > 0) { currentStep--; updateProgress(); } });
el("customerForm").addEventListener("submit", submitAll);
el("addSocial").addEventListener("click", () => addSocialRow("Instagram", ""));
el("slug").addEventListener("input", () => {
  const start = el("slug").selectionStart;
  el("slug").value = el("slug").value.toLowerCase().replace(/[^a-z0-9-]/g, "");
  try { el("slug").setSelectionRange(start, start); } catch (e) { /* abaikan */ }
});
el("profilePhoto").addEventListener("change", () => { renderFileList("profilePhoto", "photoList"); checkFilesNow(); });
el("referenceFiles").addEventListener("change", () => { renderFileList("referenceFiles", "referenceList"); checkFilesNow(); });

// pilih paket otomatis dari tombol di beranda: pesan/?paket=basic | standar | custom
(function preselectPackage() {
  const q = (new URLSearchParams(location.search).get("paket") || "").toLowerCase();
  const map = { basic: "Basic", standar: "Standar", standard: "Standar", custom: "Custom" };
  if (map[q]) {
    const r = document.querySelector('input[name="packageName"][value="' + map[q] + '"]');
    if (r) r.checked = true;
  }
})();

buildPalettes();
addSocialRow("Instagram", "");
updateProgress();
if (!apiConfigured()) {
  const w = el("configWarning");
  w.style.display = "block";
  w.textContent = "Catatan admin: URL Web App Apps Script belum diisi di pesan/form.js (CONFIG.API_URL). Form belum bisa mengirim data.";
}
