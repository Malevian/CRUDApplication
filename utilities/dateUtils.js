function formatDate(date) {
  if (date === null) return null;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatDateWithTime(date) {
  if (date === null) return null;

  const _date = new Date(date);
  const year = _date.getFullYear();
  const month = (_date.getMonth() + 1).toString().padStart(2, "0");
  const day = _date.getDate().toString().padStart(2, "0");
  const hours = _date.getHours().toString().padStart(2, "0");
  const minutes = _date.getMinutes().toString().padStart(2, "0");
  const seconds = _date.getSeconds().toString().padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = { formatDate, formatDateWithTime };
