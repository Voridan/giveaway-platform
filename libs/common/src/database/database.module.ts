import { Module } from '@nestjs/common';
import { MongooseModule } from './mongoose/mongoose.module';
import { TypeormModule } from './typeorm/typeorm.module';

@Module({
  imports: [MongooseModule, TypeormModule],
})
export class DatabaseModule {}
