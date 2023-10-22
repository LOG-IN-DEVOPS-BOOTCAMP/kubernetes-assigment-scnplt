const express = require('express');

const PORT = 8080;

const app = express();

app.get('/', (_, res) => {
  res.send('Hello from web-app - 1!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});