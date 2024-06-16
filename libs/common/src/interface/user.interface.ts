export interface IUser {
  id: number;
  userName: string;
  password: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}
