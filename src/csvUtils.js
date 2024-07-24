const fs = require('fs');
const Papa = require('papaparse');

function readCSV(filePath, callback) {
  const file = fs.createReadStream(filePath);
  Papa.parse(file, {
    header: true,
    complete: function(results) {
      callback(results.data);
    },
  });
}

function writeCSV(filePath, data) {
  const csv = Papa.unparse(data);
  fs.writeFileSync(filePath, csv);
}

module.exports = { readCSV, writeCSV };
