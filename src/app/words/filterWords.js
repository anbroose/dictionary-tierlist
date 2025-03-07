const fs = require('fs');
const path = require('path');

// Path to the input .txt file
const inputFilePath = path.join(__dirname, 'words_only.txt');

// Path to the output .json file
const outputFilePath = path.join(__dirname, 'api-filtered-words.json');

// Function to convert .txt to .json
function convertTxtToJson() {
  // Read the content of the .txt file
  fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }

    // Split the content by newlines to get the words
    const words = data.split('\n').map(word => word.trim()).filter(word => word !== "");

    // Write the words array to a .json file
    fs.writeFile(outputFilePath, JSON.stringify(words, null, 2), (err) => {
      if (err) {
        console.error('Error writing the JSON file:', err);
      } else {
        console.log('Successfully converted to words.json');
      }
    });
  });
}

// Run the conversion function
convertTxtToJson();
