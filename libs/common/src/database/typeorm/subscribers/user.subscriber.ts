import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { RowsCount } from '../entities/rows-count.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(private readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async afterInsert(event: InsertEvent<User>) {
    const { tableName } = event.metadata;
    const rowsCountRepo = this.dataSource.getRepository(RowsCount);
    let row = await rowsCountRepo.findOne({ where: { tableName } });

    if (row) {
      row.rowCount++;
    } else {
      row = new RowsCount();
      row.tableName = tableName;
      row.rowCount = 1;
    }
    rowsCountRepo.save(row);
  }
}
