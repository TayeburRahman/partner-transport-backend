const ApiError = require("../../../errors/ApiError");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");
const { ContactNumber } = require("../manage/manage.model");
const Variable = require("./variable.model");

const calculateBedCosts = async (data) => {
  const requiredFields = ["weightKG", "loadFloorNo", "unloadFloorNo", "distance"];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new ApiError(400, `${field} is required!`);
    }
  }
  const { weightKG, loadFloorNo, unloadFloorNo, distance } = data; 

  const W = weightKG < 100 ? 100 : weightKG;
  const variableData = await Variable.findOne();
  if (!variableData) {
    throw new ApiError(404, 'Variable data not found!');
  }
  const {
    minimumStartFee: MNSF,
    minimumWeightLoad: MNWL,
    minimumDurationFee: MNDF,
    maximumStartFee: MXSF,
    maximumWeightLoad: MXWL,
    maximumDistanceOfFee: MXDF
  } = variableData; 

  const minimumBit = await MNSF + (W * loadFloorNo * MNWL) + (W * unloadFloorNo * MNWL) + (distance * MNDF);
  const maximumBit = await MXSF + (W * loadFloorNo * MXWL) + (W * unloadFloorNo * MXWL) + (distance * MXDF);

  const minimumBed = Math.round(minimumBit)
  const maximumBed = Math.round(maximumBit) 

  return { minimumBed, maximumBed };
};

const convertDollarToPeso = async (price) => {
  if (!price) {
    throw new ApiError(200, "Price is required!");
  }
  const variableData = await Variable.findOne();
  const { perDollarMexicanPeso } = variableData;

  if (!variableData) {
    throw new Error("Variable data not found!");
  }

  const pesoCost = Number(price) * Number(perDollarMexicanPeso);
  return { pesoCost };
};

const convertPesoToDollar = async (price) => {
  if (!price) {
    throw new ApiError(200, "Price is required!");
  }
  const variableData = await Variable.findOne();
  const { perDollarMexicanPeso } = variableData;

  if (!perDollarMexicanPeso) {
    throw new ApiError(200, "Variable data not found!");
  }
  const dollarCost = Number(price) / Number(perDollarMexicanPeso);
  return { dollarCost };
};

const changeContactNumber = async (req) => {
  const { contactNumber } = req.body;
  const { userId, emailAuth } = req.user;

  if (!contactNumber) {
    throw new ApiError(400, "Contact number is required!");
  }

  try {
    const existingContact = await ContactNumber.findOne();

    let result;
    let message;

    if (existingContact) {
      result = await ContactNumber.findOneAndUpdate(
        {},
        { contact: contactNumber },
        { new: true, runValidators: true }
      );
      message = "Contact number updated successfully";
    } else {
      result = await ContactNumber.create({ contact: contactNumber });
      message = "Contact number added successfully";
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `${message} by ${emailAuth}. New contact number: ${contactNumber}.`,
      types: existingContact ? "Update" : "Create",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return {
      message,
      result,
    };
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to change contact number by ${emailAuth}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);

    throw new ApiError(
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while changing the contact number."
    );
  }
};


const getContactNumber = async () => {
  return ContactNumber.findOne({})
}

const getPisoVariable = async () => {
  const result = await Variable.findOne({})
  return result.perDollarMexicanPeso;
}




const VariableCount = {
  calculateBedCosts,
  convertDollarToPeso,
  convertPesoToDollar,
  changeContactNumber,
  getContactNumber,
  getPisoVariable
}

module.exports = VariableCount;
