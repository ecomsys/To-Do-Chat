const fs = require("fs");
const path = require("path");

const rolesPath = path.join(__dirname, "../config/roles.json");

exports.getRoles = () => {
  const data = fs.readFileSync(rolesPath, "utf8");
  return JSON.parse(data);
};

exports.saveRoles = (roles) => {
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2), "utf8");
};

exports.findRole = (roleName) => {
  const roles = this.getRoles();
  return roles[roleName] || null;
};