const express = require('express');
const multer = require('multer');

const router = express.Router();

const knex = require('./dbConfig');

const upload = multer({ dest: 'fotos/' })

router.get('/', async (req, res) => {
  try {
    const vinhos = await knex('vinhos').select();
    res.status(200).json(vinhos);
  } catch (error) {
    res.status(400).json({ ok: 0, msg: `Erro na consulta: ${error.message}` });
  }
})

router.post('/', async (req, res) => {
  const { marca, tipo, preco } = req.body;

  try {
    const novo = await knex('vinhos').insert({ marca, tipo, preco });
    res.status(201).json({ ok: 1, msg: 'Inclusão realizada com sucesso...', id: novo[0] });
  } catch (error) {
    res.status(400).json({ ok: 0, msg: `Erro na inclusão: ${error.message}` });
  }
})

// rota com envio de imagem do vinho (upload com a configuração apenas do diretório de destino)
router.post('/foto', upload.single('foto'), async (req, res) => {

  // informações que podem ser obtidas do arquivo enviado
  console.log(req.file.originalname);
  console.log(req.file.filename);
  console.log(req.file.mimetype);
  console.log(req.file.size);

  const { marca, tipo, preco } = req.body;

  try {
    const novo = await knex('vinhos').insert({ marca, tipo, preco });
    res.status(201).json({ ok: 1, msg: 'Inclusão realizada com sucesso...', id: novo[0] });
  } catch (error) {
    res.status(400).json({ ok: 0, msg: `Erro na inclusão: ${error.message}` });
  }
})

// envio de imagem com configurações avançadas
const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, './fotos'),
  filename: (req, file, callback) => callback(null, Date.now() + '-' + file.originalname)
})

const fs = require('fs');

const upload2 = multer({ storage });

// rota com envio de imagem do vinho
router.post('/foto2', upload2.single('foto'), async (req, res) => {

  // informações que podem ser obtidas do arquivo enviado
  console.log(req.file.originalname);
  console.log(req.file.filename);
  console.log(req.file.mimetype);
  console.log(req.file.size);

  const { marca, tipo, preco } = req.body;
  const foto = req.file.path;              // obtém o caminho do arquivo no server

  if (!marca || !tipo || !preco || !foto) {
    res.status(406).json({ ok: 0, msg: 'Informe marca, tipo, preco e foto do vinho' });
    return;
  }

  if ( (req.file.mimetype != 'image/jpeg' && req.file.mimetype != 'image/png') || req.file.size > 512*1024) {
    fs.unlinkSync(foto);                 // exclui o arquivo do servidor
    res.status(406).json({ ok: 0, msg: 'Formato inválido da imagem ou imagem muito grande' });
    return;
  }

  try {
    const novo = await knex('vinhos').insert({ marca, tipo, preco, foto });
    res.status(201).json({ ok: 1, msg: 'Inclusão realizada com sucesso...', id: novo[0] });
  } catch (error) {
    res.status(400).json({ ok: 0, msg: `Erro na inclusão: ${error.message}` });
  }
})


module.exports = router;