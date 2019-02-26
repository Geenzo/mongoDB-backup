const mongoose = require('mongoose');
const fs = require('fs');

console.log('launching...')

const mongoString = 'mongodb://localhost/test'

const retrieveCollectionData = (models) => {
    const documents = models.map(model => model.find({}));
    return Promise.all(documents).then(documentData => {
        documentData.forEach((element, i) => {
            fs.writeFile(`collection_${i}.json`, element, (err) => {
                if (err) throw err;
                console.log(`collection_${i}.json created!`);
            });
            
        });

    })
}

const setupModels = (connection, collectionNames) => {
    const models = collectionNames.map(collectionName => connection.model(collectionName, {}, collectionName));
    return retrieveCollectionData(models);
}
mongoose.connect(mongoString).then(connection => {
    return connection.connection.db.collections().then(collections => {
        const collectionNames = collections.map(collection => collection.s.name);
        return setupModels(connection, collectionNames);
    })
})

