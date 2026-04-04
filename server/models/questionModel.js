const fs = require("fs/promises");
const path = require("path");

const getAllQuestions = async () => {
  const questionsPath = path.join(__dirname, "..", "client", "public", "questions.json");
  const data = await fs.readFile(questionsPath, "utf8");
  return JSON.parse(data);
};

module.exports = {
  getAllQuestions,
};
