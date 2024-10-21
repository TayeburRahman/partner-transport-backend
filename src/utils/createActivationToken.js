const createActivationToken = () => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  return { activationCode };
};

module.exports = createActivationToken;
