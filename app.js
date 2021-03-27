const express = require('express')
const app = express()

const vinhosRouter = require('./vinhosRouter');

// middleware para aceitar dados no formato json
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/vinhos', vinhosRouter);

app.listen(3000, () => {
  console.log(`Servidor Node.js em execução...`)
})