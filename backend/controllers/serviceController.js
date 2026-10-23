const serviceCatalog = require('../data/serviceCatalog');

exports.getActiveServices = async (req, res) => {
    res.status(200).json(serviceCatalog);
};
