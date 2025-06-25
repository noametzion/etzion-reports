export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getNow = () => {
  return new Date().toISOString();
}