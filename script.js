let spjData = [];
let registeredUsers = [];
let activeUser = null;
let totalBiayaPengajuan = 0;
let chartInstance = null;

const eyeOpenSVG = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosedSVG = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

document.addEventListener("DOMContentLoaded", () => {
  const savedDb = localStorage.getItem('spj_track_db');
  if (savedDb) spjData = JSON.parse(savedDb);
  
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

  const savedActiveUser = localStorage.getItem('spj_track_active_user');
  if (savedActiveUser) {
    activeUser = JSON.parse(savedActiveUser);
    showApp();
  } else {
    showLogin();
  }

  renderTabelDokumen();
});

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

  // PENGATURAN HAK AKSES BERDASARKAN ROLE (USER VS ADMIN)
  const userOnlyElements = document.querySelectorAll('.menu-user-only');
  const adminOnlyElements = document.querySelectorAll('.menu-admin-only');

  if (activeUser.role === 'Admin') {
    // Admin: Sembunyikan Tombol Pengajuan & Menu Upload Dokumen, Tampilkan Menu Arsip Dokumen Masuk
    userOnlyElements.forEach(el => el.style.display = 'none');
    adminOnlyElements.forEach(el => el.style.display = 'block');
  } else {
    // User: Tampilkan Tombol Pengajuan & Menu Upload Dokumen, Sembunyikan Menu Arsip Dokumen Masuk
    userOnlyElements.forEach(el => el.style.display = 'block');
    adminOnlyElements.forEach(el => el.style.display = 'none');
  }

  switchTab('dashboard');
}

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
  if (spjData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Belum ada data pengajuan SPJ.</td></tr>`;
    return;
  }
  tbody.innerHTML = spjData.map(d => `
    <tr>
      <td>${d.kodeKegiatan || '-'}</td>
      <td><strong>${d.noSppd}</strong><br><small>${d.kegiatan}</small></td>
      <td><strong>${d.nama}</strong><br><small>${d.divisi}</small></td>
      <td>${d.tglPergi} s/d ${d.tglPulang}</td>
      <td>${d.jmlHari} Hari</td>
      <td><strong>${formatRupiah(d.total)}</strong></td>
      <td><span class="badge">${d.status}</span></td>
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
  const html = revisi.length === 0 ? `<p>Tidak ada reminder perbaikan.</p>` : revisi.map(d => `<div class="notif-item"><h5>${d.noSppd}</h5><p>${d.catatan}</p></div>`).join('');
  if (dashNotif) dashNotif.innerHTML = html;
  if (fullNotif) fullNotif.innerHTML = html;
}

function renderLaporan() {
  ['Pengawasan', 'Penanganan', 'Hukum', 'Admin'].forEach(id => {
    const el = document.getElementById(`rep${id}`);
    if (el) el.textContent = formatRupiah(0);
  });
}

function renderChart() {
  const ctx = document.getElementById('chartRealisasi');
  if (!ctx) return;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Pengawasan', 'Penanganan', 'Hukum', 'Admin'],
      datasets: [{ label: 'Realisasi', data: [0, 0, 0, 0], backgroundColor: '#0284c7' }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

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
  document.getElementById('vCatatan').value = d.catatan;
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

function handleUploadDokumen(e) {
  e.preventDefault();
  if (activeUser.role !== 'User') return;

  const nama = document.getElementById('namaPelapor').value;
  const file = document.getElementById('fileDokumen').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const data = JSON.parse(localStorage.getItem('dokumen_masuk') || '[]');
    data.unshift({
      id: Date.now(),
      pelapor: nama,
      namaFile: file.name,
      dataUrl: event.target.result,
      tanggal: new Date().toLocaleDateString('id-ID')
    });
    localStorage.setItem('dokumen_masuk', JSON.stringify(data));
    
    document.getElementById('statusPesan').textContent = "Berhasil! Dokumen terkirim ke admin.";
    document.getElementById('statusPesan').style.color = "#16a34a";
    document.getElementById('uploadForm').reset();
    renderTabelDokumen();
  };
  reader.readAsDataURL(file);
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
        <a href="${doc.dataUrl}" download="${doc.namaFile}" class="btn-sm" style="background:#0284c7; color:#fff; text-decoration:none; padding: 6px 12px; border-radius:4px;">
          📥 Download
        </a>
      </td>
    </tr>
  `).join('');
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}