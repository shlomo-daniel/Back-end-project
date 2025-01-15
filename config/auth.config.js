require("dotenv").config();

function configError(message) {
  throw new Error(message);
}

console.log(process.env.JWT_KEY, "process.env.JWT_KEY");

module.exports = {
  jwtKey:
    process.env.JWT_KEY ?? configError("envirment variable JWT_KEY is missing"),
};
