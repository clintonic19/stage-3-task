exports.buildQuery = (params = {}) => {
  const query = {};

  if (params.gender) {
    query.gender = String(params.gender).trim().toLowerCase();
  }

  if (params.age_group) {
    query.age_group = String(params.age_group).trim().toLowerCase();
  }

  if (params.country_id) {
    query.country_id = String(params.country_id).trim().toUpperCase();
  }

  if (params.min_age !== undefined || params.max_age !== undefined) {
    query.age = {};

    if (params.min_age !== undefined) {
      query.age.$gte = Number(params.min_age);
    }

    if (params.max_age !== undefined) {
      query.age.$lte = Number(params.max_age);
    }
  }

  if (params.min_gender_probability !== undefined) {
    query.gender_probability = {
      $gte: Number(params.min_gender_probability),
    };
  }

  if (params.min_country_probability !== undefined) {
    query.country_probability = {
      $gte: Number(params.min_country_probability), // Ensure this is a number
    };
  }

  return query;
};
