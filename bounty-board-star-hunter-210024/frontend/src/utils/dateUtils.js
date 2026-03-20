export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const calculateRemainingTime = (deadline) => {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const diff = deadlineTime - now;
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, total: diff };
};

export const formatRemainingTime = (deadline, lang = 'en') => {
  const remaining = calculateRemainingTime(deadline);
  
  if (!remaining) {
    return lang === 'zh' ? '已过期' : 'Expired';
  }
  
  const { days, hours, minutes } = remaining;
  
  if (lang === 'zh') {
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${minutes}分钟`;
    return `${minutes}分钟`;
  }
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const isExpired = (deadline) => {
  return new Date(deadline).getTime() < new Date().getTime();
};

export const addDaysToDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const getDeadlineTimestamp = (days) => {
  return addDaysToDate(days).getTime();
};

export const validateDeadline = (days) => {
  return days >= 7 && days <= 365;
};

export const calculateDaysLeft = (deadline) => {
  const remaining = calculateRemainingTime(deadline);
  return remaining ? remaining.days : 0;
};

export const getStatusByDeadline = (deadline, completedKills, totalKills) => {
  if (completedKills >= totalKills) return 'completed';
  if (isExpired(deadline)) return 'expired';
  return 'active';
};

export const sortByDeadline = (tasks, ascending = true) => {
  return [...tasks].sort((a, b) => {
    const timeA = calculateRemainingTime(a.deadline)?.total || 0;
    const timeB = calculateRemainingTime(b.deadline)?.total || 0;
    return ascending ? timeA - timeB : timeB - timeA;
  });
};