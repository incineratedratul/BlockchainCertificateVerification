function isAuthenticatedInstitute(req, res, next) {
  if (req.session.role === "Institute") {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = isAuthenticatedInstitute;
