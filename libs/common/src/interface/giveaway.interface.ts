export interface IGiveaway {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  onModeration: boolean;
  ended: boolean;
  createdAt: Date;
}
