export const getResetPasswordEmailHtml = (
  userName: string,
  resetLink: string,
) => {
  return `
    <h1>Password Reset</h1>
    <p>Hello, ${userName}</p>
    <p>You requested a password reset. Please click the link below to reset your password:</p>
    <p><a href="${resetLink}" style="padding: 10px; border: 1px solid blue;">Reset Password</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thank you,<br>Giveaway - EasyWay</p>
  `;
};
