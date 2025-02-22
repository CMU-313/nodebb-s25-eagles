

const fs = require('fs');
const path = require('path');

const directoryPath = '/home/node/nodebb-s25-eagles'; // Update this to your project directory

function addImportStatement(filePath) {
	const importStatement = "import { describe, expect, test } from '@jest/globals';\n";
	const fileContent = fs.readFileSync(filePath, 'utf8');

	if (!fileContent.includes(importStatement)) {
		const updatedContent = importStatement + fileContent;
		fs.writeFileSync(filePath, updatedContent, 'utf8');
		console.log(`Updated: ${filePath}`);
	} else {
		console.log(`Already updated: ${filePath}`);
	}
}

function processDirectory(directory) {
	fs.readdirSync(directory).forEach((file) => {
		const fullPath = path.join(directory, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			processDirectory(fullPath);
		} else if (file.endsWith('.test.js')) {
			addImportStatement(fullPath);
		}
	});
}

processDirectory(directoryPath);
