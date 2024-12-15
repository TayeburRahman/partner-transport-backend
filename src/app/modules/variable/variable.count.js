const ApiError = require("../../../errors/ApiError");
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

    const minimumBed = await MNSF + (W * loadFloorNo * MNWL) + (W * unloadFloorNo * MNWL) + (distance * MNDF); 
    const maximumBed = await MXSF + (W * loadFloorNo * MXWL) + (W * unloadFloorNo * MXWL) + (distance * MXDF);

    console.log(minimumBed, maximumBed)

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

const changeContactNumber = async ({contactNumber}) => {
    if (!contactNumber) {
      throw new Error("Contact number is required!");
    }
   
    const existingContact = await ContactNumber.findOne();
  
    if (existingContact) { 
      const result = await ContactNumber.findOneAndUpdate(
        {},  
        { contact: contactNumber },  
        { new: true, runValidators: true }  
      );
  
      return {
        message: "Contact number updated successfully",
        result,
      };
    } else { 
      const result = await ContactNumber.create({ contact: contactNumber });
  
      return {
        message: "Contact number added successfully",
        result,
      };
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
