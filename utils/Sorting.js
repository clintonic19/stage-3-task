exports.getSortOptions = (sortBy, order) => {
  if (!sortBy) {
    return { created_at: -1 };
  }

  return {
    [sortBy]: order === "desc" ? -1 : 1,
  };
};
