const express = require('express');
const cors = require('cors');
const path = require('path');
const port = process.env.PORT || 8080;
const app = express();

global.appRoot = path.resolve(__dirname);
app.use(cors());
app.use(express.static(`${__dirname}/dist/`));
app.get(/.*/, (req, res) => res.sendFile(`${__dirname}/dist/index.html`));

app.listen(port, () => {
  console.log(`Express server started on port ${port}`);
});
