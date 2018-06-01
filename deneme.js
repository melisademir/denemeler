#!/usr/local/bin/node
const ejs = require('ejs');
const path = require('path');
const moment = require('moment');
const showdown = require('showdown');
const Promise = require('bluebird');

showdown.setFlavor('github');

const fs = Promise.promisifyAll(require('fs'));

let filename = process.argv[2];

if (!/\.md$/g.test(filename)) {
    filename = `${filename}.md`;
}

if (!filename) {
    throw new Error('Please specify a filename');
}

const outputFilename = [
    filename.replace(/\.[\w\d]+$/, ''),
    '-',
    moment().format('YYYY-MM-DD'),
    '.html'
].join('');

const basePath = path.join(__dirname, '..', 'assessments');
const inputPath = path.join(basePath, filename);
const templatePath = path.join(basePath, '_output.ejs');
const outputDir = path.join(basePath, 'output');
const outputPath = path.join(outputDir, outputFilename);

const createFolderIfNotExists = dir => {
    return new Promise((resolve, reject) => {
        fs.stat(dir, (err, _) => {
            if (err) {
                if (err.code == 'ENOENT') {
                    return resolve(false);
                }

                return reject(err);
            }

            resolve(true);
        });
    })
    .then(exists => exists || fs.mkdirAsync(dir));
}

createFolderIfNotExists(outputDir)
    .then(_ => fs.readFileAsync(inputPath, 'utf8'))
    .then(content => {
        const converter = new showdown.Converter({
            metadata: true,
            tables: true
        });

        const scoreCard = converter.makeHtml(content);
        const metadata = converter.getMetadata();

        metadata.scoreCard = scoreCard;

        // TODO replace
        return fs.readFileAsync(templatePath, 'utf8')
            .then(html => ejs.render(html, metadata));
    })
    .then(contents => fs.writeFileAsync(outputPath, contents, 'utf8'))
    .then(_ => console.log(`Successfully written file to ${outputFilename}`))
    .catch(console.error.bind(console));
