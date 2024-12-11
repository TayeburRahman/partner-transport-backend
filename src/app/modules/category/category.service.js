const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Category = require("./category.model");
const QueryBuilder = require("../../../builder/queryBuilder");

const createCategory = async (payload) => {
  return await Category.create(payload);
};

const updateCategory = async (payload) => {
  const { id, ...others } = payload;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing category id");
  }

  const result = await Category.findByIdAndUpdate(
    id,
    { ...others },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return result;
};

const deleteCategory = async (query) => {
  const { id } = query;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing category id");
  }

  const result = await Category.deleteOne({ _id: id });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return result;
};

const getAllCategory = async (query) => {
  const categoryQuery = new QueryBuilder(Category.find({}), query)
    .search([])
    .filter()
    // .sort()
    // .paginate()
    .fields();

  const result = await categoryQuery.modelQuery;
  const meta = await categoryQuery.countTotal();

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }

  return {
    meta,
    data: result,
  };
};

const CategoryService = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
};

module.exports = CategoryService;
