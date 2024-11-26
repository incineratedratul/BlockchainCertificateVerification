module.exports = {
  isAuthenticatedApplicant: (req, res, next) => {
    if (req.session.role === "Applicant") {
      return next();
    } else {
      console.log("Wrong User Role Selected");
      res.redirect("/login");
    }
  },
  isAuthenticatedInstitute: (req, res, next) => {
    if (req.session.role === "Institute") {
      return next();
    } else {
      console.log("Wrong User Role Selected");
      res.redirect("/login");
    }
  },
  isAuthenticatedCompany: (req, res, next) => {
    if (req.session.role === "Company") {
      return next();
    } else {
      console.log("Wrong User Role Selected");
      res.redirect("/login");
    }
  },
  isAuthenticatedAdmin: (req, res, next) => {
    if (req.session.role === "Admin") {
      return next();
    } else {
      console.log("Wrong User Role Selected");
      res.redirect("/login");
    }
  },
};
