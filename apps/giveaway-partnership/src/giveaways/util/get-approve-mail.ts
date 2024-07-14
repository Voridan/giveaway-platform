export const getApproveMail = (userName: string, title: string) => {
  return `
    <h1>Giveaway Approved</h1>
    <h3>Hello, ${userName}</h3>
    <p>We approved your giveaway "${title}". Yo can find it now in your cabinet.</p>
    <p>All te best,<br>Giveaway - EasyWay</p>
  `;
};
