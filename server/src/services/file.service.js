const fs = require("fs");
const path = require("path");
const uploadDir = path.join(__dirname, "../../uploads");

exports.clearUploadDir = () => {
  const files = fs.readdirSync(uploadDir);
  let deleted = 0;
  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }
  return deleted;
};