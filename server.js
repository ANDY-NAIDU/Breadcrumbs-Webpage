const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let dataStore = { "data": [] };

// Load existing data from file
fs.readFile('data.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading data file:', err);
  } else {
    try {
      dataStore = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
    }
  }
});

// Save data to file
const saveData = () => {
  fs.writeFile('data.json', JSON.stringify(dataStore, null, 2), (err) => {
    if (err) {
      console.error('Error saving data:', err);
    }
  });
};

// Insert new data into the correct location
const insertData = (dataArray, name, parent) => {
  if (!parent) {
    dataArray.push({ name, children: [] });
  } else {
    for (let item of dataArray) {
      if (item.name === parent) {
        item.children.push({ name, children: [] });
        return;
      } else if (item.children.length > 0) {
        insertData(item.children, name, parent);
      }
    }
  }
};

// Flatten nested data structure with full path
const flattenDataWithFullPath = (dataArray, path = []) => {
  let flatArray = [];
  for (let item of dataArray) {
    const currentPath = [...path, item.name];
    if (item.children.length === 0) {
      flatArray.push({ path: currentPath.join(' - ') });
    }
    if (item.children.length > 0) {
      flatArray = flatArray.concat(flattenDataWithFullPath(item.children, currentPath));
    }
  }
  return flatArray;
};

// Serve the data entry page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Serve the data display page
app.get('/display', (req, res) => {
  res.sendFile(__dirname + '/display.html');
});

// Handle data submission
app.post('/submit', (req, res) => {
  const { name, parent } = req.body;
  insertData(dataStore.data, name, parent);
  saveData();
  res.redirect('/display');
});

// Provide random data with full path for display
app.get('/random-data', (req, res) => {
  const flatData = flattenDataWithFullPath(dataStore.data);
  if (flatData.length === 0) {
    return res.status(404).json({ error: 'No leaf nodes available' });
  }
  const randomData = flatData[Math.floor(Math.random() * flatData.length)];
  res.json(randomData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
