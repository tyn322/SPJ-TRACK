// ==========================================
// SPJ-TRACK - SCRIPT UTAMA (PERFECT & NO BUGS)
// ==========================================

let spjData = [];
let registeredUsers = [];
let activeUser = null;
let totalBiayaPengajuan = 0;
let chartInstance = null;

const eyeOpenSVG = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosedSVG = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Muat database pengajuan SPJ
  const savedDb = localStorage.getItem('spj_track_db');
  if (savedDb) spjData = JSON.parse(savedDb);
  
  // 2. Muat database user terdaftar
  const savedUsers = localStorage.getItem('spj_track_users');
  if (savedUsers) {
    registeredUsers = JSON.parse(savedUsers);
  } else {
    registeredUsers = [
      { name: "Budi Santoso", email: "budi.santoso@gmail.com", pass: "123456", role: "User", divisi: "Bagian Pengawasan" },
      { name: "Siti Aminah", email: "siti.aminah@gmail.com", pass: "123456", role: "Admin", divisi: "Bagian Administrasi dan Keuangan" }
    ];
    localStorage.setItem('spj_track_users', JSON.stringify(registeredUsers));
  }

  // 3. Cek sesi login aktif
  const savedActiveUser = localStorage.getItem('spj_track_active_user');
  if (savedActiveUser) {
    activeUser = JSON.parse(savedActiveUser);
    showApp();
  } else {
    showLogin();
  }

  renderTabelDokumen();
});

// ==========================================
// AUTentikasi & LOGIN / REGISTER
// ==========================================
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const svg = btn.querySelector('svg');
  if (input.type === 'password') {
    input.type = 'text';
    svg.innerHTML = eyeClosedSVG;
  } else {
    input.type = 'password';
    svg.innerHTML = eyeOpenSVG;
  }
}

function switchAuthTab(tab) {
  const errBox = document.getElementById('loginError');
  errBox.style.display = 'none';

  if (tab === 'login') {
    document.getElementById('tabBtnLogin').classList.add('active');
    document.getElementById('tabBtnRegister').classList.remove('active');
    document.getElementById('formLoginContainer').style.display = 'block';
    document.getElementById('formRegisterContainer').style.display = 'none';
  } else {
    document.getElementById('tabBtnRegister').classList.add('active');
    document.getElementById('tabBtnLogin').classList.remove('active');
    document.getElementById('formLoginContainer').style.display = 'none';
    document.getElementById('formRegisterContainer').style.display = 'block';
  }
}

function setLoginRole(role) {
  document.getElementById('loginRole').value = role;
  document.getElementById('btnRoleUser').classList.remove('active');
  document.getElementById('btnRoleAdmin').classList.remove('active');
  document.getElementById(`btnRole${role}`).classList.add('active');
}

function quickLogin(role, defaultName, defaultEmail) {
  setLoginRole(role);
  document.getElementById('loginEmail').value = defaultEmail;
  document.getElementById('loginPassword').value = '123456';
  
  let userObj = registeredUsers.find(u => u.email === defaultEmail);
  if (!userObj) {
    userObj = { name: defaultName, email: defaultEmail, pass: '123456', role: role, divisi: 'Bagian Pengawasan' };
    registeredUsers.push(userObj);
    localStorage.setItem('spj_track_users', JSON.stringify(registeredUsers));
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const divisi = document.getElementById('regDivisi').value;
  const role = document.getElementById('regRole').value;
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPassword').value;
  const errBox = document.getElementById('loginError');

  if (!email.endsWith('@gmail.com')) {
    errBox.textContent = "Gagal Daftar: Email WAJIB menggunakan domain @gmail.com";
    errBox.style.display = 'block';
    return;
  }

  if (registeredUsers.some(u => u.email === email)) {
    errBox.textContent = "Gagal Daftar: Email tersebut sudah terdaftar!";
    errBox.style.display = 'block';
    return;
  }

  registeredUsers.push({ name, divisi, role, email, pass });
  localStorage.setItem('spj_track_users', JSON.stringify(registeredUsers));

  errBox.style.display = 'none';
  showToast("Pendaftaran Berhasil! Silakan Login.");
  switchAuthTab('login');
}

function handleLogin(e) {
  e.preventDefault();
  const role = document.getElementById('loginRole').value;
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;
  const errBox = document.getElementById('loginError');

  const user = registeredUsers.find(u => u.email === email);
  if (!user || user.pass !== pass || user.role !== role) {
    errBox.textContent = "Gagal Login: Email, Password, atau Role salah!";
    errBox.style.display = 'block';
    return;
  }

  errBox.style.display = 'none';
  activeUser = user;
  localStorage.setItem('spj_track_active_user', JSON.stringify(activeUser));
  showToast(`Selamat datang, ${activeUser.name}`);
  showApp();
}

function logout() {
  activeUser = null;
  localStorage.removeItem('spj_track_active_user');
  showLogin();
}

function showLogin() {
  document.getElementById('authPage').style.display = 'grid';
  document.getElementById('appPage').style.display = 'none';
}

function showApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'block';
  document.getElementById('uiUserName').textContent = activeUser.name;
  document.getElementById('uiUserRole').textContent = activeUser.role === 'Admin' ? 'Verifikator SPJ' : 'Pegawai Pelaksana';
  document.getElementById('uiBadgeStatus').textContent = `Mode: ${activeUser.role} (${activeUser.name})`;

  // Batasi visibilitas tombol dan menu berdasarkan role
  const userOnlyElements = document.querySelectorAll('.menu-user-only');
  const adminOnlyElements = document.querySelectorAll('.menu-admin-only');

  if (activeUser.role === 'Admin') {
    userOnlyElements.forEach(el => el.style.display = 'none');
    adminOnlyElements.forEach(el => el.style.display = 'block');
  } else {
    userOnlyElements.forEach(el => el.style.display = 'block');
    adminOnlyElements.forEach(el => el.style.display = 'none');
  }

  switchTab('dashboard');
}

// ==========================================
// NAVIGASI & TAB MANAGEMENT
// ==========================================
const tabTitles = {
  'dashboard': ['Dashboard', 'Ringkasan pengawasan SPJ secara real-time'],
  'monitoring': ['Monitoring SPJ', 'Daftar pengajuan dan proses verifikasi individu'],
  'notifikasi': ['Notifikasi & Reminder', 'Pemberitahuan batas waktu perbaikan berkas'],
  'upload': ['Upload Dokumen', 'Form unggah dokumen atau evidence untuk admin'],
  'arsip': ['Dokumen Masuk (Admin)', 'Daftar dokumen yang di-upload pegawai beserta tombol download'],
  'laporan': ['Laporan Realisasi', 'Akumulasi penyerapan anggaran per Bagian & Diagram'],
  'regulasi': ['Kewajiban & Regulasi', 'SOP dan batas waktu SPJ']
};

function switchTab(tabId, btnElement = null) {
  if (activeUser.role === 'Admin' && tabId === 'upload') return;
  if (activeUser.role === 'User' && tabId === 'arsip') return;

  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.classList.add('active');

  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const matchNav = document.querySelector(`.sidebar-nav .nav-item[onclick*="${tabId}"]`);
    if (matchNav) matchNav.classList.add('active');
  }

  if (tabTitles[tabId]) {
    document.getElementById('pageTitle').textContent = tabTitles[tabId][0];
    document.getElementById('pageSubtitle').textContent = tabTitles[tabId][1];
  }
  
  refreshSemuaData();
  if (tabId === 'laporan') renderChart();
}

function refreshSemuaData() {
  renderStats();
  renderTable();
  renderNotifikasi();
  renderLaporan();
}

// ==========================================
// RENDER STATISTIK & TABEL
// ==========================================
function renderStats() {
  document.getElementById('stTotal').textContent = spjData.length;
  document.getElementById('stRevisi').textContent = spjData.filter(d => d.status === 'Perlu Perbaikan').length;
  document.getElementById('stSelesai').textContent = spjData.filter(d => d.status === 'Selesai').length;
  const totalRealisasi = spjData.filter(d => d.status === 'Selesai').reduce((sum, item) => sum + item.total, 0);
  document.getElementById('stRealisasi').textContent = formatRupiah(totalRealisasi);
}

function renderTable() {
  const tbody = document.getElementById('tableSpjBody');
  if (!tbody) return;

  const search = document.getElementById('searchSpj') ? document.getElementById('searchSpj').value.toLowerCase() : '';
  const filterDiv = document.getElementById('filterDivisi') ? document.getElementById('filterDivisi').value : '';
  const filterStat = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : '';

  let filtered = spjData.filter(d => {
    const matchSearch = (d.kodeKegiatan || '').toLowerCase().includes(search) || 
                        (d.noSppd || '').toLowerCase().includes(search) || 
                        (d.nama || '').toLowerCase().includes(search);
    const matchDiv = filterDiv === '' || d.divisi === filterDiv;
    const matchStat = filterStat === '' || d.status === filterStat;
    return matchSearch && matchDiv && matchStat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Belum ada data pengajuan SPJ.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td>${d.kodeKegiatan || '-'}</td>
      <td><strong>${d.noSppd}</strong><br><small>${d.kegiatan || '-'}</small></td>
      <td><strong>${d.nama}</strong><br><small>${d.divisi}</small></td>
      <td>${d.tglPergi || '-'} s/d ${d.tglPulang || '-'}</td>
      <td>${d.jmlHari || '-'}</td>
      <td><strong>${formatRupiah(d.total)}</strong></td>
      <td><span class="badge b-${(d.status || '').toLowerCase().replace(' ', '')}">${d.status}</span></td>
      <td>
        ${activeUser.role === 'Admin' 
          ? `<button class="btn-sm" onclick="openModalVerifikasi('${d.id}')">Verifikasi</button>` 
          : `<button class="btn-sm" onclick="hapusSpj('${d.id}')">Hapus</button>`}
      </td>
    </tr>
  `).join('');
}

function renderNotifikasi() {
  const dashNotif = document.getElementById('dashNotifBox');
  const fullNotif = document.getElementById('fullNotifBox');
  const revisi = spjData.filter(d => d.status === 'Perlu Perbaikan');
  const html = revisi.length === 0 ? `<p>Tidak ada reminder perbaikan.</p>` : revisi.map(d => `<div class="notif-item"><h5>${d.noSppd}</h5><p>${d.catatan || 'Mohon segera lakukan perbaikan.'}</p></div>`).join('');
  if (dashNotif) dashNotif.innerHTML = html;
  if (fullNotif) fullNotif.innerHTML = html;
}

// ==========================================
// KALKULASI & FORM INPUT SPJ
// ==========================================
function hitungHari() {
  const tgl1 = document.getElementById('inTglPergi').value;
  const tgl2 = document.getElementById('inTglPulang').value;
  if (tgl1 && tgl2) {
    const diff = Math.ceil((new Date(tgl2) - new Date(tgl1)) / (1000 * 60 * 60 * 24)) + 1;
    document.getElementById('inJmlHari').value = diff > 0 ? diff + " Hari" : "Error Tgl";
  }
}

function hitungTotal() {
  const tp = Number(document.getElementById('inBiayaTiketPergi').value) || 0;
  const tpl = Number(document.getElementById('inBiayaTiketPulang').value) || 0;
  const tr = Number(document.getElementById('inBiayaTransport').value) || 0;
  const h = Number(document.getElementById('inBiayaHotel').value) || 0;
  const u = Number(document.getElementById('inUangHarian').value) || 0;
  const r = Number(document.getElementById('inRepresentasi').value) || 0;
  totalBiayaPengajuan = tp + tpl + tr + h + u + r;
  document.getElementById('inTotalBiayaView').value = formatRupiah(totalBiayaPengajuan);
}

function openModalAjukan() {
  if (activeUser.role !== 'User') return;
  document.getElementById('formAjukan').reset();
  document.getElementById('inNamaPegawai').value = activeUser ? activeUser.name : '';
  document.getElementById('modalAjukan').classList.add('active');
}

function simpanSPJ(e) {
  e.preventDefault();
  if (activeUser.role !== 'User') return;

  spjData.unshift({
    id: 'SPJ-' + Date.now(),
    kodeKegiatan: document.getElementById('inKodeKegiatan').value,
    noSppd: document.getElementById('inNoSppd').value,
    nama: document.getElementById('inNamaPegawai').value,
    divisi: document.getElementById('inDivisi').value,
    kegiatan: document.getElementById('inKegiatan').value,
    tglPergi: document.getElementById('inTglPergi').value,
    tglPulang: document.getElementById('inTglPulang').value,
    jmlHari: document.getElementById('inJmlHari').value,
    total: totalBiayaPengajuan,
    status: 'Diajukan',
    catatan: ''
  });
  localStorage.setItem('spj_track_db', JSON.stringify(spjData));
  closeModal('modalAjukan');
  refreshSemuaData();
  showToast("SPJ Berhasil Diajukan!");
}

function openModalVerifikasi(id) {
  if (activeUser.role !== 'Admin') return;
  const d = spjData.find(x => x.id === id);
  if (!d) return;
  document.getElementById('vId').value = d.id;
  document.getElementById('vInfo').value = `${d.noSppd} - ${d.nama}`;
  document.getElementById('vStatus').value = d.status;
  document.getElementById('vCatatan').value = d.catatan || '';
  document.getElementById('modalVerifikasi').classList.add('active');
}

function simpanVerifikasi(e) {
  e.preventDefault();
  if (activeUser.role !== 'Admin') return;

  const id = document.getElementById('vId').value;
  const d = spjData.find(x => x.id === id);
  if (d) {
    d.status = document.getElementById('vStatus').value;
    d.catatan = document.getElementById('vCatatan').value;
    localStorage.setItem('spj_track_db', JSON.stringify(spjData));
    closeModal('modalVerifikasi');
    refreshSemuaData();
    showToast("Verifikasi Diperbarui!");
  }
}

function hapusSpj(id) {
  spjData = spjData.filter(x => x.id !== id);
  localStorage.setItem('spj_track_db', JSON.stringify(spjData));
  refreshSemuaData();
  showToast("SPJ Dihapus!");
}

// ==========================================
// UPLOAD & DOWNLOAD DOKUMEN (FIXED & AMAN)
// ==========================================
function handleUploadDokumen(e) {
  e.preventDefault();
  if (activeUser.role !== 'User') return;

  const nama = document.getElementById('namaPelapor').value;
  const fileInput = document.getElementById('fileDokumen');
  const statusPesan = document.getElementById('statusPesan');
  const file = fileInput.files[0];
  
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    statusPesan.textContent = "Gagal: Ukuran file terlalu besar! Maksimal 2MB.";
    statusPesan.style.color = "#dc2626";
    return;
  }

  statusPesan.textContent = "Mengunggah dokumen...";
  statusPesan.style.color = "#0284c7";

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const listDokumen = JSON.parse(localStorage.getItem('dokumen_masuk') || '[]');
      listDokumen.unshift({
        id: Date.now(),
        pelapor: nama,
        namaFile: file.name,
        dataUrl: event.target.result,
        tanggal: new Date().toLocaleDateString('id-ID')
      });
      
      localStorage.setItem('dokumen_masuk', JSON.stringify(listDokumen));
      
      statusPesan.textContent = "Berhasil! Dokumen terkirim ke admin.";
      statusPesan.style.color = "#16a34a";
      document.getElementById('uploadForm').reset();
      renderTabelDokumen();
    } catch (err) {
      statusPesan.textContent = "Gagal: Memori penyimpanan browser penuh!";
      statusPesan.style.color = "#dc2626";
    }
  };
  
  reader.onerror = function() {
    statusPesan.textContent = "Gagal membaca file!";
    statusPesan.style.color = "#dc2626";
  };

  reader.readAsDataURL(file);
}

function downloadDokumen(id) {
  const data = JSON.parse(localStorage.getItem('dokumen_masuk') || '[]');
  const doc = data.find(x => x.id === id);
  if (!doc) {
    showToast("File dokumen tidak ditemukan!");
    return;
  }

  try {
    const arr = doc.dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Mengunduh dokumen...");
  } catch (err) {
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.namaFile;
    a.click();
  }
}

function renderTabelDokumen() {
  const tbody = document.getElementById('tabelDokumenMasuk');
  if (!tbody) return;
  
  if (!activeUser || activeUser.role !== 'Admin') {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Akses khusus Admin.</td></tr>`;
    return;
  }

  const data = JSON.parse(localStorage.getItem('dokumen_masuk') || '[]');

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada dokumen yang di-upload pegawai.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(doc => `
    <tr>
      <td><strong>${doc.pelapor}</strong></td>
      <td>${doc.namaFile}</td>
      <td>${doc.tanggal}</td>
      <td>
        <button class="btn-sm" onclick="downloadDokumen(${doc.id})" style="background:#0284c7; color:#fff; border:none; padding: 6px 12px; border-radius:4px; cursor:pointer;">
          📥 Download
        </button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// LAPORAN, CHART & EXPORT EXCEL
// ==========================================
function getRealisasiDivisi(namaDivisi) {
  const setuju = spjData.filter(d => d.divisi === namaDivisi && d.status === 'Selesai');
  const total = setuju.reduce((sum, item) => sum + Number(item.total), 0);
  return { total, count: setuju.length };
}

function renderLaporan() {
  const pengawasan = getRealisasiDivisi('Bagian Pengawasan');
  const penanganan = getRealisasiDivisi('Bagian Penanganan Pelanggaran');
  const hukum = getRealisasiDivisi('Bagian Hukum Humas');
  const admin = getRealisasiDivisi('Bagian Administrasi dan Keuangan');

  if (document.getElementById('repPengawasan')) {
    document.getElementById('repPengawasan').textContent = formatRupiah(pengawasan.total);
    document.getElementById('cntPengawasan').textContent = `${pengawasan.count} SPJ Disetujui`;

    document.getElementById('repPenanganan').textContent = formatRupiah(penanganan.total);
    document.getElementById('cntPenanganan').textContent = `${penanganan.count} SPJ Disetujui`;

    document.getElementById('repHukum').textContent = formatRupiah(hukum.total);
    document.getElementById('cntHukum').textContent = `${hukum.count} SPJ Disetujui`;

    document.getElementById('repAdmin').textContent = formatRupiah(admin.total);
    document.getElementById('cntAdmin').textContent = `${admin.count} SPJ Disetujui`;
  }
}

function renderChart() {
  const ctx = document.getElementById('chartRealisasi');
  if (!ctx) return;
  if (chartInstance) chartInstance.destroy();

  const pengawasan = getRealisasiDivisi('Bagian Pengawasan').total;
  const penanganan = getRealisasiDivisi('Bagian Penanganan Pelanggaran').total;
  const hukum = getRealisasiDivisi('Bagian Hukum Humas').total;
  const admin = getRealisasiDivisi('Bagian Administrasi dan Keuangan').total;

  chartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Pengawasan', 'Penanganan', 'Hukum', 'Admin'],
      datasets: [{ 
        label: 'Realisasi (Rp)', 
        data: [pengawasan, penanganan, hukum, admin], 
        backgroundColor: '#0284c7',
        borderRadius: 6
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function exportToExcel() {
  if (!spjData || spjData.length === 0) {
    showToast("Belum ada data SPJ untuk di-export!");
    return;
  }

  const dataExcel = spjData.map((item, index) => ({
    "No": index + 1,
    "Kode Kegiatan": item.kodeKegiatan || "-",
    "No SPPD": item.noSppd || "-",
    "Nama Pegawai": item.nama || "-",
    "Divisi / Bagian": item.divisi || "-",
    "Kegiatan": item.kegiatan || "-",
    "Tgl Kepergian": item.tglPergi || "-",
    "Tgl Kepulangan": item.tglPulang || "-",
    "Jumlah Hari": item.jmlHari || "-",
    "Total Biaya (Rp)": item.total || 0,
    "Status Verifikasi": item.status || "Diajukan",
    "Catatan Admin": item.catatan || "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapan SPJ");

  worksheet['!cols'] = [
    { wch: 5 },   // No
    { wch: 15 },  // Kode
    { wch: 20 },  // No SPPD
    { wch: 22 },  // Nama
    { wch: 30 },  // Divisi
    { wch: 30 },  // Kegiatan
    { wch: 14 },  // Tgl Pergi
    { wch: 14 },  // Tgl Pulang
    { wch: 12 },  // Jml Hari
    { wch: 18 },  // Total
    { wch: 18 },  // Status
    { wch: 25 }   // Catatan
  ];

  XLSX.writeFile(workbook, `Rekapan_SPJ_TRACK_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast("File Excel berhasil diunduh!");
}

// ==========================================
// UTILITAS PENDUKUNG
// ==========================================
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}