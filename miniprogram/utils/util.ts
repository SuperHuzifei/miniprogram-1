export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
};

export const formatTime = (date: Date): string => {
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  return [hour, minute].map(formatNumber).join(':');
};

const formatNumber = (n: number): string => {
  return n < 10 ? `0${n}` : `${n}`;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};
