export const checkEmptyObject = (obj: Record<string, unknown>) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};
