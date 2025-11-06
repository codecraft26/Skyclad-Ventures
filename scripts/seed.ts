import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { TagsService } from '../src/tags/tags.service';
import { DocumentsService } from '../src/documents/documents.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usage } from '../src/actions/schemas/usage.schema';
import { Task } from '../src/webhooks/schemas/task.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tagsService = app.get(TagsService);
  const documentsService = app.get(DocumentsService);
  const usageModel = app.get<Model<Usage>>(getModelToken(Usage.name));
  const taskModel = app.get<Model<Task>>(getModelToken(Task.name));

  console.log('Starting seed...');

  // Create or find user1
  let user1 = await usersService.findByEmail('user1@example.com');
  if (!user1) {
    user1 = await usersService.create('user1@example.com', 'user');
  }

  // Create other demo users
  let user2 = await usersService.findByEmail('user2@example.com');
  if (!user2) {
    user2 = await usersService.create('user2@example.com', 'user');
  }

  let admin = await usersService.findByEmail('admin@example.com');
  if (!admin) {
    admin = await usersService.create('admin@example.com', 'admin');
  }

  let support = await usersService.findByEmail('support@example.com');
  if (!support) {
    support = await usersService.create('support@example.com', 'support');
  }

  let moderator = await usersService.findByEmail('moderator@example.com');
  if (!moderator) {
    moderator = await usersService.create('moderator@example.com', 'moderator');
  }

  console.log('Created demo users');

  // Get user1 ID
  const userId1 = String((user1 as any)._id);

  // Create tags for user1
  const tag1 = await tagsService.findOrCreate('invoices-2025', userId1);
  const tag2 = await tagsService.findOrCreate('contracts', userId1);
  const tag3 = await tagsService.findOrCreate('receipts', userId1);
  const tag4 = await tagsService.findOrCreate('financial', userId1);
  const tag5 = await tagsService.findOrCreate('legal', userId1);
  const tag6 = await tagsService.findOrCreate('important', userId1);
  console.log('Created tags for user1');

  // Create sample documents for user1
  const documents = [
    {
      originalname: 'invoice-001.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Invoice #001\nDate: 2025-01-15\nAmount: $1,234.56\nVendor: ABC Corp\nPayment due: 2025-02-15'),
      primaryTag: 'invoices-2025',
      secondaryTags: ['financial', 'important'],
    },
    {
      originalname: 'invoice-002.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Invoice #002\nDate: 2025-01-20\nAmount: $2,345.67\nVendor: XYZ Inc\nPayment due: 2025-02-20'),
      primaryTag: 'invoices-2025',
      secondaryTags: ['financial'],
    },
    {
      originalname: 'contract-001.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Service Agreement\nParties: Company A and Company B\nDuration: 1 year\nEffective Date: 2025-01-01\nTerms and conditions apply.'),
      primaryTag: 'contracts',
      secondaryTags: ['legal', 'important'],
    },
    {
      originalname: 'receipt-001.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Receipt #001\nDate: 2025-01-10\nAmount: $89.99\nItem: Office Supplies\nPayment Method: Credit Card'),
      primaryTag: 'receipts',
      secondaryTags: ['financial'],
    },
    {
      originalname: 'receipt-002.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Receipt #002\nDate: 2025-01-25\nAmount: $156.78\nItem: Software License\nPayment Method: Credit Card'),
      primaryTag: 'receipts',
      secondaryTags: ['financial'],
    },
    {
      originalname: 'contract-002.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('NDA Agreement\nParties: Company A and Contractor\nConfidentiality Terms\nEffective Date: 2025-01-05'),
      primaryTag: 'contracts',
      secondaryTags: ['legal'],
    },
  ];

  console.log('Creating documents for user1...');
  for (const docData of documents) {
    const file = {
      originalname: docData.originalname,
      mimetype: docData.mimetype,
      buffer: docData.buffer,
    } as Express.Multer.File;

    await documentsService.create(
      file,
      userId1,
      docData.primaryTag,
      docData.secondaryTags,
    );
  }
  console.log(`Created ${documents.length} documents for user1`);

  // Create usage data for user1 (current month)
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await usageModel.findOneAndUpdate(
    { userId: userId1, month, year },
    { $inc: { credits: 25 } },
    { upsert: true, new: true },
  );
  console.log('Created usage data for user1 (25 credits this month)');

  // Create sample tasks for user1
  const today = new Date();
  const tasks = [
    {
      userId: userId1,
      status: 'pending',
      channel: 'email',
      target: 'unsubscribe@spam.com',
      senderId: 'scanner-01:img_001',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      userId: userId1,
      status: 'pending',
      channel: 'url',
      target: 'https://example.com/unsubscribe',
      senderId: 'scanner-02:img_002',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: userId1,
      status: 'completed',
      channel: 'email',
      target: 'stop@newsletter.com',
      senderId: 'scanner-03:img_003',
      createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  await taskModel.insertMany(tasks);
  console.log(`Created ${tasks.length} tasks for user1`);

  console.log('\n=== Seed completed! ===');
  console.log('\nDemo Users:');
  console.log('- user1@example.com (user) - with full data');
  console.log('- user2@example.com (user)');
  console.log('- admin@example.com (admin)');
  console.log('- support@example.com (support)');
  console.log('- moderator@example.com (moderator)');
  console.log('\nData for user1@example.com:');
  console.log('- Tags: invoices-2025, contracts, receipts, financial, legal, important');
  console.log(`- Documents: ${documents.length} documents with various tags`);
  console.log('- Usage: 25 credits this month');
  console.log(`- Tasks: ${tasks.length} tasks (some pending, some completed)`);
  console.log('\nYou can now login with: user1@example.com');
  console.log('Use the token from POST /v1/auth/login to access protected endpoints');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

