import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class RowsCount {
  @PrimaryColumn()
  tableName: string;

  @Column()
  rowCount: number;
}
