import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { RowsCount } from '../entities/rows-count.entity';
import { Participant } from '../entities';

@EventSubscriber()
export class ParticipantSubscriber
  implements EntitySubscriberInterface<Participant>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Participant;
  }

  async afterInsert(event: InsertEvent<Participant>) {
    const { tableName } = event.metadata;

    const mainCountRepo = event.manager.getRepository(RowsCount);

    let mainRow = await mainCountRepo.findOne({ where: { tableName } });

    if (mainRow) {
      mainRow.rowCount++;
    } else {
      mainRow = new RowsCount();
      mainRow.tableName = tableName;
      mainRow.rowCount = 1;
    }

    mainCountRepo.save(mainRow);
  }
}
