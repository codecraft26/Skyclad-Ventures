import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DocumentsService } from '../src/documents/documents.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentModel, DocumentDocument } from '../src/documents/schemas/document.schema';
import * as fs from 'fs';
import * as path from 'path';
const pdfParseLib = require('pdf-parse');
const PDFParse = pdfParseLib.PDFParse || pdfParseLib;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const documentsService = app.get(DocumentsService);
  const documentModel = app.get<Model<DocumentDocument>>(getModelToken(DocumentModel.name));

  console.log('Starting PDF text extraction for existing documents...');

  // Find all PDF documents
  const pdfDocuments = await documentModel.find({
    mime: 'application/pdf',
  }).exec();

  console.log(`Found ${pdfDocuments.length} PDF documents to process`);

  let processed = 0;
  let failed = 0;

  for (const doc of pdfDocuments) {
    try {
      // Check if textContent looks like binary data (starts with %PDF)
      const currentText = doc.textContent || '';
      if (currentText.startsWith('%PDF') || currentText.length < 100) {
        // Read the file
        const filePath = doc.filePath;
        if (!filePath || !fs.existsSync(filePath)) {
          console.warn(`File not found for document ${doc._id}: ${filePath}`);
          failed++;
          continue;
        }

        const fileBuffer = fs.readFileSync(filePath);

        // Extract text from PDF using PDFParse class
        const parser = new PDFParse({ data: fileBuffer });
        const textData = await parser.getText();
        const extractedText = textData.text || '';

        if (extractedText.length > 0) {
          // Update document with extracted text
          await documentModel.updateOne(
            { _id: doc._id },
            { $set: { textContent: extractedText.substring(0, 100000) } }
          );
          console.log(`✓ Processed: ${doc.filename} (${extractedText.length} chars extracted)`);
          processed++;
        } else {
          console.warn(`⚠ No text extracted from: ${doc.filename}`);
          failed++;
        }
      } else {
        console.log(`⊘ Skipped (already has text): ${doc.filename}`);
      }
    } catch (error) {
      console.error(`✗ Failed to process ${doc.filename}:`, error.message);
      failed++;
    }
  }

  console.log('\n=== Reprocessing completed! ===');
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${pdfDocuments.length - processed - failed}`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Reprocessing failed:', err);
  process.exit(1);
});

