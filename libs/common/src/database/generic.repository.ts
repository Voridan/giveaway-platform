import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { AbstractDocument } from './abstract.document';
import { Logger, NotFoundException } from '@nestjs/common';

export abstract class GenericMongooseRepository<
  TDocument extends AbstractDocument,
> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<TDocument>) {}

  async create(document: Partial<TDocument>): Promise<TDocument> {
    const newDoc = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    const jsonDoc = (await newDoc.save()).toJSON() as TDocument;
    return jsonDoc;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    toPopulate?: string[],
  ): Promise<TDocument> {
    const document = this.model.findOne(filterQuery).lean<TDocument>(true);
    toPopulate?.forEach((field) => document.populate(field));

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    toPopulate?: string[],
  ): Promise<TDocument> {
    const document = this.model
      .findOneAndUpdate(filterQuery, update, {
        new: true,
      })
      .lean<TDocument>(true);

    toPopulate?.forEach((field) => document.populate(field));

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document was not found');
    }

    return document;
  }

  async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    return this.model.find(filterQuery).lean<TDocument[]>(true);
  }

  async updateOne(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ) {
    return this.model.updateOne(filterQuery, update).lean<TDocument>(true);
  }

  async updateMany(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ) {
    return this.model.updateMany(filterQuery, update).lean<TDocument>(true);
  }

  async deleteOne(filterQuery: FilterQuery<TDocument>) {
    return this.model.deleteOne(filterQuery).lean<TDocument>(true);
  }

  async save(document: TDocument): Promise<TDocument> {
    const newDoc = new this.model(document);
    const savedDoc = await newDoc.save();
    return savedDoc.toJSON() as TDocument;
  }
}
