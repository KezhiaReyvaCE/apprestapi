var express = require('express');
var auth = require('./auth');
var router = express.Router();
var verifikasi = require('./verifikasi');

//registrasi & login
router.post('/api/v1/registrasi',verifikasi("admin", "superadmin"), auth.registrasi); //
router.post('/api/v1/login', auth.login); //

//user
router.get('/api/v1/user', auth.user);
// router.put('/api/v1/user', verifikasi("admin", "superadmin"),auth.ubahuser);
router.delete('/api/v1/user/:id_user',verifikasi("admin", "superadmin"), auth.hapususer);

//menu
router.get('/api/v1/menu', verifikasi("kasir", "admin", "superadmin"), auth.menu); //
router.get('/api/v1/menu/:id_menu', verifikasi("kasir", "admin", "superadmin"), auth.idmenu); //
router.get('/api/v1/menu/gambar/:filename', auth.getGambar); //
router.post('/api/v1/menu', verifikasi("admin", "superadmin"), auth.tambahMenu); //
router.put('/api/v1/menu/:id_menu', verifikasi("admin", "superadmin"), auth.ubahmenu); //
router.delete('/api/v1/menu/:id_menu', verifikasi("admin", "superadmin"), auth.hapusmenu); //

//meja
router.get('/api/v1/meja', verifikasi("kasir", "admin", "superadmin"), auth.meja); //
router.get('/api/v1/meja/:id_meja', verifikasi("kasir", "admin", "superadmin"), auth.idmeja); //
router.post('/api/v1/meja', verifikasi("admin", "superadmin"), auth.tambahMeja); //
router.put('/api/v1/meja/:id_meja', verifikasi("admin", "superadmin"), auth.ubahmeja); //
router.delete('/api/v1/meja/:id_meja', verifikasi("admin", "superadmin"), auth.hapusmeja); //

//transaksi
router.get('/api/v1/transaksi', verifikasi("kasir", "admin", "superadmin"), auth.transaksi); 
router.get('/api/v1/transaksi/:id_transaksi', verifikasi("kasir", "admin", "superadmin"), auth.idtransaksi); 
router.post('/api/v1/transaksi', verifikasi("admin", "superadmin", "kasir"), auth.tambahTransaksi); 
router.put('/api/v1/transaksi/:id_transaksi', verifikasi("admin", "superadmin", "kasir"), auth.ubahtransaksi);

//log superadmin
// router.get('/api/v1/secret/log', verifikasi("superadmin"), auth.log);
// router.get('/api/v1/secret/flush', verifikasi("superadmin"), auth.flush);

//transaksi
router.post('/api/v1/transaksi')

module.exports = router;