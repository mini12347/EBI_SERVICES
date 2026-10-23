require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/service');
const serviceCatalog = require('./data/serviceCatalog');

const seedServices = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI must be configured before seeding services.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    await Service.init();

    const codes = serviceCatalog.map((service) => service.code);
    await Service.bulkWrite(serviceCatalog.map((service) => ({
        updateOne: {
            filter: { code: service.code },
            update: { $set: { ...service, actif: true } },
            upsert: true,
        },
    })));
    const deactivated = await Service.updateMany(
        { code: { $nin: codes } },
        { $set: { actif: false } },
    );

    console.log(`Activated ${serviceCatalog.length} EBI services.`);
    console.log(`Deactivated ${deactivated.modifiedCount} services outside the EBI catalog.`);
};

seedServices()
    .catch((error) => {
        console.error('Service catalog seeding failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
