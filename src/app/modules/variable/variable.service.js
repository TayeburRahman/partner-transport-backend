const ApiError = require("../../../errors/ApiError"); 
const httpStatus = require("http-status"); 
const Variable = require("./variable.model");

const createVariable = async (req) => {
    const data = req.body;

    if (!data) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Data is missing in the request body!");
    }

    const result = await Variable.create(data)

    return result;
};

const updateVariable = async (req) => { 
    const data = req.body; 
    console.log(data);

    if (!data) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Data is missing in the request body!");
    } 
    const variable = await Variable.findOneAndUpdate({}, data, { new: true });

    if (!variable) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Variable not found!');
      } 
    return variable;
};
 
const VariableService = {
  createVariable,
  updateVariable,
//   updateProfile,
};

module.exports = { VariableService };
