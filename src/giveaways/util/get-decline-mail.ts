export const getDeclineMail = (userName: string, title: string) => {
  return `
    <h1>Giveway deleted</h1>
    <h3>Hello, ${userName}</h3>
    <p>Unfortunately you giveaway "${title}" does not meet our rules. Thus it was deleted.</p>
    <p>All te best,<br>Giveaway - EasyWay</p>
  `;
};
