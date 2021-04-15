const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const router = express.Router();
router.use(cors()); // libera todas as rotas para acesso por origens diferentes

const knex = require("./dbConfig");

router.get("/", async (req, res) => {
  try {
    const vinhos = await knex("vinhos").orderBy("id", "desc"); // .select() é opcional
    res.status(200).json(vinhos);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

// envio de imagem com configurações avançadas
const storage = multer.diskStorage({
  destination: (req, file, callback) =>
    callback(null, path.resolve(__dirname, "fotos")),
  filename: (req, file, callback) =>
    callback(null, Date.now() + "-" + file.originalname),
});

const fs = require("fs");

const upload2 = multer({ storage });

// rota com envio de imagem do vinho
router.post("/", upload2.single("foto"), async (req, res) => {
  // informações que podem ser obtidas do arquivo enviado
  console.log(req.file.originalname);
  console.log(req.file.filename);
  console.log(req.file.mimetype);
  console.log(req.file.size);

  const { marca, tipo, preco } = req.body;
  const foto = req.file.path; // obtém o caminho do arquivo no server

  if (!marca || !tipo || !preco || !foto) {
    res.status(400).json({ msg: "Informe marca, tipo, preco e foto do vinho" });
    return;
  }

  if (
    (req.file.mimetype != "image/jpeg" && req.file.mimetype != "image/png") ||
    req.file.size > 512 * 1024
  ) {
    fs.unlinkSync(foto); // exclui o arquivo do servidor
    res
      .status(400)
      .json({ msg: "Formato inválido da imagem ou imagem muito grande" });
    return;
  }

  try {
    const novo = await knex("vinhos").insert({ marca, tipo, preco, foto });
    res.status(201).json({ id: novo[0] });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  // para exclusão do registro com id informado
  const id = req.params.id; // ou: const { id } = req.params
  try {
    await knex("vinhos").del().where({ id }); // ou: .where('id', id)
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.put("/:id", async (req, res) => {
  // para alteração do registro com id informado
  const id = req.params.id; // ou: const { id } = req.params
  const { preco } = req.body;
  try {
    await knex("vinhos").update({ preco }).where({ id }); // ou: .where('id', id)
    res.status(200).json();
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/pesq/:palavra", async (req, res) => {
  const { palavra } = req.params;
  try {
    const vinhos = await knex("vinhos")
      .where("marca", "like", `%${palavra}%`)
      .orWhere("tipo", "like", `%${palavra}%`);
    res.status(200).json(vinhos);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/preco/:inicial/:final?", async (req, res) => {
  const { inicial, final } = req.params;
  try {
    let vinhos;
    if (final) {
      vinhos = await knex("vinhos").whereBetween("preco", [inicial, final]);
    } else {
      vinhos = await knex("vinhos").where("preco", ">=", inicial);
    }
    res.status(200).json(vinhos);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.get("/total", async (req, res) => {
  try {
    const consulta = await knex("vinhos")
      .count({ num: "*" })
      .sum({ total: "preco" })
      .min({ menor: "preco" })
      .max({ maior: "preco" })
      .avg({ media: "preco" });
    // desestruturação do objeto retornado em consulta[0] (json)
    const { num, total, menor, maior, media } = consulta[0];
    res.status(200).json({ num, total, menor, maior, media: Number(media).toFixed(2) });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

module.exports = router;
