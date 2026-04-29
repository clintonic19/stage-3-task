exports.getPagination = (page = 1, limit = 10) => {
  const safePage = Number.parseInt(page, 10) || 1;
  const safeLimit = Number.parseInt(limit, 10) || 10;

  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage,
  };
};
