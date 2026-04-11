module.exports = {
  setRandomCity,
};

function setRandomCity(context, events, done) {
  const cities = [
    "Colombo",
    "Kandy",
    "Galle",
    "Jaffna",
    "Negombo",
    "Matara",
    "Kurunegala",
  ];

  context.vars.city = cities[Math.floor(Math.random() * cities.length)];
  return done();
}
