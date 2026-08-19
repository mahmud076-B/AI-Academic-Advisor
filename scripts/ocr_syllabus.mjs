import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYLLABUS_FILE = path.join(__dirname, '../5th_semester_syllabus.pdf');
const OUT_FILE = path.join(__dirname, '../5th_semester_syllabus_ocr.txt');

async function runOCR() {
  console.log('Starting OCR process for syllabus...');
  
  if (!fs.existsSync(SYLLABUS_FILE)) {
    console.error(`Syllabus file not found at ${SYLLABUS_FILE}`);
    process.exit(1);
  }

  const dataBuffer = fs.readFileSync(SYLLABUS_FILE);
  const parser = new PDFParse({ data: dataBuffer });
  
  console.log('Extracting screenshots from PDF...');
  const res = await parser.getScreenshot({ imageBuffer: true, scale: 2.0 });
  
  console.log(`Extracted ${res.pages.length} pages. Starting Tesseract OCR...`);
  
  let fullText = '';
  
  for (let i = 0; i < res.pages.length; i++) {
    console.log(`Processing page ${i + 1} of ${res.pages.length}...`);
    const imgBuffer = res.pages[i].data;
    const { data: { text } } = await Tesseract.recognize(imgBuffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\rProgress: ${(m.progress * 100).toFixed(2)}%`);
        }
      }
    });
    console.log(`\nPage ${i + 1} OCR complete.\n`);
    fullText += text + '\n\n';
  }
  
  // Programmatic correction for MAT 3141 which gets lost across page 7/8 boundary
  fullText = fullText.replace(/Rappaport Pvt Ltd[\s\S]*?Credit: 3\.0/g, 'Rappaport Pvt Ltd\n\nMAT 3141: Statistics and Probability\nCredit: 3.0');
  
  // Fix minor OCR typo for CSE 3101
  fullText = fullText.replace('CSE 3101: C ter Graphics', 'CSE 3101: Computer Graphics');
  
  fs.writeFileSync(OUT_FILE, fullText, 'utf-8');
  console.log(`OCR complete! Saved to ${OUT_FILE}`);
  
  console.log('--- OCR Sample ---');
  console.log(fullText.substring(0, 500));
}

runOCR().catch(console.error);
