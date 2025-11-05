import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
  ) {}

  async findOrCreate(name: string, ownerId: string): Promise<TagDocument> {
    let tag = await this.tagModel.findOne({ name, ownerId }).exec();
    if (!tag) {
      tag = new this.tagModel({ name, ownerId });
      await tag.save();
    }
    return tag;
  }

  async findById(id: string, ownerId: string): Promise<TagDocument> {
    const tag = await this.tagModel.findOne({ _id: id, ownerId }).exec();
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async findAllByOwner(ownerId: string): Promise<TagDocument[]> {
    return this.tagModel.find({ ownerId }).exec();
  }

  async create(name: string, ownerId: string): Promise<TagDocument> {
    try {
      const tag = new this.tagModel({ name, ownerId });
      return await tag.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Tag '${name}' already exists`);
      }
      throw error;
    }
  }
}

