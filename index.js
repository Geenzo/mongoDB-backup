const mongoose = require('mongoose');
const fs = require('fs');

console.log('launching...')

const mongoString = 'mongodb://localhost/test'

const writeDataToFile = (data) => {
    const currentDate = new Date;
    const dd = currentDate.getDate();
    const mm = currentDate.getMonth()+1; 
    const yyyy = currentDate.getFullYear();
    const currentDataFormattted = `${dd}-${mm}-${yyyy}`;

    fs.writeFile(`${currentDataFormattted}_backup.json`, JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log(`${currentDataFormattted}_backup.json created!`);
        process.exit(0)
    });
}

const retrieveCollectionData = (models) => {
    const documents = models.map(model => { 
        return model.find({}).then(collectionData => {
            return {collectionName: model.modelName, collectionData }
        });
    });

    return Promise.all(documents).then(documentData => {
        writeDataToFile(documentData);
    })
}

const setupModels = (connection, collectionNames) => {
    const models = collectionNames.map(collectionName => connection.model(collectionName, {}, collectionName));
    return retrieveCollectionData(models);
}

mongoose.connect(mongoString, { useNewUrlParser: true }).then(connection => {
    return connection.connection.db.collections().then(collections => {
        const collectionNames = collections.map(collection => collection.s.name);
        return setupModels(connection, collectionNames);
    })
})

