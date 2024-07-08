import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { RowsCount } from '../entities/rows-count.entity';
import { Giveaway } from '../entities';

@EventSubscriber()
export class GiveawaySubscriber implements EntitySubscriberInterface<Giveaway> {
  constructor(private readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Giveaway;
  }

  async afterInsert(event: InsertEvent<Giveaway>) {
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
