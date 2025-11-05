import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { TagsService } from '../src/tags/tags.service';
import { DocumentsService } from '../src/documents/documents.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tagsService = app.get(TagsService);
  const documentsService = app.get(DocumentsService);

  console.log('Starting seed...');

  // Create demo users
  const user1 = await usersService.create('user1@example.com', 'user');
  const user2 = await usersService.create('user2@example.com', 'user');
  const admin = await usersService.create('admin@example.com', 'admin');
  const support = await usersService.create('support@example.com', 'support');
  const moderator = await usersService.create(
    'moderator@example.com',
    'moderator',
  );

  console.log('Created demo users');

  // Create tags for user1
  // Mongoose Document has _id property that needs to be converted to string
  const userId1 = (user1 as any)._id?.toString() || (user1 as any).id;
  const tag1 = await tagsService.create('invoices-2025', userId1);
  const tag2 = await tagsService.create('contracts', userId1);
  const tag3 = await tagsService.create('receipts', userId1);
  console.log('Created tags');

  // Create sample documents for user1
  const doc1 = {
    originalname: 'invoice-001.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('Sample invoice document content'),
  } as Express.Multer.File;

  const doc2 = {
    originalname: 'contract-001.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('Sample contract document content'),
  } as Express.Multer.File;

  const doc3 = {
    originalname: 'receipt-001.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('Sample receipt document content'),
  } as Express.Multer.File;

  await documentsService.create(
    doc1,
    userId1,
    'invoices-2025',
    ['financial'],
  );
  await documentsService.create(
    doc2,
    userId1,
    'contracts',
    ['legal'],
  );
  await documentsService.create(
    doc3,
    userId1,
    'receipts',
    ['financial'],
  );
  console.log('Created sample documents');

  console.log('Seed completed!');
  console.log('\nDemo Users:');
  console.log('- user1@example.com (user)');
  console.log('- user2@example.com (user)');
  console.log('- admin@example.com (admin)');
  console.log('- support@example.com (support)');
  console.log('- moderator@example.com (moderator)');
  console.log('\nDemo Tags for user1:');
  console.log('- invoices-2025');
  console.log('- contracts');
  console.log('- receipts');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

