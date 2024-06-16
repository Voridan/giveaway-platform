export interface IGiveaway {
  id: number;
  title: string;
  imageUrl: string;
  price: number;
  onModeration: boolean;
  ended: boolean;
  createdAt: Date;
}
