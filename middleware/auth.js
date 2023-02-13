const connection = require("../koneksi");
const mysql = require("mysql");
const md5 = require("md5");
const response = require("../res");
const jwt = require("jsonwebtoken");
const config = require("../config/secret");
const ip = require("ip");
const Joi = require("joi");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//controller untuk register
exports.registrasi = function (req, res) {
  var post = {
    nama_user: req.body.nama_user,
    username: req.body.username,
    email: req.body.email,
    password: md5(req.body.password),
    role: req.body.role,
  };

  const schema = Joi.object({
    nama_user: Joi.string().min(5).required(),
    username: Joi.string().min(5).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    role: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  var query = "SELECT email FROM ?? WHERE ??=?";
  var table = ["user", "email", post.email];

  var query1 = mysql.format(query, table);

    connection.query(query1, function (error, rows) {
      if (error) {
        console.log(error);
      } else {
        if (rows.length == 0) {
          var query = "INSERT INTO ?? SET ?";
          var table = ["user"];
          var query1 = mysql.format(query, table);
          connection.query(query1, post, function (error, rows) {
            if (error) {
              console.log(error);
            } else {
              response.ok(
                "Berhasil menambahkan data user baru",
                res.status(201)
              );
            }
          });
        } else {
          response.ok("Email sudah terdaftar!", res);
        }
      }
    });
};

//controller untuk login
exports.login = function (req, res) {
  var post = {
    password: req.body.password,
    email: req.body.email,
  };

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
  var table = ["user", "password", md5(post.password), "email", post.email];

  var query1 = mysql.format(query, table);
  connection.query(query1, function (error, rows) {
    if (error) {
      console.log(error);
    } else {
      if (rows.length == 1) {
        var token = jwt.sign({ rows }, config.secret, {
          expiresIn: 1440000,
        });
        id_user = rows[0].id_user;
        role = rows[0].role;

        var data = {
          id_user: id_user,
          access_token: token,
          ip_address: ip.address(),
        };

        var query = "INSERT INTO ?? SET ?";
        var table = ["akses_token"];

        var query1 = mysql.format(query, table);
        connection.query(query1, data, function (error, rows) {
          if (error) {
            console.log(error);
          } else {
            res.json({
              success: true,
              message: "Token JWT tergenerate!",
              token: token,
              currUser: data.id_user,
              role: role,
            });
          }
        });
      } else {
        res.json({
          Error: true,
          Message: "Email atau password salah!",
        });
      }
    }
  });
}

//menampilkan semua data user
exports.user = function (req, res) {
  connection.query(
    'SELECT id_user, email, nama_user, role, username FROM user WHERE role = "admin" OR role = "kasir" OR role = "manager"',
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};
//Menghapus user berdasarkan id
exports.hapususer = function (req, res) {
  var id_user = req.body.id_user;
  connection.query(
    "DELETE FROM user WHERE id_user=?",
    [id_user],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data User", res);
      }
    }
  );
};

//menampilkan semua data menu
exports.menu = function (req, res) {
  connection.query("SELECT * FROM menu", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      response.ok(rows, res);
    }
  });
};

//menampilkan semua data menu berdasarkan id
exports.idmenu = function (req, res) {
  let id_menu = req.params.id_menu;
  connection.query(
    "SELECT * FROM menu WHERE id_menu = ?",
    [id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
}).single("gambar");

//menambahkan data menu
exports.tambahMenu = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  var nama_menu = req.body.nama_menu;
  var jenis = req.body.jenis;
  var deskripsi = req.body.deskripsi;
  var filename = req.file.filename;
  var harga = req.body.harga;

  const schema = Joi.object({
    nama_menu: Joi.string().required(),
    jenis: Joi.string().required(),
    deskripsi: Joi.string().required(),
    harga: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  connection.query(
    "INSERT INTO menu (nama_menu,jenis,deskripsi,filename,harga) VALUES(?,?,?,?,?)",
    [nama_menu, jenis, deskripsi, filename, harga],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Menambahkan Data!", res.status(201));
      }
    }
  );
  });
};

//menampilkan gambar
exports.getGambar = function (req, res) {
  let filename = req.params.filename;
  fs.readFile("uploads/" + filename, function (err, content) {
    if (err) {
      res.writeHead(400, { "Content-type": "text/html" });
      console.log(err);
      res.end("No such image");
    } else {
      //specify the content type in the response will be an image
      res.writeHead(200, { "Content-type": "image/jpg" });
      res.end(content);
    }
  });
};

//mengubah data menu berdasarkan id
exports.ubahmenu = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  var id_menu = req.params.id_menu;
  var nama_menu = req.body.nama_menu;
  var jenis = req.body.jenis;
  var deskripsi = req.body.deskripsi;
  var filename = req.file.filename;
  var harga = req.body.harga;

  const schema = Joi.object({
    nama_menu: Joi.string().required(),
    jenis: Joi.string().required(),
    deskripsi: Joi.string().required(),
    harga: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  connection.query(
    "UPDATE menu SET nama_menu=?, jenis=?, deskripsi=?, filename=?, harga=? WHERE id_menu=?",
    [nama_menu, jenis, deskripsi, filename, harga, id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Ubah Data", res);
      }
    }
  );
  });
};

//Menghapus data menu berdasarkan id
exports.hapusmenu = function (req, res) {
  var id_menu = req.params.id_menu;
  connection.query(
    "DELETE FROM menu WHERE id_menu=?",
    [id_menu],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data", res);
      }
    }
  );
};

//menampilkan semua data meja
exports.meja = function (req, res) {
  connection.query("SELECT * FROM meja", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      response.ok(rows, res);
    }
  });
};

//menampilkan semua data meja berdasarkan id
exports.idmeja = function (req, res) {
  let id_meja = req.params.id_meja;
  connection.query(
    "SELECT * FROM meja WHERE id_meja = ?",
    [id_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

//menambahkan data meja
exports.tambahMeja = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  var nomor_meja = req.body.nomor_meja;

  const schema = Joi.object({
    nomor_meja: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  connection.query(
    "INSERT INTO meja (nomor_meja) VALUES(?)",
    [nomor_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Menambahkan Data!", res.status(201));
      }
    }
  );
  });
};

//mengubah data meja berdasarkan id
exports.ubahmeja = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  var id_meja = req.params.id_meja;
  var nomor_meja = req.body.nomor_meja;

  const schema = Joi.object({
    nomor_meja: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  connection.query(
    "UPDATE meja SET nomor_meja=? WHERE id_meja=?",
    [nomor_meja, id_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Ubah Data", res);
      }
    }
  );
  });
};

//Menghapus data berdasarkan id
exports.hapusmeja = function (req, res) {
  var id_meja = req.params.id_meja;
  connection.query(
    "DELETE FROM meja WHERE id_meja=?",
    [id_meja],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Hapus Data", res);
      }
    }
  );
};

//menampilkan semua data transaksi
exports.transaksi = function (req, res) {
  connection.query("SELECT * FROM transaksi", function (error, rows, fields) {
    if (error) {
      console.log(error);
    } else {
      response.ok(rows, res);
    }
  });
};

//menampilkan semua data transaksi berdasarkan id
exports.idtransaksi = function (req, res) {
  let id_transaksi = req.params.id_transaksi;
  connection.query(
    "SELECT * FROM transaksi WHERE id_transaksi = ?",
    [id_transaksi],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok(rows, res);
      }
    }
  );
};

//menambahkan data transaksi
exports.tambahTransaksi = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  let barang1 = null;
  let barang2 = null;
  let barang3 = null;
  let barang4 = null;
  let barang5 = null;
  let barang6 = null;
  let barang7 = null;
  let barang8 = null;
  let barang9 = null;
  let barang10 = null;

  barang1 = req.body.barang1;
  barang2 = req.body.barang2;
  barang3 = req.body.barang3;
  barang4 = req.body.barang4;
  barang5 = req.body.barang5;
  barang6 = req.body.barang6;
  barang7 = req.body.barang7;
  barang8 = req.body.barang8;
  barang9 = req.body.barang9;
  barang10 = req.body.barang10;

  var id_user = req.body.id_user;
  var id_meja = req.body.id_meja;
  var nama_pelanggan = req.body.nama_pelanggan;
  var status = req.body.status;

  const schema = Joi.object({
    id_user: Joi.string().required(),
    id_meja: Joi.string().required(),
    nama_pelanggan: Joi.string().required(),
    status: Joi.string().required(),
    barang1: Joi.number().required(),
    barang2:Joi.number(),
    barang3:Joi.number(),
    barang4:Joi.number(),
    barang5:Joi.number(),
    barang6:Joi.number(),
    barang7:Joi.number(),
    barang8:Joi.number(),
    barang9:Joi.number(),
    barang10:Joi.number(),


  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  console.log(barang1);
  console.log(barang2);
  console.log(barang3);
  console.log(barang4);
  console.log(barang5);
  console.log(barang6);
  console.log(barang7);
  console.log(barang8);
  console.log(barang9);
  console.log(barang10);

transaksi(
    barang1,
    barang2,
    barang3,
    barang4,
    barang5,
    barang6,
    barang7,
    barang8,
    barang9,
    barang10,
    id_user,
    id_meja,
    nama_pelanggan,
    status,
    function(lastId){
      console.log(lastId)
    }
  );

  console.log(lastId);
  

  // connection.query(
  //   "SELECT id_transaksi FROM transaksi ORDER BY id_transaksi DESC",
  //   function (error, rows, fields) {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       const lastId = rows[0].id_transaksi;
  //       console.log("last id = ", lastId);

    
  //     }
  //   }
  // );

  response.ok("Berhasil Menambahkan Data Transaksi", res);
  });
};

//mengubah data transaksi berdasarkan id
exports.ubahtransaksi = function (req, res) {

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

  var id_transaksi = req.params.id_user;
  var id_user = req.body.id_user;
  var id_meja = req.body.id_meja;
  var nama_pelanggan = req.body.nama_pelanggan;
  var status = req.body.status;

  const schema = Joi.object({
    id_user: Joi.int().required(),
    id_meja: Joi.int().required(),
    nama_pelanggan: Joi.string().required(),
    status: Joi.string().required(),
  });

  const error2 = schema.validate(req.body);
  if (error2.error) {
    return res.status(400).json({
      error: error2.error.details[0].message
    });
  }

  connection.query(
    "UPDATE transaksi SET id_user=?, id_meja=?, nama_pelanggan=?, status=? WHERE id_transaksi=?",
    [id_user, id_meja, nama_pelanggan, status, id_transaksi],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        response.ok("Berhasil Ubah Data", res);
      }
    }
  );
  });
};

function transaksi(
  tr1,
  tr2,
  tr3,
  tr4,
  tr5,
  tr6,
  tr7,
  tr8,
  tr9,
  tr10,
  id_user,
  id_meja,
  nama_pelanggan,
  status,
  callback
) {
  var barang = [tr1, tr2, tr3, tr4, tr5, tr6, tr7, tr8, tr9, tr10];
  var n = 10;

  // barang1 = rows[0].barang1;
  // barang2 = rows[0].barang2;
 

  connection.query(
    "INSERT INTO transaksi (id_user, id_meja, nama_pelanggan, status) VALUES(?,?,?,?)",
    [id_user, id_meja, nama_pelanggan, status],
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        console.log("tambah transaksi berhasil");
      }
    }
  );

  connection.query(
    "SELECT id_transaksi FROM transaksi ORDER BY id_transaksi DESC",
    function (error, rows, fields) {
      if (error) {
        console.log(error);
      } else {
        const lastId = rows[0].id_transaksi;
        console.log("last id = ", lastId);

        for (var i = 0; i < 10; i++) {
          if (barang[i] != undefined) {
            id_tr = barang[i];
            let ngeongg = lastId;
            console.log("mantap", id_tr);

            connection.query(
              "INSERT INTO detail_transaksi (id_transaksi, id_menu, harga) VALUES(?,?,?)",
              [ngeongg, id_tr, null],
              function (error, rows, fields) {
                if (error) {
                  console.log(error);
                } else {
                }
              }
            );
          }
        }

        callback(lastId);
        return lastId;
      }
    }
  );
}
